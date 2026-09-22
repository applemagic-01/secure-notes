"use client";

import {
    AlertTriangle,
    Loader2,
    ShieldAlert,
    X,
} from "lucide-react";

type RevokeShareDialogProps = {
    open: boolean;
    loading?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
};

export function RevokeShareDialog({
    open,
    loading = false,
    onCancel,
    onConfirm,
}: RevokeShareDialogProps) {
    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Backdrop */}
            <button
                type="button"
                aria-label="Close dialog"
                onClick={loading ? undefined : onCancel}
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />

            {/* Dialog */}
            <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#111827]/95 shadow-2xl shadow-black/40 backdrop-blur-2xl">
                {/* Top accent */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-red-400/50 to-transparent" />

                <div className="p-6">
                    {/* Icon */}
                    <div className="flex items-start justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/15 bg-red-400/[0.08]">
                            <ShieldAlert className="h-5 w-5 text-red-300" />
                        </div>

                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                            className="rounded-lg p-2 text-white/35 transition hover:bg-white/[0.05] hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="mt-5">
                        <h2 className="text-lg font-semibold text-white">
                            Revoke share link?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-white/50">
                            Anyone using this link will immediately lose access
                            to the shared note.
                        </p>
                    </div>

                    {/* Warning */}
                    <div className="mt-5 flex gap-3 rounded-xl border border-amber-400/10 bg-amber-400/[0.05] p-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />

                        <p className="text-xs leading-5 text-amber-200/70">
                            This action cannot be undone. You can create a new
                            share link later if needed.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.10] px-4 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-400/[0.16] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}

                            {loading ? "Revoking..." : "Revoke link"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}