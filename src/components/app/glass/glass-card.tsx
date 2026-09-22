import { cn } from "@/lib/utils";

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
}

export function GlassCard({
    children,
    className,
}: GlassCardProps) {
    return (
        <div
            className={cn(
                "rounded-3xl border border-white/15",
                "bg-white/[0.07]",
                "shadow-[0_20px_60px_rgba(0,0,0,0.20)]",
                "backdrop-blur-xl",
                className
            )}
        >
            {children}
        </div>
    );
}