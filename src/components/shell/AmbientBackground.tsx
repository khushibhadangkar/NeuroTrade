"use client";

/**
 * Ambient background — layered grid, radial glows, and noise texture.
 * Purely decorative; pointer-events disabled.
 */
export function AmbientBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Fine grid */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(244,239,229,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(244,239,229,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Coarse grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(244,239,229,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(244,239,229,0.12) 1px, transparent 1px)",
          backgroundSize: "192px 192px",
        }}
      />

      {/* Top amber radial glow */}
      <div
        className="absolute inset-x-0 top-0 h-[32rem]"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(183,155,98,0.12), transparent 70%)",
        }}
      />

      {/* Right mint accent glow */}
      <div
        className="absolute right-0 top-1/4 h-[40rem] w-[40rem]"
        style={{
          background:
            "radial-gradient(circle at 100% 50%, rgba(127,154,130,0.06), transparent 60%)",
        }}
      />

      {/* Bottom vignette */}
      <div
        className="absolute inset-x-0 bottom-0 h-64"
        style={{
          background:
            "linear-gradient(to top, rgba(7,7,6,0.8), transparent)",
        }}
      />
    </div>
  );
}
