"use client";

import { ArrowLeft, ArrowRight, Check, Leaf, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Step = "mobile" | "otp" | "profile";

export default function FarmerLogin() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");

  const [name, setName] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("Maharashtra");

  const [error, setError] = useState("");

  // Step 1: Send OTP
  const sendOtp = () => {
    setError("");

    if (mobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setStep("otp");
  };

  // Step 2: Verify OTP
  const verifyOtp = () => {
    setError("");

    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    if (otp !== "123456") {
      setError("Incorrect OTP. Use 123456 for demo.");
      return;
    }

    // Existing demo farmer
    if (mobile === "9876543210") {
      router.push("/dashboard");
      return;
    }

    // New farmer
    setStep("profile");
  };

  // Step 3: Complete farmer profile
  const completeProfile = () => {
    setError("");

    if (name.trim() === "") {
      setError("Please enter your full name.");
      return;
    }

    if (village.trim() === "") {
      setError("Please enter your village.");
      return;
    }

    if (district.trim() === "") {
      setError("Please enter your district.");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-[#F4F0E6] text-[#172019]">
      {/* Navbar */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <button
          type="button"
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

        <span className="text-sm text-[#172019]/45">
          Farmer access
        </span>
      </nav>

      {/* Main */}
      <section className="mx-auto flex min-h-[calc(100vh-100px)] max-w-5xl items-center px-6 pb-16 md:px-10">
        <div className="grid w-full gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          {/* Left section */}
          <div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mb-10 flex items-center gap-2 text-sm text-[#172019]/50 transition hover:text-[#173F2A]"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="mb-7 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#D78A32]" />

              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5F8F45]">
                Farmer access
              </span>
            </div>

            <h1 className="text-[clamp(3.5rem,7vw,6rem)] font-semibold leading-[0.88] tracking-[-0.075em]">
              Your farm.
              <br />
              <span className="text-[#173F2A]">Your turn.</span>
            </h1>

            <p className="mt-8 max-w-md text-base leading-7 text-[#172019]/55">
              Sign in to book procurement slots, follow your queue and track
              your procurement and payment.
            </p>

            {/* Progress */}
            <div className="mt-10 flex items-center gap-3">
              <ProgressStep
                number="01"
                label="Mobile"
                active={step === "mobile"}
                completed={step !== "mobile"}
              />

              <div className="h-px w-8 bg-[#173F2A]/15" />

              <ProgressStep
                number="02"
                label="Verify"
                active={step === "otp"}
                completed={step === "profile"}
              />

              <div className="h-px w-8 bg-[#173F2A]/15" />

              <ProgressStep
                number="03"
                label="Profile"
                active={step === "profile"}
                completed={false}
              />
            </div>
          </div>

          {/* Right section */}
          <div className="rounded-[16px] border border-[#173F2A]/15 bg-white/45 p-7 md:p-10">
            {/* STEP 1 */}
            {step === "mobile" && (
              <>
                <FormHeader
                  step="Step 01"
                  title="Enter your mobile number"
                  description="We'll use your mobile number to securely access your farmer account."
                />

                <label
                  htmlFor="mobile"
                  className="mb-2 block text-sm font-medium"
                >
                  Mobile number
                </label>

                <div className="flex overflow-hidden rounded-[12px] border border-[#173F2A]/20 bg-[#F4F0E6] focus-within:border-[#173F2A]">
                  <div className="flex items-center border-r border-[#173F2A]/15 px-4 text-sm text-[#172019]/55">
                    +91
                  </div>

                  <input
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={mobile}
                    onChange={(event) => {
                      const value = event.target.value.replace(/\D/g, "");
                      setMobile(value);
                      setError("");
                    }}
                    placeholder="10-digit mobile number"
                    className="w-full bg-transparent px-4 py-4 text-base outline-none placeholder:text-[#172019]/30"
                  />
                </div>

                {error !== "" && (
                  <p className="mt-3 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={mobile.length !== 10}
                  className="mt-5 flex w-full items-center justify-between rounded-[12px] bg-[#173F2A] px-5 py-4 text-sm font-medium text-[#F4F0E6] transition hover:bg-[#204D34] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <span>Continue</span>
                  <ArrowRight size={18} />
                </button>
              </>
            )}

            {/* STEP 2 */}
            {step === "otp" && (
              <>
                <FormHeader
                  step="Step 02"
                  title="Verify your number"
                  description={
                    "Enter the verification code sent to +91 " +
                    mobile +
                    "."
                  }
                />

                <label
                  htmlFor="otp"
                  className="mb-2 block text-sm font-medium"
                >
                  Verification code
                </label>

                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => {
                    const value = event.target.value.replace(/\D/g, "");
                    setOtp(value);
                    setError("");
                  }}
                  placeholder="Enter 6-digit OTP"
                  className="w-full rounded-[12px] border border-[#173F2A]/20 bg-[#F4F0E6] px-4 py-4 text-center text-xl tracking-[0.35em] outline-none placeholder:text-sm placeholder:tracking-normal placeholder:text-[#172019]/30 focus:border-[#173F2A]"
                />

                {error !== "" && (
                  <p className="mt-3 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={otp.length !== 6}
                  className="mt-5 flex w-full items-center justify-between rounded-[12px] bg-[#173F2A] px-5 py-4 text-sm font-medium text-[#F4F0E6] transition hover:bg-[#204D34] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <span>Verify & continue</span>
                  <ArrowRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("mobile");
                    setOtp("");
                    setError("");
                  }}
                  className="mt-4 w-full text-center text-sm text-[#173F2A]/60 hover:text-[#173F2A]"
                >
                  Change mobile number
                </button>

                <div className="mt-8 border-t border-[#173F2A]/10 pt-5">
                  <p className="text-xs leading-5 text-[#172019]/40">
                    Demo mode: use OTP{" "}
                    <span className="font-semibold text-[#173F2A]">
                      123456
                    </span>
                  </p>
                </div>
              </>
            )}

            {/* STEP 3 */}
            {step === "profile" && (
              <>
                <FormHeader
                  step="Step 03"
                  title="Complete your profile"
                  description="You're new to AgriTrack. Tell us a little about yourself."
                />

                <div className="space-y-5">
                  {/* Full name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-medium"
                    >
                      Full name
                    </label>

                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                        setError("");
                      }}
                      placeholder="e.g. Ramesh Patil"
                      className="w-full rounded-[12px] border border-[#173F2A]/20 bg-[#F4F0E6] px-4 py-4 text-base outline-none placeholder:text-[#172019]/30 focus:border-[#173F2A]"
                    />
                  </div>

                  {/* Village */}
                  <div>
                    <label
                      htmlFor="village"
                      className="mb-2 block text-sm font-medium"
                    >
                      Village
                    </label>

                    <input
                      id="village"
                      type="text"
                      value={village}
                      onChange={(event) => {
                        setVillage(event.target.value);
                        setError("");
                      }}
                      placeholder="e.g. Lasalgaon"
                      className="w-full rounded-[12px] border border-[#173F2A]/20 bg-[#F4F0E6] px-4 py-4 text-base outline-none placeholder:text-[#172019]/30 focus:border-[#173F2A]"
                    />
                  </div>

                  {/* District and State */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="district"
                        className="mb-2 block text-sm font-medium"
                      >
                        District
                      </label>

                      <input
                        id="district"
                        type="text"
                        value={district}
                        onChange={(event) => {
                          setDistrict(event.target.value);
                          setError("");
                        }}
                        placeholder="e.g. Nashik"
                        className="w-full rounded-[12px] border border-[#173F2A]/20 bg-[#F4F0E6] px-4 py-4 text-base outline-none placeholder:text-[#172019]/30 focus:border-[#173F2A]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="state"
                        className="mb-2 block text-sm font-medium"
                      >
                        State
                      </label>

                      <select
                        id="state"
                        value={state}
                        onChange={(event) => {
                          setState(event.target.value);
                          setError("");
                        }}
                        className="w-full appearance-none rounded-[12px] border border-[#173F2A]/20 bg-[#F4F0E6] px-4 py-4 text-base outline-none focus:border-[#173F2A]"
                      >
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Madhya Pradesh">
                          Madhya Pradesh
                        </option>
                        <option value="Rajasthan">Rajasthan</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {error !== "" && (
                  <p className="mt-4 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={completeProfile}
                  className="mt-6 flex w-full items-center justify-between rounded-[12px] bg-[#173F2A] px-5 py-4 text-sm font-medium text-[#F4F0E6] transition hover:bg-[#204D34]"
                >
                  <span>Complete registration</span>
                  <ArrowRight size={18} />
                </button>
              </>
            )}

            {/* Security note */}
            <div className="mt-8 flex items-start gap-3 border-t border-[#173F2A]/10 pt-6">
              <ShieldCheck
                size={18}
                className="mt-0.5 shrink-0 text-[#5F8F45]"
              />

              <p className="text-xs leading-5 text-[#172019]/45">
                Your information is used to provide your AgriTrack
                procurement services.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* Form header */
function FormHeader({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-9">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#172019]/40">
        {step}
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#172019]/50">
        {description}
      </p>
    </div>
  );
}

/* Progress step */
function ProgressStep({
  number,
  label,
  active,
  completed,
}: {
  number: string;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={
          "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold " +
          (completed
            ? "bg-[#5F8F45] text-white"
            : active
              ? "bg-[#173F2A] text-[#F4F0E6]"
              : "border border-[#173F2A]/15 text-[#172019]/35")
        }
      >
        {completed ? <Check size={13} /> : number}
      </div>

      <span
        className={
          "hidden text-xs sm:block " +
          (active
            ? "font-medium text-[#173F2A]"
            : "text-[#172019]/35")
        }
      >
        {label}
      </span>
    </div>
  );
}

