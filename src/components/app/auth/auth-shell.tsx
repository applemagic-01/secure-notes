// Keeps authentication pages visually consistent while letting each page supply its own form and footer content.

import { GlassBackground } from "@/components/app/background/glass-background";
import { SecureNotesLogo } from "@/components/app/brand/secure-notes-logo";

interface AuthShellProps {
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export function AuthShell({
    children,
    footer,
}: AuthShellProps) {
    return (
        <GlassBackground>
            <main className="flex min-h-screen items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    <div className="mb-8 flex justify-center">
                        <SecureNotesLogo />
                    </div>

                    {children}

                    {footer && (
                        <div className="mt-6 text-center text-sm text-white/60">
                            {footer}
                        </div>
                    )}
                </div>
            </main>
        </GlassBackground>
    );
}