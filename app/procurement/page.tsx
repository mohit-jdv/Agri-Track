"use client";

import {
  ArrowLeft,
  Check,
  CircleAlert,
  Clock3,
  FileText,
  IndianRupee,
  Leaf,
  Scale,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ProcurementStatus =
  | "booking"
  | "arrived"
  | "weighing"
  | "quality"
  | "completed"
  | "processing"
  | "paid";

type ProcurementData = {
  token: string;
  status: ProcurementStatus;
  paymentStatus: "Pending" | "Processing" | "Received";
  finalPrice: number;
  qualityGrade: string;
  assessedQuantity: number;
  paymentAmount: number;
  qualityNote: string;
  crop: string;
  bookedQuantity: number;
  slot: string;
  centreName: string;
  indicativePrice: number;
};

export default function ProcurementPage() {
  const searchParams = useSearchParams();
const tokenFromUrl = searchParams.get("token");
  const router = useRouter();
  const [procurement, setProcurement] =
  useState<ProcurementData | null>(null);

useEffect(() => {
  let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

  async function loadProcurement() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setProcurement(null);
      return;
    }

    const activeToken =
      tokenFromUrl ??
      window.localStorage.getItem("agritrack-active-token");

    if (!activeToken) {
      setProcurement(null);
      return;
    }

    const { data, error } = await supabase
      .from("procurements")
      .select(`
        token,
        status,
        payment_status,
        final_price,
        final_amount,
        actual_quantity,
        grade,
        booking_id
      `)
      .eq("token", activeToken)
      .maybeSingle();

    if (error) {
      console.error("Procurement load error:", error);
      setProcurement(null);
      return;
    }

    if (!data) {
      console.log("No procurement found for token:", activeToken);
      setProcurement(null);
      return;
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        crop,
        quantity,
        slot,
        centre_name,
        indicative_price
      `)
      .eq("id", data.booking_id)
      .maybeSingle();

    if (bookingError) {
      console.error("Booking load error:", bookingError);
    }

    const finalPrice = Number(data.final_price ?? 0);
    const actualQuantity = Number(data.actual_quantity ?? 0);

    setProcurement({
      token: data.token,
      status: data.status as ProcurementStatus,
      paymentStatus: data.payment_status ?? "Pending",
      finalPrice,
      qualityGrade: data.grade ?? "Not assessed",
      assessedQuantity: actualQuantity,
      paymentAmount: Number(
        data.final_amount ?? finalPrice * actualQuantity
      ),
      qualityNote:
        data.grade
          ? "Final price recorded after quality assessment."
          : "Quality assessment is pending.",
      crop: booking?.crop ?? "Unknown crop",
      bookedQuantity: Number(booking?.quantity ?? 0),
      slot: booking?.slot ?? "Not available",
      centreName: booking?.centre_name ?? "Procurement Centre",
      indicativePrice: Number(booking?.indicative_price ?? 0),
    });
  }

  void loadProcurement();

  realtimeChannel = supabase
    .channel("farmer-procurement-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "procurements",
      },
      (payload) => {
        const changedToken =
          (payload.new as { token?: string })?.token ??
          (payload.old as { token?: string })?.token;

        const activeToken =
          tokenFromUrl ??
          window.localStorage.getItem("agritrack-active-token");

        if (changedToken === activeToken) {
          void loadProcurement();
        }
      }
    )
    .subscribe((status) => {
      console.log(
        "Procurement realtime status:",
        status
      );
    });

  return () => {
    if (realtimeChannel) {
      void supabase.removeChannel(realtimeChannel);
    }
  };
}, [tokenFromUrl]);

const statusOrder: ProcurementStatus[] = [
  "booking",
  "arrived",
  "weighing",
  "quality",
  "completed",
  "processing",
  "paid",
];

if (!procurement) {
  return (
    <main className="min-h-screen bg-[#F4F0E6] text-[#172019]" />
  );
}

const stepData = [
  {
    title: "Booking Confirmed",
    description: `Slot ${procurement.token} confirmed`,
  },
  {
    title: "Arrived at Centre",
    description: "Arrival recorded",
  },
  {
    title: "Weighing",
    description: "Quantity being verified",
  },
  {
    title: "Quality Assessment",
    description: "Grade will determine final price",
  },
  {
    title: "Procurement Completed",
    description: "Produce accepted",
  },
  {
    title: "Payment Processing",
    description: "Payment being prepared",
  },
  {
    title: "Payment Received",
    description: "Amount credited to farmer",
  },
];

const currentIndex = statusOrder.indexOf(procurement.status);

const steps = stepData.map((step, index) => ({
  ...step,
  status:
    index < currentIndex
      ? "completed"
      : index === currentIndex
        ? "current"
        : "upcoming",
}));
  return (
    <main className="min-h-screen bg-[#F4F0E6] text-[#172019]">
      {/* Navbar */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#173F2A] text-[#F4F0E6]">
            <Leaf size={17} strokeWidth={2} />
          </div>

          <span className="text-lg font-semibold tracking-[-0.04em]">
            AgriTrack
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button className="rounded-full border border-[#173F2A]/20 bg-white/30 px-4 py-2 text-sm transition hover:bg-white/60">
            English
          </button>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D9C99A] text-sm font-semibold">
            RP
          </div>
        </div>
      </nav>

      {/* Main */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-8 md:px-10">
        {/* Back */}
        <button
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
              Procurement tracking
            </p>

            <h1 className="max-w-3xl text-5xl font-semibold leading-[0.95] tracking-[-0.06em] md:text-7xl">
              Track your
              <br />
              <span className="text-[#173F2A]">procurement.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-[#172019]/55">
              Follow every step from arrival and weighing to quality
              assessment and final payment.
            </p>
          </div>

          <div className="rounded-[14px] border border-[#173F2A]/15 bg-white/40 px-5 py-4 md:min-w-[220px]">
            <p className="text-xs uppercase tracking-[0.14em] text-[#172019]/40">
              Your token
            </p>

            <p className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-[#173F2A]">
              {procurement.token}
            </p>

            <p className="mt-1 text-sm text-[#172019]/50">
              {procurement.centreName}
            </p>
          </div>
        </div>

        {/* Booking summary */}
        <div className="mt-8 grid gap-3 md:grid-cols-4">
          <InfoItem
  label="Crop"
  value={procurement.crop}
  icon={<Leaf size={17} />}
/>
          <InfoItem
            label="Booked quantity"
            value={`${procurement.bookedQuantity} quintals`}
            icon={<Scale size={17} />}
          />
          <InfoItem
            label="Slot"
            value={procurement.slot}
            icon={<Clock3 size={17} />}
          />
          <InfoItem
            label="Indicative price"
            value={`₹${procurement.indicativePrice.toLocaleString("en-IN")} / q`}
            icon={<IndianRupee size={17} />}
          />
        </div>

        {/* Current status */}
        <section className="mt-8 rounded-[18px] bg-[#173F2A] p-6 text-[#F4F0E6] md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#D9C99A]">
                <span className="h-2 w-2 rounded-full bg-[#D78A32]" />
                Current status
              </div>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                {procurement.status === "booking"
  ? "Booking confirmed"
  : procurement.status === "arrived"
    ? "Arrived at centre"
    : procurement.status === "weighing"
      ? "Weighing in progress"
      : procurement.status === "quality"
        ? "Quality assessment"
        : procurement.status === "completed"
          ? "Procurement completed"
          : procurement.status === "processing"
            ? "Payment processing"
            : "Payment received"}
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#F4F0E6]/60">
                Your produce has reached the centre. The actual quantity will
                be recorded before quality assessment.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-[12px] bg-[#F4F0E6]/10 px-5 py-4">
              <Scale size={21} />
              <div>
                <p className="text-xs text-[#F4F0E6]/45">Next step</p>
                <p className="mt-0.5 font-medium">Quality assessment</p>
              </div>
            </div>
          </div>
        </section>

        {/* Journey */}
        <section className="mt-10">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5F8F45]">
              Procurement journey
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              Every step is recorded.
            </h2>
          </div>

          <div className="rounded-[18px] border border-[#173F2A]/15 bg-white/35 p-6 md:p-8">
            <div className="space-y-0">
              {steps.map((step, index) => {
                const completed = step.status === "completed";
                const current = step.status === "current";

                return (
                  <div key={step.title} className="flex gap-4">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                          completed
                            ? "border-[#173F2A] bg-[#173F2A] text-[#F4F0E6]"
                            : current
                              ? "border-[#D78A32] bg-[#D78A32] text-[#172019]"
                              : "border-[#173F2A]/20 bg-transparent text-[#172019]/25"
                        }`}
                      >
                        {completed ? (
                          <Check size={18} strokeWidth={2.5} />
                        ) : current ? (
                          <span className="h-2.5 w-2.5 rounded-full bg-[#172019]" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-[#172019]/20" />
                        )}
                      </div>

                      {index !== steps.length - 1 && (
                        <div
                          className={`my-1 h-12 w-px ${
                            completed
                              ? "bg-[#173F2A]/40"
                              : "bg-[#173F2A]/10"
                          }`}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="pb-8 pt-1">
                      <div
                        className={`font-medium ${
                          current
                            ? "text-[#173F2A]"
                            : completed
                              ? "text-[#172019]"
                              : "text-[#172019]/35"
                        }`}
                      >
                        {step.title}
                      </div>

                      <p
                        className={`mt-1 text-sm ${
                          current
                            ? "text-[#172019]/60"
                            : "text-[#172019]/40"
                        }`}
                      >
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

        {/* Quality and final price */}
        <section className="mt-10">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5F8F45]">
              Price transparency
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              Indicative price vs final price
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#172019]/50">
              The displayed market price is indicative. The final price is
              determined after physical quality and quantity assessment.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Indicative */}
            <div className="rounded-[18px] border border-[#173F2A]/15 bg-white/35 p-6 md:p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#D9C99A]/35">
                  <IndianRupee size={19} />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[#172019]/40">
                    At booking
                  </p>

                  <p className="mt-1 font-medium">Indicative price</p>
                </div>
              </div>

              <p className="mt-8 text-4xl font-semibold tracking-[-0.05em] text-[#173F2A]">
                ₹{procurement.indicativePrice.toLocaleString("en-IN")}
                <span className="ml-2 text-base font-normal text-[#172019]/40">
                  / quintal
                </span>
              </p>

              <p className="mt-3 text-sm leading-6 text-[#172019]/50">
                Current indicative market price shown when the slot was
                booked.
              </p>
            </div>

            {/* Final */}
            <div className="rounded-[18px] border border-[#173F2A]/20 bg-[#173F2A] p-6 text-[#F4F0E6] md:p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#F4F0E6]/10">
                  <ShieldCheck size={19} />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[#F4F0E6]/45">
                    After assessment
                  </p>

                  <p className="mt-1 font-medium">Final assessed price</p>
                </div>
              </div>

              <p className="mt-8 text-4xl font-semibold tracking-[-0.05em]">
                ₹{Number(procurement.finalPrice).toLocaleString("en-IN")}
                <span className="ml-2 text-base font-normal text-[#F4F0E6]/45">
                  / quintal
                </span>
              </p>

              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#D78A32]/15 px-3 py-1.5 text-xs font-medium text-[#D9C99A]">
                {procurement.qualityGrade} · Quality assessed
              </div>
            </div>
          </div>
        </section>

        {/* Assessment details */}
        <section className="mt-4 rounded-[18px] border border-[#173F2A]/15 bg-white/35 p-6 md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#D9C99A]/30">
                  <FileText size={18} />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[#172019]/40">
                    Quality assessment
                  </p>

                  <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                    Assessment details
                  </h3>
                </div>
              </div>

              <p className="mt-5 max-w-2xl text-sm leading-6 text-[#172019]/55">
                Final pricing is based on the actual quantity and quality
                grade recorded at the procurement centre.
              </p>
            </div>

            <div className="rounded-[12px] bg-[#F4F0E6] px-5 py-4 md:min-w-[190px]">
              <p className="text-xs text-[#172019]/40">Price difference</p>

              <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                {Number(procurement.finalPrice) - procurement.indicativePrice < 0 ? "−" : "+"}₹
{Math.abs(Number(procurement.finalPrice) - procurement.indicativePrice).toLocaleString("en-IN")} / q
              </p>

              <p className="mt-1 text-xs text-[#172019]/40">
                Based on {procurement.qualityGrade}
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-3 border-t border-[#173F2A]/10 pt-6 sm:grid-cols-3">
            <Detail
  label="Assessed quantity"
  value={`${procurement.assessedQuantity} quintals`}
/>
<Detail
  label="Quality grade"
  value={procurement.qualityGrade}
/>
<Detail
  label="Quality note"
  value={procurement.qualityNote}
/>
          </div>
        </section>

        {/* Payment */}
        <section className="mt-10">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5F8F45]">
              Payment
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              Your payment is traceable.
            </h2>
          </div>

          <div className="rounded-[18px] bg-[#D9C99A]/30 p-6 md:p-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#173F2A] text-[#F4F0E6]">
                  <Wallet size={21} />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[#172019]/45">
                    Payment status
                  </p>

                  <h3 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                    Payment processing
                  </h3>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#172019]/55">
                    Your final amount is being prepared using the assessed
                    quantity and final price.
                  </p>
                </div>
              </div>

              <div className="text-left md:text-right">
                <p className="text-xs text-[#172019]/40">Estimated amount</p>

                <p className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-[#173F2A]">
                  ₹{Number(procurement.paymentAmount).toLocaleString("en-IN")}
                </p>

                <p className="mt-1 text-xs text-[#172019]/40">
                  {procurement.assessedQuantity} q × ₹
{Number(procurement.finalPrice).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Transparency note */}
        <div className="mt-8 flex gap-4 border-t border-[#173F2A]/10 pt-6">
          <CircleAlert
            size={18}
            className="mt-0.5 shrink-0 text-[#D78A32]"
          />

          <p className="max-w-3xl text-sm leading-6 text-[#172019]/50">
            <span className="font-medium text-[#172019]">
              Important:
            </span>{" "}
            AgriTrack does not guarantee the indicative market price. The
            final price depends on the quality grade, actual weight and
            procurement assessment recorded at the centre.
          </p>
        </div>
      </section>
    </main>
  );
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-[#173F2A]/15 bg-white/35 px-4 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[#D9C99A]/25 text-[#173F2A]">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-[#172019]/40">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-[#F4F0E6] px-4 py-4">
      <p className="text-xs text-[#172019]/40">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

