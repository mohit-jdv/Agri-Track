"use client";

import {
  ArrowLeft,
  Check,
  Clock3,
  FileText,
  IndianRupee,
  Leaf,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getProcurementByToken,
  type ProcurementData,
} from "@/lib/demo-store";

const TOKEN = "A-105";

type PaymentStep = {
  title: string;
  description: string;
  status: "completed" | "current" | "upcoming";
};

export default function PaymentPage() {
  const router = useRouter();

  const [procurement, setProcurement] =
    useState<ProcurementData | null>(null);

  useEffect(() => {
    const loadProcurement = () => {
      setProcurement(getProcurementByToken(TOKEN));
    };

    loadProcurement();

    const handleUpdate = () => {
      loadProcurement();
    };

    window.addEventListener(
      "agritrack-procurement-updated",
      handleUpdate
    );

    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(
        "agritrack-procurement-updated",
        handleUpdate
      );

      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  if (!procurement) {
    return (
      <main className="min-h-screen bg-[#F4F0E6] text-[#172019]">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#173F2A] text-[#F4F0E6]">
              <Leaf size={17} strokeWidth={2} />
            </div>

            <span className="text-lg font-semibold tracking-[-0.04em]">
              AgriTrack
            </span>
          </div>
        </nav>

        <section className="mx-auto max-w-6xl px-6 py-20 md:px-10">
          <div className="rounded-[18px] border border-[#173F2A]/15 bg-white/35 p-8">
            <p className="text-sm text-[#172019]/50">
              Payment information is not available yet.
            </p>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="mt-5 flex items-center gap-2 text-sm font-medium text-[#173F2A] hover:underline"
            >
              <ArrowLeft size={16} />
              Back to dashboard
            </button>
          </div>
        </section>
      </main>
    );
  }

  const assessedQuantity = Number(
    procurement.assessedQuantity || 0
  );

  const finalPrice = Number(procurement.finalPrice || 0);

  const calculatedAmount = assessedQuantity * finalPrice;

  const paymentAmount =
    Number(procurement.paymentAmount || 0) ||
    calculatedAmount;

  const isPaid = procurement.status === "paid";

  const isProcessing =
    procurement.status === "processing";

  const paymentStatusText = isPaid
    ? "Payment received"
    : isProcessing
      ? "Payment processing"
      : "Awaiting payment";

  const paymentStatusDescription = isPaid
    ? "Payment has been marked as received."
    : isProcessing
      ? "Payment is being prepared for credit."
      : "Payment will begin after procurement is completed.";

  const paymentSteps = useMemo<PaymentStep[]>(() => {
    const status = procurement.status;

    const procurementCompleted = [
      "completed",
      "processing",
      "paid",
    ].includes(status);

    const paymentProcessing = [
      "processing",
      "paid",
    ].includes(status);

    const paymentReceived = status === "paid";

    return [
      {
        title: "Procurement completed",
        description:
          "Produce accepted and final quantity recorded",
        status: procurementCompleted
          ? "completed"
          : "upcoming",
      },
      {
        title: "Final price confirmed",
        description: `Grade ${procurement.qualityGrade.replace(
          "Grade ",
          ""
        )} · ₹${finalPrice.toLocaleString("en-IN")} per quintal`,
        status: procurementCompleted
          ? "completed"
          : "upcoming",
      },
      {
        title: "Payment processing",
        description: paymentProcessing
          ? "Payment is being prepared"
          : "Waiting for procurement completion",
        status: paymentProcessing
          ? "completed"
          : status === "completed"
            ? "current"
            : "upcoming",
      },
      {
        title: "Payment received",
        description: paymentReceived
          ? "Amount has been marked as received"
          : "Amount will be credited to your account",
        status: paymentReceived
          ? "completed"
          : paymentProcessing
            ? "current"
            : "upcoming",
      },
    ];
  }, [
    procurement.status,
    procurement.qualityGrade,
    finalPrice,
  ]);

  return (
    <main className="min-h-screen bg-[#F4F0E6] text-[#172019]">
      {/* Navbar */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#173F2A] text-[#F4F0E6]">
            <Leaf size={17} strokeWidth={2} />
          </div>

          <span className="text-lg font-semibold tracking-[-0.04em]">
            AgriTrack
          </span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-full border border-[#173F2A]/20 bg-white/30 px-4 py-2 text-sm transition hover:bg-white/60"
          >
            English
          </button>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D9C99A] text-sm font-semibold">
            RP
          </div>
        </div>
      </nav>

      {/* Main */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-8 md:px-10">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-8 flex items-center gap-2 text-sm text-[#172019]/55 transition hover:text-[#173F2A]"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </button>

        {/* Header */}
        <div className="flex flex-col justify-between gap-6 border-b border-[#173F2A]/15 pb-8 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#5F8F45]">
              Payment tracking
            </p>

            <h1 className="text-5xl font-semibold leading-[0.95] tracking-[-0.06em] md:text-7xl">
              Know where your
              <br />
              <span className="text-[#173F2A]">
                money is.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-[#172019]/55">
              See the final assessed amount and follow your
              payment from procurement completion to credit.
            </p>
          </div>

          <div className="rounded-[14px] border border-[#173F2A]/15 bg-white/40 px-5 py-4 md:min-w-[220px]">
            <p className="text-xs uppercase tracking-[0.14em] text-[#172019]/40">
              Procurement
            </p>

            <p className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-[#173F2A]">
              {procurement.token}
            </p>

            <p className="mt-1 text-sm text-[#172019]/50">
              Onion · Lasalgaon
            </p>
          </div>
        </div>

        {/* Amount */}
        <section className="mt-8 rounded-[18px] bg-[#173F2A] p-7 text-[#F4F0E6] md:p-9">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#D9C99A]">
                <Wallet size={15} />
                Current payment
              </div>

              <p className="mt-5 text-5xl font-semibold tracking-[-0.06em] md:text-6xl">
                ₹{paymentAmount.toLocaleString("en-IN")}
              </p>

              <p className="mt-2 text-sm text-[#F4F0E6]/50">
                {assessedQuantity} quintals × ₹
                {finalPrice.toLocaleString("en-IN")} / quintal
              </p>
            </div>

            <div
              className={`rounded-[12px] px-5 py-4 ${
                isPaid
                  ? "bg-[#5F8F45] text-white"
                  : "bg-[#D78A32] text-[#172019]"
              }`}
            >
              <div className="flex items-center gap-2">
                {isPaid ? (
                  <Check size={16} />
                ) : (
                  <Clock3 size={16} />
                )}

                <span className="text-sm font-semibold">
                  {paymentStatusText}
                </span>
              </div>

              <p className="mt-1 text-xs opacity-60">
                {paymentStatusDescription}
              </p>
            </div>
          </div>
        </section>

        {/* Payment journey */}
        <section className="mt-10">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5F8F45]">
              Payment journey
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              Follow every step.
            </h2>
          </div>

          <div className="rounded-[18px] border border-[#173F2A]/15 bg-white/35 p-6 md:p-8">
            <div className="space-y-0">
              {paymentSteps.map((step, index) => {
                const completed =
                  step.status === "completed";

                const current =
                  step.status === "current";

                return (
                  <div
                    key={step.title}
                    className="flex gap-4"
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                          completed
                            ? "border-[#173F2A] bg-[#173F2A] text-[#F4F0E6]"
                            : current
                              ? "border-[#D78A32] bg-[#D78A32] text-[#172019]"
                              : "border-[#173F2A]/20 text-[#172019]/25"
                        }`}
                      >
                        {completed ? (
                          <Check
                            size={18}
                            strokeWidth={2.5}
                          />
                        ) : current ? (
                          <span className="h-2.5 w-2.5 rounded-full bg-[#172019]" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-[#172019]/20" />
                        )}
                      </div>

                      {index !==
                        paymentSteps.length - 1 && (
                        <div
                          className={`my-1 h-12 w-px ${
                            completed
                              ? "bg-[#173F2A]/40"
                              : "bg-[#173F2A]/10"
                          }`}
                        />
                      )}
                    </div>

                    <div className="pb-8 pt-1">
                      <p
                        className={`font-medium ${
                          current
                            ? "text-[#173F2A]"
                            : completed
                              ? "text-[#172019]"
                              : "text-[#172019]/35"
                        }`}
                      >
                        {step.title}
                      </p>

                      <p className="mt-1 text-sm text-[#172019]/45">
                        {step.description}
                      </p>

                      {current && (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#D78A32]/15 px-3 py-1.5 text-xs font-medium text-[#8A541E]">
                          <Clock3 size={13} />
                          In progress
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Calculation */}
        <section className="mt-10">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5F8F45]">
              Payment calculation
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              How your amount was calculated.
            </h2>
          </div>

          <div className="rounded-[18px] border border-[#173F2A]/15 bg-white/35 p-6 md:p-8">
            <div className="space-y-4">
              <CalculationRow
                label="Assessed quantity"
                value={`${assessedQuantity} quintals`}
              />

              <CalculationRow
                label="Quality grade"
                value={procurement.qualityGrade}
              />

              <CalculationRow
                label="Final price"
                value={`₹${finalPrice.toLocaleString(
                  "en-IN"
                )} / quintal`}
              />

              <div className="border-t border-[#173F2A]/10 pt-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium">
                    Total payable
                  </span>

                  <span className="text-2xl font-semibold tracking-[-0.04em] text-[#173F2A]">
                    ₹{paymentAmount.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Payment details */}
        <section className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-[18px] border border-[#173F2A]/15 bg-white/35 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#D9C99A]/30">
                <IndianRupee size={18} />
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[#172019]/40">
                  Final price
                </p>

                <p className="mt-1 text-xl font-semibold">
                  ₹{finalPrice.toLocaleString("en-IN")} /
                  quintal
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-[#172019]/50">
              Final price recorded after physical quality
              assessment at the procurement centre.
            </p>
          </div>

          <div className="rounded-[18px] border border-[#173F2A]/15 bg-white/35 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#D9C99A]/30">
                <FileText size={18} />
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[#172019]/40">
                  Payment reference
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {isPaid ? "Generated" : "Pending"}
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-[#172019]/50">
              {isPaid
                ? "Payment has been successfully marked as received."
                : "A payment reference will be generated after the transaction is successfully processed."}
            </p>
          </div>
        </section>

        {/* Trust note */}
        <section className="mt-8 flex gap-4 border-t border-[#173F2A]/10 pt-6">
          <ShieldCheck
            size={19}
            className="mt-0.5 shrink-0 text-[#5F8F45]"
          />

          <p className="max-w-3xl text-sm leading-6 text-[#172019]/50">
            Your payment amount is based on the actual
            quantity and quality grade recorded during
            procurement. AgriTrack keeps these details
            visible so the farmer can understand how the
            final payment was calculated.
          </p>
        </section>
      </section>
    </main>
  );
}

function CalculationRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-[#172019]/50">
        {label}
      </span>

      <span className="text-sm font-medium">
        {value}
      </span>
    </div>
  );
}