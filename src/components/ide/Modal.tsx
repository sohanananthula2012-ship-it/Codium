import { type ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-32"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-lg border border-[#3c3c3c] bg-[#252526] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#3c3c3c] px-4 py-2.5">
          <h2 className="text-[13px] font-medium text-white">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-5 w-5 items-center justify-center rounded text-[#858585] hover:bg-[#3c3c3c] hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
