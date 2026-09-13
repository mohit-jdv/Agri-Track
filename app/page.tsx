"use client";

import { ArrowUpRight, Building2, Leaf } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#F4F0E6] text-[#172019]">
      {/* Navigation */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#173F2A] text-[#F4F0E6]">
            <Leaf size={17} strokeWidth={2} />
          </div>

          <span className="text-lg font-semibold tracking-[-0.04em]">
            AgriTrack
          </span>
        </div>

        <button className="rounded-full border border-[#173F2A]/20 bg-white/30 px-4 py-2 text-sm transition hover:bg-white/60">
          English
        </button>
      </nav>

      {/* Main */}
      <section className="mx-auto flex min-h-[calc(100vh-88px)] max-w-5xl flex-col justify-center px-6 pb-16 pt-8 md:px-10">
        {/* Small label */}
        <div className="mb-8 flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-[#D78A32]" />

          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5F8F45]">
            Smart procurement platform
          </span>
        </div>

        {/* Hero */}
        <div>
          <h1 className="max-w-4xl text-[clamp(4rem,10vw,8rem)] font-semibold leading-[0.84] tracking-[-0.08em]">
            Know your
            <br />
            <span className="text-[#173F2A]">turn.</span>
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-8 text-[#172019]/60 md:text-xl">
            Book your procurement slot, follow the live queue, and track your
            procurement and payment — all in one place.
          </p>
        </div>

        {/* Divider */}
        <div className="my-12 h-px w-full bg-[#173F2A]/15" />

        {/* Role selection */}
        <div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#172019]/45">
            Continue as
          </p>

          <div className="space-y-3">
            {/* Farmer */}
            <button
              onClick={() => router.push("/farmer/login")}
              className="group flex w-full items-center justify-between rounded-[14px] border border-[#173F2A]/20 bg-[#173F2A] px-6 py-5 text-left text-[#F4F0E6] transition-all duration-300 hover:bg-[#204D34] md:px-8 md:py-6"
            >
              <div className="flex items-center gap-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#F4F0E6]/10">
                  <Leaf size={20} strokeWidth={1.8} />
                </div>

                <div>
                  <div className="text-xl font-medium tracking-[-0.03em] md:text-2xl">
                    I&apos;m a Farmer
                  </div>

                  <div className="mt-1 text-sm text-[#F4F0E6]/55">
                    Book slots · Track queue · Follow payment
                  </div>
                </div>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D78A32] text-[#172019] transition-transform duration-300 group-hover:translate-x-1">
                <ArrowUpRight size={20} />
              </div>
            </button>

            {/* Procurement Centre */}
            <button
              onClick={() => router.push("/centre/login")}
              className="group flex w-full items-center justify-between rounded-[14px] border border-[#173F2A]/20 bg-white/35 px-6 py-5 text-left transition-all duration-300 hover:bg-white/70 md:px-8 md:py-6"
            >
              <div className="flex items-center gap-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[#173F2A]/15 bg-[#D9C99A]/25">
                  <Building2 size={20} strokeWidth={1.8} />
                </div>

                <div>
                  <div className="text-xl font-medium tracking-[-0.03em] md:text-2xl">
                    Procurement Centre
                  </div>

                  <div className="mt-1 text-sm text-[#172019]/50">
                    Manage queue · Procurement · Payments
                  </div>
                </div>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#173F2A]/20 text-[#173F2A] transition-all duration-300 group-hover:translate-x-1 group-hover:bg-[#173F2A] group-hover:text-[#F4F0E6]">
                <ArrowUpRight size={20} />
              </div>
            </button>
          </div>
        </div>

        {/* Bottom information */}
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-[0.13em] text-[#172019]/35">
          <span>Slot booking</span>
          <span>Live queues</span>
          <span>Procurement tracking</span>
          <span>Transparent payments</span>
        </div>
      </section>
    </main>
  );
}