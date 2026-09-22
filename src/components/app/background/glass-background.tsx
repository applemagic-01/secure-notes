// Provides the shared visual background used across the application without putting any business logic into the presentation layer.

export function GlassBackground({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-[#07111f]">
            {/* Ambient gradients */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />

                <div className="absolute right-[-120px] top-[15%] h-[450px] w-[450px] rounded-full bg-violet-500/20 blur-[120px]" />

                <div className="absolute bottom-[-150px] left-[30%] h-[500px] w-[500px] rounded-full bg-cyan-400/10 blur-[140px]" />
            </div>

            {/* Subtle grid/noise layer */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.035]"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }}
            />

            <div className="relative z-10">{children}</div>
        </div>
    );
}