// Composes the sidebar, header, and scrolling content area into the shared authenticated application layout.

import type { ReactNode } from "react";

import { GlassBackground } from "@/components/app/background/glass-background";
import { AppHeader } from "@/components/app/layout/app-header";
import { AppSidebar } from "@/components/app/layout/app-sidebar";

interface AppShellProps {
    children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    return (
        <GlassBackground>
            <div className="flex h-screen overflow-hidden text-white">
                <AppSidebar />

                <div className="flex min-w-0 min-h-0 flex-1 flex-col">
                    <AppHeader />

                    <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </GlassBackground>
    );
}