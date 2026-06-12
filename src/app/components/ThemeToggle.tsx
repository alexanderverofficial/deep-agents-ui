"use client";

import { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Light/dark switch. The initial class is applied pre-paint by the inline
 * script in layout.tsx; this component only mirrors and toggles it. */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* storage unavailable */
    }
    setIsDark(next);
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={
        isDark ? "Przełącz na tryb jasny" : "Przełącz na tryb ciemny"
      }
      title={isDark ? "Tryb jasny" : "Tryb ciemny"}
      className="h-8 w-8 text-muted-foreground hover:text-foreground"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
