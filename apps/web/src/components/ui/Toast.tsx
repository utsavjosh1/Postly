import { useEffect, useState } from "react";
import { useToastStore } from "../../stores/toast.store";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { createPortal } from "react-dom";

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 min-w-[300px] max-w-md px-4 py-3 rounded-lg shadow-lg border border-white/10 animate-in slide-in-from-right-full duration-300 ${
            toast.type === "success"
              ? "bg-zinc-900 text-green-400"
              : toast.type === "error"
                ? "bg-red-950/50 text-red-400 border-red-900/50"
                : toast.type === "warning"
                  ? "bg-yellow-950/50 text-yellow-400 border-yellow-900/50"
                  : "bg-zinc-900 text-zinc-100"
          }`}
        >
          {toast.type === "success" && (
            <CheckCircle className="w-5 h-5 shrink-0" />
          )}
          {toast.type === "error" && (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          {toast.type === "warning" && (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          {toast.type === "info" && <Info className="w-5 h-5 shrink-0" />}

          <p className="text-sm font-medium flex-1">{toast.message}</p>

          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
