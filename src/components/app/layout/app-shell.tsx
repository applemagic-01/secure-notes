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
            <div className="flex min-h-screen text-white">
                <AppSidebar />

                <div className="flex min-w-0 flex-1 flex-col">
                    <AppHeader />

                    <main className="flex-1 p-4 sm:p-6 lg:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </GlassBackground>
    );
}