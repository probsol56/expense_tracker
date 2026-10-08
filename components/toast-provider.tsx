"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type ToastVariant = "error" | "success";

type ToastMessage = {
    id: number;
    message: string;
    variant: ToastVariant;
};

type ToastContextValue = {
    showToast: (message: string, variant: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const showToast = useCallback((message: string, variant: ToastVariant) => {
        setToast((current) => ({ id: (current?.id ?? 0) + 1, message, variant }));
    }, []);

    useEffect(() => {
        if (!toast) return;
        const timeoutId = window.setTimeout(() => setToast(null), 5000);
        return () => window.clearTimeout(timeoutId);
    }, [toast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <div
                    key={toast.id}
                    role={toast.variant === "error" ? "alert" : "status"}
                    className="fixed right-4 top-4 z-toast flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-lg border border-rule bg-paper p-4 text-fg shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 sm:right-6 sm:top-6"
                >
                    {toast.variant === "error" ? (
                        <AlertCircle size={18} className="mt-0.5 shrink-0 text-brick" aria-hidden="true" />
                    ) : (
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brass-strong" aria-hidden="true" />
                    )}
                    <p className="min-w-0 flex-1 break-words text-sm">{toast.message}</p>
                    <button
                        type="button"
                        aria-label="Dismiss notification"
                        onClick={() => setToast(null)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-fg-muted hover:bg-rule/50 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
                    >
                        <X size={16} aria-hidden="true" />
                    </button>
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within ToastProvider.");
    return context;
}