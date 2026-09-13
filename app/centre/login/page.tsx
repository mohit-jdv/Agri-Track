"use client";

import { ArrowRight, Building2, Leaf, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CentreLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin() {
    setError("");

    // Demo centre credentials
    if (
      email.trim().toLowerCase() === "centre@agritrack.demo" &&
      password === "123456"
    ) {
      router.push("/centre/dashboard");
      return;
    }

    setError("Invalid centre credentials. Use the demo account shown below.");
  }

  return (
    <main className="min-h-screen bg-[#F4F0E6] text-[#172019]">
      {/* Navbar */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#173F2A] text-[#F4F0E6]">
            <Leaf size={17} strokeWidth={2} />
          </div>

          <span className="text-lg font-semibold tracking-[-0.04em]">
            AgriTrack
          </span>
        </button>

        <button
          onClick={() => router.push("/")}
          className="text-sm text-[#172019]/50 transition hover:text-[#173F2A]"
        >
          Back to role selection
        </button>
      </nav>

      {/* Content */}
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center px-6 py-12 md:px-10">
        <div className="grid w-full gap-12 md:grid-cols-[1fr_420px] md:items-center">
          {/* Intro */}
          <div>
            <div className="mb-7 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#D9C99A]/40">
                <Building2 size={20} />
              </span>

              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5F8F45]">
                Procurement centre
              </span>
            </div>

            <h1 className="max-w-2xl text-5xl font-semibold leading-[0.92] tracking-[-0.06em] md:text-7xl">
              Manage the queue.
              <br />
              <span className="text-[#173F2A]">Keep things moving.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-7 text-[#172019]/55 md:text-lg">
              Manage today's booked farmers, control the live queue, record
              procurement results, and keep payment information up to date.
            </p>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium uppercase tracking-[0.13em] text-[#172019]/35">
              <span>Live queue</span>
              <span>Procurement</span>
              <span>Quality</span>
              <span>Payments</span>
            </div>
          </div>

          {/* Login */}
          <div className="rounded-[18px] border border-[#173F2A]/15 bg-white/45 p-6 shadow-[0_20px_60px_rgba(23,63,42,0.06)] md:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5F8F45]">
                Centre login
              </p>

              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
                Welcome back.
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#172019]/50">
                Sign in to manage your procurement centre.
              </p>
            </div>

            <div className="mt-8 space-y-5">
              {/* Email */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-[#172019]/45">
                  Centre email
                </label>

                <div className="relative">
                  <Mail
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#172019]/35"
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="centre@agritrack.demo"
                    className="h-12 w-full rounded-[11px] border border-[#173F2A]/15 bg-[#F4F0E6]/70 pl-11 pr-4 text-sm outline-none transition placeholder:text-[#172019]/25 focus:border-[#173F2A]/40"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-[#172019]/45">
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#172019]/35"
                  />

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleLogin();
                      }
                    }}
                    className="h-12 w-full rounded-[11px] border border-[#173F2A]/15 bg-[#F4F0E6]/70 pl-11 pr-4 text-sm outline-none transition placeholder:text-[#172019]/25 focus:border-[#173F2A]/40"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-[11px] border border-[#D78A32]/30 bg-[#D78A32]/10 px-4 py-3 text-sm leading-5 text-[#8A541E]">
                  {error}
                </div>
              )}

              {/* Button */}
              <button
                onClick={handleLogin}
                className="group flex h-13 w-full items-center justify-between rounded-[12px] bg-[#173F2A] px-5 text-left text-[#F4F0E6] transition-all duration-300 hover:bg-[#204D34]"
              >
                <span className="font-medium">Continue to centre</span>

                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D78A32] text-[#172019] transition-transform duration-300 group-hover:translate-x-1">
                  <ArrowRight size={18} />
                </span>
              </button>
            </div>

            {/* Demo account */}
            <div className="mt-7 border-t border-[#173F2A]/10 pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#172019]/35">
                Demo account
              </p>

              <div className="mt-3 space-y-1 text-sm">
                <p>
                  <span className="text-[#172019]/45">Email:</span>{" "}
                  <span className="font-medium">
                    centre@agritrack.demo
                  </span>
                </p>

                <p>
                  <span className="text-[#172019]/45">Password:</span>{" "}
                  <span className="font-medium">123456</span>
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-xs leading-5 text-[#172019]/35">
              Demo credentials are for the SIH prototype only.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}