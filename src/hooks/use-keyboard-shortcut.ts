import { useEffect } from "react";

export type Shortcut = {
  /** Combo like "ctrl+shift+p", "ctrl+s", "ctrl+k ctrl+t". */
  combo: string;
  /** Inline sequence combos, e.g. "ctrl+k" then "ctrl+t". */
  sequence?: string;
  callback: (e: KeyboardEvent) => void;
  /** When true, the shortcut still fires inside editable elements. */
  allowInInputs?: boolean;
  /** Skip when the command palette / dialog is open. */
  ignoreWhenModalOpen?: boolean;
};

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/i.test(navigator.platform);

/** Normalize a combo like "Ctrl+Shift+P" or "ctrl+k ctrl+t". */
function normalize(combo: string): string[] {
  return combo
    .toLowerCase()
    .split(/\s+/)
    .map((group) =>
      group
        .split("+")
        .map((part) => part.trim())
        .sort()
        .join("+"),
    );
}

function eventToCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  const ctrl = isMac ? e.metaKey : e.ctrlKey;
  if (ctrl) parts.push("ctrl");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey) parts.push("shift");
  const key = e.key.toLowerCase();
  if (!["control", "meta", "alt", "shift"].includes(key)) {
    parts.push(key);
  }
  return parts.sort().join("+");
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

function isModalOpen(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(
    document.querySelector(
      '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]',
    ),
  );
}

export function useKeyboardShortcut(shortcut: Shortcut) {
  useEffect(() => {
    let lastKeyTime = 0;
    let lastKey = "";

    function handler(e: KeyboardEvent) {
      if (!shortcut.allowInInputs && isEditable(e.target)) return;
      if (shortcut.ignoreWhenModalOpen !== false && isModalOpen()) return;

      const now = Date.now();
      const combo = eventToCombo(e);
      const groups = normalize(shortcut.combo);

      // Sequence shortcut (e.g. ctrl+k then ctrl+t)
      if (groups.length === 2) {
        const [first, second] = groups;
        if (now - lastKeyTime < 1200 && lastKey === first && combo === second) {
          e.preventDefault();
          shortcut.callback(e);
          lastKey = "";
          lastKeyTime = 0;
          return;
        }
        if (combo === first) {
          lastKey = first;
          lastKeyTime = now;
          return;
        }
        lastKey = "";
        lastKeyTime = 0;
        return;
      }

      // Single combo
      if (groups.length === 1 && combo === groups[0]) {
        e.preventDefault();
        shortcut.callback(e);
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcut]);
}
