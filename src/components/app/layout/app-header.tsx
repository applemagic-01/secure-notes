"use client";

// Renders the authenticated workspace header and loads the current user only for display; authorization remains server-side.

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";

import { SecureNotesLogo } from "@/components/app/brand/secure-notes-logo";

interface User {
    id: string;
    email: string;
}

export function AppHeader() {
    const [user, setUser] = useState<User | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        async function loadUser() {
            try {
                const response = await fetch("/api/auth/me");

                if (!response.ok) {
                    return;
                }

                const data = await response.json();

                setUser(data.user);
            } catch {
                // The page can continue rendering even if the
                // user information cannot be loaded.
            }
        }

        loadUser();
    }, []);

    return (
        <>
            <header className="flex h-20 items-center justify-between border-b border-white/10 bg-black/10 px-4 backdrop-blur-2xl sm:px-6 lg:px-8">
                <div className="lg:hidden">
                    <SecureNotesLogo />
                </div>

                <div className="hidden lg:block">
                    <div className="text-sm text-white/50">
                        Secure workspace
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden text-right sm:block">
                        <p className="text-sm font-medium text-white">
                            {user?.email ?? "Loading..."}
                        </p>

                        <p className="text-xs text-white/40">
                            SecureNotes
                        </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-semibold text-white backdrop-blur-xl">
                        {user?.email?.charAt(0).toUpperCase() ?? "?"}
                    </div>

                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen((value) => !value)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white lg:hidden"
                        aria-label="Toggle navigation"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                </div>
            </header>

            {mobileMenuOpen && (
                <div className="border-b border-white/10 bg-black/20 p-4 backdrop-blur-2xl lg:hidden">
                    <p className="text-sm text-white/50">
                        Mobile navigation will be added to the shared
                        application shell.
                    </p>
                </div>
            )}
        </>
    );
}