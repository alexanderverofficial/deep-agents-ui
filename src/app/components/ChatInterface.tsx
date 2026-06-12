"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  FormEvent,
  Fragment,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Square,
  ArrowUp,
  CheckCircle,
  Clock,
  Circle,
} from "lucide-react";
import { ChatMessage } from "@/app/components/ChatMessage";
import type {
  TodoItem,
  ToolCall,
  ActionRequest,
  ReviewConfig,
} from "@/app/types/types";
import { Assistant, Message } from "@langchain/langgraph-sdk";
import { extractStringFromMessageContent } from "@/app/utils/utils";
import { useChatContext } from "@/providers/ChatProvider";
import { cn } from "@/lib/utils";
import { useStickToBottom } from "use-stick-to-bottom";
import { FilesPopover } from "@/app/components/TasksFilesSidebar";
import { ConfigSidebar } from "@/app/components/ConfigSidebar";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

interface ChatInterfaceProps {
  assistant: Assistant | null;
}

const getStatusIcon = (status: TodoItem["status"], className?: string) => {
  switch (status) {
    case "completed":
      return (
        <CheckCircle
          size={16}
          className={cn("text-success/80", className)}
        />
      );
    case "in_progress":
      return (
        <Clock
          size={16}
          className={cn("text-warning/80", className)}
        />
      );
    default:
      return (
        <Circle
          size={16}
          className={cn("text-tertiary/70", className)}
        />
      );
  }
};

export const ChatInterface = React.memo<ChatInterfaceProps>(({ assistant }) => {
  const [rightTab, setRightTab] = useState<
    "config" | "tasks" | "files"
  >("config");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [input, setInput] = useState("");
  const { scrollRef, contentRef } = useStickToBottom();

  const {
    stream,
    messages,
    todos,
    files,
    ui,
    setFiles,
    isLoading,
    isThreadLoading,
    interrupt,
    sendMessage,
    stopStream,
    resumeInterrupt,
  } = useChatContext();

  const submitDisabled = isLoading || !assistant;

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      if (e) {
        e.preventDefault();
      }
      const messageText = input.trim();
      if (!messageText || isLoading || submitDisabled) return;
      sendMessage(messageText);
      setInput("");
    },
    [input, isLoading, sendMessage, setInput, submitDisabled]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (submitDisabled) return;
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, submitDisabled]
  );

  // Tools that exist ONLY inside specialist subgraphs (no orchestrator owns them).
  // With streamSubgraphs the SDK flattens subgraph messages into stream.messages —
  // these names let us precisely drop specialist-internal traffic from the chat
  // (it is summarized inside the specialist card instead).
  const SPECIALIST_INTERNAL_TOOLS = useMemo(
    () =>
      new Set([
        "search_cpu", "search_ram", "search_storage", "search_psu",
        "search_motherboard", "search_chassis", "search_cooler", "search_gpu",
        "find_compatible_os_box", "SpecialistResult",
      ]),
    []
  );

  // TODO: can we make this part of the hook?
  const processedMessages = useMemo(() => {
    /*
     1. Loop through all messages
     2. For each AI message, add the AI message, and any tool calls to the messageMap
     3. For each tool message, find the corresponding tool call in the messageMap and update the status and output
    */
    const messageMap = new Map<
      string,
      { message: Message; toolCalls: ToolCall[] }
    >();
    // Pre-pass: identify specialist-subgraph messages (ALL their tool calls are
    // specialist-internal) and remember their tool_call_ids so the matching tool
    // results are dropped too.
    const droppedMessageIds = new Set<string>();
    const droppedToolCallIds = new Set<string>();
    messages.forEach((message: Message) => {
      if (message.type !== "ai") return;
      const tcs = Array.isArray(message.tool_calls)
        ? message.tool_calls.filter((tc: { name?: string }) => tc.name !== "")
        : [];
      if (
        tcs.length > 0 &&
        tcs.every((tc: { name?: string }) =>
          SPECIALIST_INTERNAL_TOOLS.has(tc.name || "")
        )
      ) {
        if (message.id) droppedMessageIds.add(message.id);
        tcs.forEach((tc: { id?: string }) => {
          if (tc.id) droppedToolCallIds.add(tc.id);
        });
      }
    });
    messages.forEach((message: Message) => {
      if (message.id && droppedMessageIds.has(message.id)) return;
      if (message.type === "ai") {
        const toolCallsInMessage: Array<{
          id?: string;
          function?: { name?: string; arguments?: unknown };
          name?: string;
          type?: string;
          args?: unknown;
          input?: unknown;
        }> = [];
        if (
          message.additional_kwargs?.tool_calls &&
          Array.isArray(message.additional_kwargs.tool_calls)
        ) {
          toolCallsInMessage.push(...message.additional_kwargs.tool_calls);
        } else if (message.tool_calls && Array.isArray(message.tool_calls)) {
          toolCallsInMessage.push(
            ...message.tool_calls.filter(
              (toolCall: { name?: string }) => toolCall.name !== ""
            )
          );
        } else if (Array.isArray(message.content)) {
          const toolUseBlocks = message.content.filter(
            (block: { type?: string }) => block.type === "tool_use"
          );
          toolCallsInMessage.push(...toolUseBlocks);
        }
        const toolCallsWithStatus = toolCallsInMessage.map(
          (toolCall: {
            id?: string;
            function?: { name?: string; arguments?: unknown };
            name?: string;
            type?: string;
            args?: unknown;
            input?: unknown;
          }) => {
            const name =
              toolCall.function?.name ||
              toolCall.name ||
              toolCall.type ||
              "unknown";
            const args =
              toolCall.function?.arguments ||
              toolCall.args ||
              toolCall.input ||
              {};
            return {
              id: toolCall.id || `tool-${Math.random()}`,
              name,
              args,
              status: interrupt ? "interrupted" : ("pending" as const),
            } as ToolCall;
          }
        );
        messageMap.set(message.id!, {
          message,
          toolCalls: toolCallsWithStatus,
        });
      } else if (message.type === "tool") {
        const toolCallId = message.tool_call_id;
        if (!toolCallId) {
          return;
        }
        if (droppedToolCallIds.has(toolCallId)) {
          return; // result of a specialist-internal call — stays inside the card
        }
        for (const [, data] of messageMap.entries()) {
          const toolCallIndex = data.toolCalls.findIndex(
            (tc: ToolCall) => tc.id === toolCallId
          );
          if (toolCallIndex === -1) {
            continue;
          }
          data.toolCalls[toolCallIndex] = {
            ...data.toolCalls[toolCallIndex],
            status: "completed" as const,
            result: extractStringFromMessageContent(message),
          };
          break;
        }
      } else if (message.type === "human") {
        messageMap.set(message.id!, {
          message,
          toolCalls: [],
        });
      }
    });
    const processedArray = Array.from(messageMap.values());
    return processedArray.map((data, index) => {
      const prevMessage = index > 0 ? processedArray[index - 1].message : null;
      return {
        ...data,
        showAvatar: data.message.type !== prevMessage?.type,
      };
    });
  }, [messages, interrupt, SPECIALIST_INTERNAL_TOOLS]);


  const groupedTodos = {
    in_progress: todos.filter((t) => t.status === "in_progress"),
    pending: todos.filter((t) => t.status === "pending"),
    completed: todos.filter((t) => t.status === "completed"),
  };

  const hasTasks = todos.length > 0;
  const hasFiles = Object.keys(files).length > 0;

  // Parse out any action requests or review configs from the interrupt
  const actionRequestsMap: Map<string, ActionRequest> | null = useMemo(() => {
    const actionRequests =
      interrupt?.value && (interrupt.value as any)["action_requests"];
    if (!actionRequests) return new Map<string, ActionRequest>();
    return new Map(actionRequests.map((ar: ActionRequest) => [ar.name, ar]));
  }, [interrupt]);

  const reviewConfigsMap: Map<string, ReviewConfig> | null = useMemo(() => {
    const reviewConfigs =
      interrupt?.value && (interrupt.value as any)["review_configs"];
    if (!reviewConfigs) return new Map<string, ReviewConfig>();
    return new Map(
      reviewConfigs.map((rc: ReviewConfig) => [rc.actionName, rc])
    );
  }, [interrupt]);

  const renderTasks = () => {
    if (!hasTasks) {
      return (
        <p className="px-[18px] py-3 text-sm text-muted-foreground">
          Brak zadań
        </p>
      );
    }
    return (
      <div className="px-[18px] py-3">
        {Object.entries(groupedTodos)
          .filter(([_, todos]) => todos.length > 0)
          .map(([status, todos]) => (
            <div
              key={status}
              className="mb-4"
            >
              <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-tertiary">
                {
                  {
                    pending: "Pending",
                    in_progress: "In Progress",
                    completed: "Completed",
                  }[status]
                }
              </h3>
              <div className="grid grid-cols-[auto_1fr] gap-3 rounded-sm p-1 pl-0 text-sm">
                {todos.map((todo, index) => (
                  <Fragment key={`${status}_${todo.id}_${index}`}>
                    {getStatusIcon(todo.status, "mt-0.5")}
                    <span className="break-words text-inherit">
                      {todo.content}
                    </span>
                  </Fragment>
                ))}
              </div>
            </div>
          ))}
      </div>
    );
  };

  const renderFiles = () => {
    if (!hasFiles) {
      return (
        <p className="px-[18px] py-3 text-sm text-muted-foreground">
          Brak plików
        </p>
      );
    }
    return (
      <div className="px-[18px] py-3">
        <FilesPopover
          files={files}
          setFiles={setFiles}
          editDisabled={isLoading === true || interrupt !== undefined}
        />
      </div>
    );
  };

  return (
    <ResizablePanelGroup
      direction="horizontal"
      autoSaveId="chat-layout"
      className="flex-1"
    >
      <ResizablePanel
        defaultSize={64}
        minSize={40}
        className="flex flex-col overflow-hidden"
      >
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
          ref={scrollRef}
        >
        <div
          className="mx-auto w-full max-w-[1024px] px-6 pb-6 pt-4"
          ref={contentRef}
        >
          {isThreadLoading ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <>
              {processedMessages.map((data, index) => {
                const messageUi = ui?.filter(
                  (u: any) => u.metadata?.message_id === data.message.id
                );
                const isLastMessage = index === processedMessages.length - 1;
                return (
                  <ChatMessage
                    key={data.message.id}
                    message={data.message}
                    toolCalls={data.toolCalls}
                    isLoading={isLoading}
                    actionRequestsMap={
                      isLastMessage ? actionRequestsMap : undefined
                    }
                    reviewConfigsMap={
                      isLastMessage ? reviewConfigsMap : undefined
                    }
                    ui={messageUi}
                    stream={stream}
                    onResumeInterrupt={resumeInterrupt}
                    graphId={assistant?.graph_id}
                  />
                );
              })}
            </>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 bg-background">
        <div
          className={cn(
            "mx-4 mb-6 flex flex-shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-background",
            "mx-auto w-[calc(100%-32px)] max-w-[1024px] transition-colors duration-200 ease-in-out"
          )}
        >
          <form
            onSubmit={handleSubmit}
            className="flex flex-col"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? "Running..." : "Write your message..."}
              className="font-inherit field-sizing-content flex-1 resize-none border-0 bg-transparent px-[18px] pb-[13px] pt-[14px] text-sm leading-7 text-primary outline-none placeholder:text-tertiary"
              rows={1}
            />
            <div className="flex justify-between gap-2 p-3">
              <div className="flex justify-end gap-2">
                <Button
                  type={isLoading ? "button" : "submit"}
                  variant={isLoading ? "destructive" : "default"}
                  onClick={isLoading ? stopStream : handleSubmit}
                  disabled={!isLoading && (submitDisabled || !input.trim())}
                >
                  {isLoading ? (
                    <>
                      <Square size={14} />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <ArrowUp size={18} />
                      <span>Send</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel
        defaultSize={36}
        minSize={22}
        className="flex min-h-0 flex-col border-l border-border"
      >
        <div className="flex items-stretch border-b border-border text-sm">
          <button
            type="button"
            className={cn("px-3 py-2", rightTab === "config" && "font-semibold")}
            onClick={() => setRightTab("config")}
          >
            Koszyk
          </button>
          <button
            type="button"
            className={cn("px-3 py-2", rightTab === "tasks" && "font-semibold")}
            onClick={() => setRightTab("tasks")}
          >
            Tasks{hasTasks ? ` (${todos.length})` : ""}
          </button>
          <button
            type="button"
            className={cn("px-3 py-2", rightTab === "files" && "font-semibold")}
            onClick={() => setRightTab("files")}
          >
            Files{hasFiles ? ` (${Object.keys(files).length})` : ""}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {rightTab === "config" && <ConfigSidebar />}
          {rightTab === "tasks" && renderTasks()}
          {rightTab === "files" && renderFiles()}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
});

ChatInterface.displayName = "ChatInterface";
