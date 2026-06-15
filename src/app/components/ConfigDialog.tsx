"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StandaloneConfig, getDefaultConfig } from "@/lib/config";

interface ConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: StandaloneConfig) => void;
  initialConfig?: StandaloneConfig;
}

export function ConfigDialog({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: ConfigDialogProps) {
  const [deploymentUrl, setDeploymentUrl] = useState(
    initialConfig?.deploymentUrl || ""
  );
  // The active agent is chosen per-tab via the header selector (URL param), not
  // here — we only carry the value through so it is preserved on save.
  const assistantId = initialConfig?.assistantId || "main-configurator";
  const [langsmithApiKey, setLangsmithApiKey] = useState(
    initialConfig?.langsmithApiKey || ""
  );
  const [configuratorUrl, setConfiguratorUrl] = useState(
    initialConfig?.configuratorUrl || getDefaultConfig().configuratorUrl || ""
  );

  useEffect(() => {
    if (open && initialConfig) {
      setDeploymentUrl(initialConfig.deploymentUrl);
      setLangsmithApiKey(initialConfig.langsmithApiKey || "");
      setConfiguratorUrl(initialConfig.configuratorUrl || getDefaultConfig().configuratorUrl || "");
    }
  }, [open, initialConfig]);

  const handleSave = () => {
    if (!deploymentUrl || !assistantId) {
      alert("Uzupełnij wszystkie wymagane pola");
      return;
    }

    onSave({
      deploymentUrl,
      assistantId,
      langsmithApiKey: langsmithApiKey || undefined,
      configuratorUrl: configuratorUrl || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Ustawienia</DialogTitle>
          <DialogDescription>
            Skonfiguruj połączenie z wdrożeniem LangGraph. Ustawienia są
            zapisywane lokalnie w przeglądarce.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="deploymentUrl">Adres wdrożenia (LangGraph)</Label>
            <Input
              id="deploymentUrl"
              placeholder="https://<deployment-url>"
              value={deploymentUrl}
              onChange={(e) => setDeploymentUrl(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="langsmithApiKey">
              Klucz API LangSmith{" "}
              <span className="text-muted-foreground">(opcjonalnie)</span>
            </Label>
            <Input
              id="langsmithApiKey"
              type="password"
              placeholder="lsv2_pt_..."
              value={langsmithApiKey}
              onChange={(e) => setLangsmithApiKey(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="configuratorUrl">
              Adres konfiguratora{" "}
              <span className="text-muted-foreground">(opcjonalnie)</span>
            </Label>
            <Input
              id="configuratorUrl"
              placeholder="http://host:8100 (lokalnie :18100)"
              value={configuratorUrl}
              onChange={(e) => setConfiguratorUrl(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Anuluj
          </Button>
          <Button onClick={handleSave}>Zapisz</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
