import { LockKeyhole } from "lucide-react";

interface SecureNotesLogoProps {
    showText?: boolean;
    light?: boolean;
}

export function SecureNotesLogo({
    showText = true,
    light = true,
}: SecureNotesLogoProps) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-xl">
                <LockKeyhole
                    className={light ? "h-5 w-5 text-white" : "h-5 w-5 text-slate-900"}
                />
            </div>

            {showText && (
                <span
                    className={
                        light
                            ? "text-base font-semibold tracking-tight text-white"
                            : "text-base font-semibold tracking-tight text-slate-900"
                    }
                >
                    SecureNotes
                </span>
            )}
        </div>
    );
}