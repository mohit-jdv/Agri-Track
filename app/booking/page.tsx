"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Leaf,
  MapPin,
  Wheat,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Step = "crop" | "centre" | "slot" | "confirm" | "success";

type Centre = {
  name: string;
  location: string;
  price: string;
  wait: string;
  capacity: string;
};

const centres: Centre[] = [
  {
    name: "Lasalgaon Procurement Centre",
    location: "Lasalgaon, Nashik",
    price: "₹4,400",
    wait: "32 min",
    capacity: "18 slots available",
  },
  {
    name: "Manmad Procurement Centre",
    location: "Manmad, Nashik",
    price: "₹3,800",
    wait: "24 min",
    capacity: "12 slots available",
  },
  {
    name: "Pune Procurement Centre",
    location: "Pune",
    price: "₹2,750",
    wait: "18 min",
    capacity: "24 slots available",
  },
];

const timeSlots = [
  {
    time: "09:00 AM – 10:00 AM",
    available: "6 slots left",
  },
  {
    time: "10:00 AM – 11:00 AM",
    available: "8 slots left",
  },
  {
    time: "11:00 AM – 12:00 PM",
    available: "12 slots left",
  },
  {
    time: "12:00 PM – 01:00 PM",
    available: "4 slots left",
  },
];

export default function BookingPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("crop");

  const [crop, setCrop] = useState("Onion");
  const [quantity, setQuantity] = useState("");
  const [selectedCentre, setSelectedCentre] = useState<Centre | null>(null);
  const [selectedSlot, setSelectedSlot] = useState("");
const [bookingToken, setBookingToken] = useState("A-105");
const [error, setError] = useState("");

  const selectedPrice = selectedCentre?.price ?? "₹4,400";

  const goToCentre = () => {
    setError("");

    if (!quantity || Number(quantity) <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }

    setStep("centre");
  };

  const goToSlot = () => {
    setError("");

    if (!selectedCentre) {
      setError("Please select a procurement centre.");
      return;
    }

    setStep("slot");
  };

  const goToConfirm = () => {
    setError("");

    if (!selectedSlot) {
      setError("Please select a time slot.");
      return;
    }

    setStep("confirm");
  };

  const confirmBooking = async () => {
  setError("");

  if (!selectedCentre) {
    setError("Please select a procurement centre.");
    return;
  }

  if (!selectedSlot) {
    setError("Please select a time slot.");
    return;
  }

  setError("Booking your slot...");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    setError("Your session has expired. Please login again.");
    return;
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      farmer_id: user.id,
      crop,
      quantity: Number(quantity),
      centre_name: selectedCentre.name,
      booking_date: "2026-09-12",
      slot: selectedSlot,
      indicative_price: Number(
        selectedCentre.price.replace(/[₹,]/g, "")
      ),
      status: "Waiting",
    })
    .select()
    .single();

  if (bookingError) {
    console.error(bookingError);
    setError("Unable to create your booking. Please try again.");
    return;
  }

  localStorage.setItem(
    "agritrack-active-token",
    booking.token
  );

  window.dispatchEvent(
    new Event("agritrack-active-token-updated")
  );

  setBookingToken(booking.token);
  setError("");
  setStep("success");
};

  const resetBooking = () => {
  setStep("crop");
  setQuantity("");
  setSelectedCentre(null);
  setSelectedSlot("");
  setBookingToken("A-105");
  setError("");
};

  return (
    <main className="min-h-screen bg-[#F4F0E6] text-[#172019]">
      {/* NAVBAR */}
      <nav className="border-b border-[#173F2A]/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
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

          <span className="text-sm text-[#172019]/45">
            Book procurement
          </span>
        </div>
      </nav>

      {/* PAGE */}
      <section className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
        {/* SUCCESS */}
        {step === "success" ? (
          <SuccessScreen
            token={bookingToken}
            crop={crop}
            quantity={quantity}
            centre={selectedCentre}
            slot={selectedSlot}
            onQueue={() => router.push("/queue")}
            onNewBooking={resetBooking}
          />
        ) : (
          <>
            {/* HEADER */}
            <div className="max-w-3xl">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="mb-9 flex items-center gap-2 text-sm text-[#172019]/50 transition hover:text-[#173F2A]"
              >
                <ArrowLeft size={16} />
                Back to dashboard
              </button>

              <div className="mb-5 flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#D78A32]" />

                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5F8F45]">
                  New booking
                </span>
              </div>

              <h1 className="text-[clamp(3rem,7vw,6rem)] font-semibold leading-[0.86] tracking-[-0.075em]">
                Book your
                <br />
                <span className="text-[#173F2A]">procurement slot.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-[#172019]/55">
                Tell us what you&apos;re bringing, choose a centre and reserve
                a convenient time.
              </p>
            </div>

            {/* PROGRESS */}
            <div className="my-10 flex max-w-3xl items-center gap-2 overflow-x-auto pb-2">
              <BookingProgress
                number="01"
                label="Crop"
                active={step === "crop"}
                completed={
                  step === "centre" ||
                  step === "slot" ||
                  step === "confirm"
                }
              />

              <div className="h-px w-8 shrink-0 bg-[#173F2A]/15" />

              <BookingProgress
                number="02"
                label="Centre"
                active={step === "centre"}
                completed={
                  step === "slot" ||
                  step === "confirm"
                }
              />

              <div className="h-px w-8 shrink-0 bg-[#173F2A]/15" />

              <BookingProgress
                number="03"
                label="Time"
                active={step === "slot"}
                completed={step === "confirm"}
              />

              <div className="h-px w-8 shrink-0 bg-[#173F2A]/15" />

              <BookingProgress
                number="04"
                label="Confirm"
                active={step === "confirm"}
                completed={false}
              />
            </div>

            {/* CONTENT */}
            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
              {/* FORM */}
              <div className="rounded-[16px] border border-[#173F2A]/15 bg-white/45 p-7 md:p-10">
                {/* STEP 1 */}
                {step === "crop" && (
                  <>
                    <StepHeader
                      step="Step 01"
                      title="What are you bringing?"
                      description="Enter your crop and the quantity you want to procure."
                    />

                    <div className="space-y-6">
                      <div>
                        <label
                          htmlFor="crop"
                          className="mb-2 block text-sm font-medium"
                        >
                          Crop
                        </label>

                        <div className="relative">
                          <Wheat
                            size={18}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#5F8F45]"
                          />

                          <select
                            id="crop"
                            value={crop}
                            onChange={(event) => {
                              setCrop(event.target.value);
                              setError("");
                            }}
                            className="w-full appearance-none rounded-[12px] border border-[#173F2A]/20 bg-[#F4F0E6] py-4 pl-12 pr-12 text-base outline-none focus:border-[#173F2A]"
                          >
                            <option>Onion</option>
                            <option>Wheat</option>
                            <option>Rice</option>
                            <option>Tomato</option>
                            <option>Potato</option>
                            <option>Soybean</option>
                          </select>

                          <ChevronDown
                            size={17}
                            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#172019]/40"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="quantity"
                          className="mb-2 block text-sm font-medium"
                        >
                          Quantity
                        </label>

                        <div className="flex overflow-hidden rounded-[12px] border border-[#173F2A]/20 bg-[#F4F0E6] focus-within:border-[#173F2A]">
                          <input
                            id="quantity"
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(event) => {
                              setQuantity(event.target.value);
                              setError("");
                            }}
                            placeholder="Enter quantity"
                            className="w-full bg-transparent px-4 py-4 text-base outline-none placeholder:text-[#172019]/30"
                          />

                          <div className="flex items-center border-l border-[#173F2A]/15 px-5 text-sm text-[#172019]/50">
                            quintals
                          </div>
                        </div>
                      </div>
                    </div>

                    {error !== "" && (
                      <ErrorMessage message={error} />
                    )}

                    <NextButton
                      label="Choose procurement centre"
                      onClick={goToCentre}
                    />
                  </>
                )}

                {/* STEP 2 */}
                {step === "centre" && (
                  <>
                    <StepHeader
                      step="Step 02"
                      title="Choose a procurement centre"
                      description="Compare indicative prices and current waiting times."
                    />

                    <div className="space-y-3">
                      {centres.map((centre) => {
                        const selected =
                          selectedCentre?.name === centre.name;

                        return (
                          <button
                            type="button"
                            key={centre.name}
                            onClick={() => {
                              setSelectedCentre(centre);
                              setError("");
                            }}
                            className={
                              "w-full rounded-[14px] border p-5 text-left transition " +
                              (selected
                                ? "border-[#173F2A] bg-[#173F2A] text-[#F4F0E6]"
                                : "border-[#173F2A]/15 bg-[#F4F0E6]/60 hover:border-[#173F2A]/35 hover:bg-white/60")
                            }
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <MapPin
                                    size={16}
                                    className={
                                      selected
                                        ? "text-[#D9C99A]"
                                        : "text-[#5F8F45]"
                                    }
                                  />

                                  <span className="font-medium">
                                    {centre.name}
                                  </span>
                                </div>

                                <p
                                  className={
                                    "mt-2 text-sm " +
                                    (selected
                                      ? "text-[#F4F0E6]/55"
                                      : "text-[#172019]/45")
                                  }
                                >
                                  {centre.location}
                                </p>
                              </div>

                              <div
                                className={
                                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border " +
                                  (selected
                                    ? "border-[#D9C99A] bg-[#D9C99A] text-[#173F2A]"
                                    : "border-[#173F2A]/15")
                                }
                              >
                                {selected && <Check size={15} />}
                              </div>
                            </div>

                            <div
                              className={
                                "mt-5 grid grid-cols-3 gap-3 border-t pt-4 " +
                                (selected
                                  ? "border-[#F4F0E6]/15"
                                  : "border-[#173F2A]/10")
                              }
                            >
                              <MiniStat
                                label="Indicative"
                                value={centre.price + "/q"}
                                light={selected}
                              />

                              <MiniStat
                                label="Waiting"
                                value={centre.wait}
                                light={selected}
                              />

                              <MiniStat
                                label="Availability"
                                value={centre.capacity.replace(
                                  " slots available",
                                  ""
                                )}
                                light={selected}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {error !== "" && (
                      <ErrorMessage message={error} />
                    )}

                    <div className="mt-6 flex gap-3">
                      <BackButton
                        onClick={() => setStep("crop")}
                      />

                      <NextButton
                        label="Choose time slot"
                        onClick={goToSlot}
                      />
                    </div>
                  </>
                )}

                {/* STEP 3 */}
                {step === "slot" && (
                  <>
                    <StepHeader
                      step="Step 03"
                      title="Choose a time slot"
                      description="Select a slot that works for you. Your token will be generated after confirmation."
                    />

                    <div className="mb-6 flex items-center gap-3 rounded-[12px] bg-[#D9C99A]/20 p-4">
                      <CalendarDays
                        size={18}
                        className="text-[#5F8F45]"
                      />

                      <div>
                        <p className="text-sm font-medium">
                          Saturday, 12 September 2026
                        </p>

                        <p className="mt-0.5 text-xs text-[#172019]/45">
                          Available slots for {selectedCentre?.name}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {timeSlots.map((slot) => {
                        const selected = selectedSlot === slot.time;

                        return (
                          <button
                            type="button"
                            key={slot.time}
                            onClick={() => {
                              setSelectedSlot(slot.time);
                              setError("");
                            }}
                            className={
                              "flex w-full items-center justify-between rounded-[14px] border p-5 text-left transition " +
                              (selected
                                ? "border-[#173F2A] bg-[#173F2A] text-[#F4F0E6]"
                                : "border-[#173F2A]/15 bg-[#F4F0E6]/60 hover:border-[#173F2A]/35")
                            }
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={
                                  "flex h-10 w-10 items-center justify-center rounded-full " +
                                  (selected
                                    ? "bg-[#D9C99A] text-[#173F2A]"
                                    : "bg-[#D9C99A]/30 text-[#173F2A]")
                                }
                              >
                                <Clock3 size={18} />
                              </div>

                              <div>
                                <p className="font-medium">
                                  {slot.time}
                                </p>

                                <p
                                  className={
                                    "mt-1 text-xs " +
                                    (selected
                                      ? "text-[#F4F0E6]/50"
                                      : "text-[#172019]/40")
                                  }
                                >
                                  {slot.available}
                                </p>
                              </div>
                            </div>

                            <div
                              className={
                                "flex h-7 w-7 items-center justify-center rounded-full border " +
                                (selected
                                  ? "border-[#D9C99A] bg-[#D9C99A] text-[#173F2A]"
                                  : "border-[#173F2A]/15")
                              }
                            >
                              {selected && <Check size={15} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {error !== "" && (
                      <ErrorMessage message={error} />
                    )}

                    <div className="mt-6 flex gap-3">
                      <BackButton
                        onClick={() => setStep("centre")}
                      />

                      <NextButton
                        label="Review booking"
                        onClick={goToConfirm}
                      />
                    </div>
                  </>
                )}

                {/* STEP 4 */}
                {step === "confirm" && (
                  <>
                    <StepHeader
                      step="Step 04"
                      title="Review your booking"
                      description="Check the details before confirming your procurement slot."
                    />

                    <div className="divide-y divide-[#173F2A]/10 border-y border-[#173F2A]/10">
                      <ReviewRow
                        label="Crop"
                        value={crop}
                      />

                      <ReviewRow
                        label="Quantity"
                        value={quantity + " quintals"}
                      />

                      <ReviewRow
                        label="Centre"
                        value={selectedCentre?.name ?? ""}
                      />

                      <ReviewRow
                        label="Date"
                        value="12 September 2026"
                      />

                      <ReviewRow
                        label="Time"
                        value={selectedSlot}
                      />

                      <ReviewRow
                        label="Indicative price"
                        value={selectedPrice + " / quintal"}
                        highlight
                      />

                      <ReviewRow
                        label="Estimated waiting"
                        value={selectedCentre?.wait ?? ""}
                      />
                    </div>

                    <div className="mt-6 rounded-[12px] border border-[#D78A32]/25 bg-[#D9C99A]/15 p-4">
                      <p className="text-sm font-medium text-[#173F2A]">
                        Important: indicative price
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#172019]/50">
                        The displayed price is indicative and is not
                        guaranteed. Final price depends on physical quality,
                        grade, moisture, weight and the procurement centre&apos;s
                        assessment.
                      </p>
                    </div>

                    {error !== "" && (
                      <ErrorMessage message={error} />
                    )}

                    <div className="mt-6 flex gap-3">
                      <BackButton
                        onClick={() => setStep("slot")}
                      />

                      <NextButton
                        label="Confirm & get token"
                        onClick={confirmBooking}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* SIDE SUMMARY */}
              <aside className="lg:pt-20">
                <div className="border-t border-[#173F2A]/15 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#172019]/40">
                    Booking summary
                  </p>

                  <div className="mt-5 space-y-4">
                    <SummaryItem
                      label="Crop"
                      value={crop}
                      active={step !== "crop" || quantity !== ""}
                    />

                    <SummaryItem
                      label="Quantity"
                      value={
                        quantity
                          ? quantity + " quintals"
                          : "Not selected"
                      }
                      active={quantity !== ""}
                    />

                    <SummaryItem
                      label="Centre"
                      value={
                        selectedCentre
                          ? selectedCentre.name
                          : "Not selected"
                      }
                      active={selectedCentre !== null}
                    />

                    <SummaryItem
                      label="Time"
                      value={
                        selectedSlot || "Not selected"
                      }
                      active={selectedSlot !== ""}
                    />
                  </div>
                </div>

                <div className="mt-10 border-t border-[#173F2A]/15 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#172019]/40">
                    What happens next
                  </p>

                  <div className="mt-5 space-y-5">
                    <SideStep
                      number="01"
                      text="Receive your token"
                    />

                    <SideStep
                      number="02"
                      text="Track your queue"
                    />

                    <SideStep
                      number="03"
                      text="Get notified near your turn"
                    />

                    <SideStep
                      number="04"
                      text="Track procurement & payment"
                    />
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

/* STEP HEADER */
function StepHeader({
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

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] md:text-3xl">
        {title}
      </h2>

      <p className="mt-2 max-w-lg text-sm leading-6 text-[#172019]/50">
        {description}
      </p>
    </div>
  );
}

/* PROGRESS */
function BookingProgress({
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
    <div className="flex shrink-0 items-center gap-2">
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
          "text-xs " +
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

/* NEXT BUTTON */
function NextButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-1 items-center justify-between rounded-[12px] bg-[#173F2A] px-5 py-4 text-sm font-medium text-[#F4F0E6] transition hover:bg-[#204D34]"
    >
      <span>{label}</span>

      <ArrowRight
        size={18}
        className="transition-transform group-hover:translate-x-1"
      />
    </button>
  );
}

/* BACK BUTTON */
function BackButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center rounded-[12px] border border-[#173F2A]/15 bg-white/40 px-5 py-4 text-sm font-medium text-[#173F2A] transition hover:bg-white/70"
    >
      <ArrowLeft size={17} />
    </button>
  );
}

/* ERROR */
function ErrorMessage({
  message,
}: {
  message: string;
}) {
  return (
    <p className="mt-4 text-sm text-red-700">
      {message}
    </p>
  );
}

/* MINI STAT */
function MiniStat({
  label,
  value,
  light = false,
}: {
  label: string;
  value: string;
  light?: boolean;
}) {
  return (
    <div>
      <p
        className={
          "text-[10px] uppercase tracking-[0.12em] " +
          (light
            ? "text-[#F4F0E6]/40"
            : "text-[#172019]/35")
        }
      >
        {label}
      </p>

      <p
        className={
          "mt-1 text-sm font-medium " +
          (light
            ? "text-[#F4F0E6]"
            : "text-[#173F2A]")
        }
      >
        {value}
      </p>
    </div>
  );
}

/* REVIEW ROW */
function ReviewRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <span className="text-sm text-[#172019]/45">
        {label}
      </span>

      <span
        className={
          "text-right text-sm font-medium " +
          (highlight ? "text-[#173F2A]" : "")
        }
      >
        {value}
      </span>
    </div>
  );
}

/* SUMMARY ITEM */
function SummaryItem({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-5">
      <span className="text-sm text-[#172019]/40">
        {label}
      </span>

      <span
        className={
          "max-w-[220px] text-right text-sm " +
          (active
            ? "font-medium text-[#173F2A]"
            : "text-[#172019]/30")
        }
      >
        {value}
      </span>
    </div>
  );
}

/* SIDE STEP */
function SideStep({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#173F2A]/15 text-[10px] font-semibold text-[#173F2A]">
        {number}
      </div>

      <p className="text-sm text-[#172019]/55">
        {text}
      </p>
    </div>
  );
}

function SuccessScreen({
  token,
  crop,
  quantity,
  centre,
  slot,
  onQueue,
  onNewBooking,
}: {
  token: string;
  crop: string;
  quantity: string;
  centre: Centre | null;
  slot: string;
  onQueue: () => void;
  onNewBooking: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl pt-10 md:pt-20">
      <div className="mb-8 flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-[#5F8F45]" />

        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5F8F45]">
          Booking confirmed
        </span>
      </div>

      <h1 className="text-[clamp(3rem,7vw,6rem)] font-semibold leading-[0.86] tracking-[-0.075em]">
        Your turn is
        <br />
        <span className="text-[#173F2A]">booked.</span>
      </h1>

      <p className="mt-7 max-w-xl text-base leading-7 text-[#172019]/55">
        Your procurement slot has been reserved. Keep your token with you
        when you arrive at the centre.
      </p>

      {/* TOKEN */}
      <div className="mt-12 rounded-[18px] bg-[#173F2A] p-7 text-[#F4F0E6] md:p-10">
        <p className="text-xs uppercase tracking-[0.18em] text-[#F4F0E6]/45">
          Your token
        </p>

        <div className="mt-2 flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-6xl font-semibold tracking-[-0.07em] text-[#F4F0E6]">
  {token}
</p>

            <p className="mt-2 text-sm text-[#F4F0E6]/50">
              Keep this token for queue tracking.
            </p>
          </div>

          <div className="rounded-full bg-[#D78A32] px-4 py-2 text-sm font-medium text-[#172019]">
            Confirmed
          </div>
        </div>
      </div>

      {/* DETAILS */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <SuccessDetail
          icon={<Leaf size={18} />}
          label="Crop"
          value={crop}
        />

        <SuccessDetail
          icon={<Wheat size={18} />}
          label="Quantity"
          value={quantity + " quintals"}
        />

        <SuccessDetail
          icon={<MapPin size={18} />}
          label="Centre"
          value={centre?.name ?? ""}
        />

        <SuccessDetail
          icon={<Clock3 size={18} />}
          label="Time"
          value={slot}
        />
      </div>

      {/* QUEUE */}
      <div className="mt-8 border-t border-[#173F2A]/15 pt-7">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D9C99A]/30 text-[#173F2A]">
            <Clock3 size={18} />
          </div>

          <div>
            <p className="font-medium">
              Estimated waiting time: {centre?.wait ?? "32 min"}
            </p>

            <p className="mt-1 text-sm leading-6 text-[#172019]/45">
              We&apos;ll notify you when your turn is near. You can track the
              live queue from your dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <button
  type="button"
  onClick={onQueue}
  className="flex flex-1 items-center justify-between rounded-[12px] bg-[#173F2A] px-5 py-4 text-sm font-medium text-[#F4F0E6] transition hover:bg-[#204D34]"
>
  <span>Track live queue</span>
  <ArrowRight size={18} />
</button>

        <button
          type="button"
          onClick={onNewBooking}
          className="flex flex-1 items-center justify-center rounded-[12px] border border-[#173F2A]/15 bg-white/40 px-5 py-4 text-sm font-medium text-[#173F2A] transition hover:bg-white/70"
        >
          Make another booking
        </button>
      </div>

      {/* DISCLAIMER */}
      <p className="mt-8 text-xs leading-5 text-[#172019]/35">
        Indicative price is subject to quality and grade assessment at the
        procurement centre. Final payment may differ from the displayed
        indicative price.
      </p>
    </div>
  );
}

/* SUCCESS DETAIL */
function SuccessDetail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4 border-t border-[#173F2A]/10 pt-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D9C99A]/25 text-[#173F2A]">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-[#172019]/40">
          {label}
        </p>

        <p className="mt-1 text-sm font-medium">
          {value}
        </p>
      </div>
    </div>
  );
}

