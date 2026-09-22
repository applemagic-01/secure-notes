"use client";

// Provides workspace navigation and logout behavior while deriving the active route from Next.js navigation state.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    FileText,
    LogOut,
    Plus,
    Settings,
    User,
} from "lucide-react";

import { SecureNotesLogo } from "@/components/app/brand/secure-notes-logo";
import { cn } from "@/lib/utils";

const navigation = [
    {
        label: "Notes",
        href: "/notes",
        icon: FileText,
    },
    {
        label: "New Note",
        href: "/notes/new",
        icon: Plus,
    },
    {
        label: "Profile",
        href: "/profile",
        icon: User,
    },
    {
        label: "Settings",
        href: "/settings",
        icon: Settings,
    },
];

export function AppSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    async function handleLogout() {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
            });
        } finally {
            router.push("/login");
            router.refresh();
        }
    }

    return (
        <aside className="hidden h-screen w-64 shrink-0 border-r border-white/10 bg-black/10 backdrop-blur-2xl lg:flex lg:flex-col">
            <div className="flex h-20 items-center px-6">
                <SecureNotesLogo />
            </div>

            <nav className="flex-1 space-y-2 px-4 py-6">
                {navigation.map((item) => {
                    const Icon = item.icon;

                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/notes" &&
                            pathname.startsWith(`${item.href}/`));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-xl px-4 py-3",
                                "text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "border border-white/15 bg-white/12 text-white shadow-lg shadow-black/10"
                                    : "text-white/55 hover:bg-white/8 hover:text-white"
                            )}
                        >
                            <Icon className="h-4 w-4" />

                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-white/10 p-4">
                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/55 transition hover:bg-white/8 hover:text-white"
                >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}