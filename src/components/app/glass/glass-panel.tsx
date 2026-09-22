import { cn } from "@/lib/utils";

interface GlassPanelProps {
    children: React.ReactNode;
    className?: string;
}

export function GlassPanel({
    children,
    className,
}: GlassPanelProps) {
    return (
        <div
            className={cn(
                "border border-white/15",
                "bg-white/[0.06]",
                "backdrop-blur-lg",
                className
            )}
        >
            {children}
        </div>
    );
}