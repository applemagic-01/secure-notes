"use client";

// Confirms destructive note deletion and keeps the user informed while the server request is in progress.

import {
    AlertTriangle,
    Loader2,
    Trash2,
} from "lucide-react";

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";

interface DeleteNoteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    loading?: boolean;
}

export function DeleteNoteDialog({
    open,
    onOpenChange,
    onConfirm,
    loading = false,
}: DeleteNoteDialogProps) {
    return (
        <AlertDialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <AlertDialogContent
                className="
          border border-white/15
          bg-[#101827]/90
          text-white
          shadow-[0_25px_80px_rgba(0,0,0,0.45)]
          backdrop-blur-2xl
        "
            >
                <AlertDialogHeader>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10">
                        <AlertTriangle className="h-5 w-5 text-red-300" />
                    </div>

                    <AlertDialogTitle className="text-xl text-white">
                        Delete this note?
                    </AlertDialogTitle>

                    <AlertDialogDescription className="text-sm leading-6 text-white/55">
                        Are you sure you want to delete this note?
                        This action cannot be undone and the note will
                        be permanently removed.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel
                        disabled={loading}
                        className="
              rounded-xl
              border-white/10
              bg-white/5
              text-white/70
              hover:bg-white/10
              hover:text-white
            "
                    >
                        Cancel
                    </AlertDialogCancel>

                    <Button
                        type="button"
                        disabled={loading}
                        onClick={onConfirm}
                        className="
              rounded-xl
              border border-red-400/20
              bg-red-500/80
              text-white
              shadow-lg
              shadow-red-500/10
              hover:bg-red-500
            "
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Note
                            </>
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}