"use client";

import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock3,
  MoreHorizontal,
  RefreshCw,
  SkipForward,
  UserRound,
  Weight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const ACTIVE_TOKEN_KEY = "agritrack-active-token";

type QueueStatus =
  | "Waiting"
  | "Arrived"
  | "Serving"
  | "Completed"
  | "Cancelled";

type ProcurementStatus =
  | "booking"
  | "arrived"
  | "weighing"
  | "quality"
  | "completed"
  | "processing"
  | "paid";

type Farmer = {
  token: string;
  name: string;
  crop: string;
  quantity: string;
  slot: string;
  status: QueueStatus;
};

type QueueEntry = {
  id: string;
  booking_id: string;
  farmer_id: string;
  token: string;
  centre_name: string;
  queue_position: number | null;
  status: QueueStatus;
  estimated_wait_minutes: number | null;
  created_at: string;
};

export default function CentreDashboard() {
  const router = useRouter();

  const loadQueueVersion = useRef(0);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [procurementStatus, setProcurementStatus] =
    useState<ProcurementStatus | null>(null);

  async function loadProcurementStatus(token: string) {
    const { data, error } = await supabase
      .from("procurements")
      .select("status")
      .eq("token", token)
      .maybeSingle();

    if (error) {
      console.error("Procurement load error:", error);
      setProcurementStatus(null);
      return;
    }

    setProcurementStatus(
      (data?.status as ProcurementStatus | null) ?? null
    );
  }

  async function loadQueue() {
  const currentVersion = ++loadQueueVersion.current;

  const { data: queueData, error: queueError } = await supabase
    .from("queue_entries")
    .select("*")
    .order("created_at", { ascending: true });

  if (currentVersion !== loadQueueVersion.current) {
    return;
  }

  if (queueError) {
    console.error("Queue load error:", queueError);
    return;
  }

  if (!queueData || queueData.length === 0) {
    setFarmers([]);
    setSelectedToken(null);
    setProcurementStatus(null);
    return;
  }

  const typedQueue = queueData as QueueEntry[];

  const bookingIds = typedQueue.map(
    (entry) => entry.booking_id
  );

  const { data: bookingData, error: bookingError } =
    await supabase
      .from("bookings")
      .select("id, crop, quantity, slot")
      .in("id", bookingIds);

  if (currentVersion !== loadQueueVersion.current) {
    return;
  }

  if (bookingError) {
    console.error(
      "Booking load error:",
      bookingError
    );
  }

  const farmerIds = typedQueue.map(
    (entry) => entry.farmer_id
  );

  const { data: profileData, error: profileError } =
    await supabase
      .from("profiles")
      .select("id, name")
      .in("id", farmerIds);

  if (currentVersion !== loadQueueVersion.current) {
    return;
  }

  if (profileError) {
    console.error(
      "Profile load error:",
      profileError
    );
  }

  const updatedFarmers: Farmer[] = typedQueue.map(
    (entry) => {
      const booking = bookingData?.find(
        (item) => item.id === entry.booking_id
      );

      const profile = profileData?.find(
        (item) => item.id === entry.farmer_id
      );

      return {
        token: entry.token,
        name: profile?.name ?? "Farmer",
        crop: booking?.crop ?? "—",
        quantity:
          booking?.quantity !== null &&
          booking?.quantity !== undefined
            ? `${booking.quantity} q`
            : "—",
        slot: booking?.slot ?? "—",
        status: entry.status,
      };
    }
  );

  if (currentVersion !== loadQueueVersion.current) {
    return;
  }

  setFarmers(updatedFarmers);

  const servingFarmer = updatedFarmers.find(
    (farmer) => farmer.status === "Serving"
  );

  if (servingFarmer) {
    localStorage.setItem(
      ACTIVE_TOKEN_KEY,
      servingFarmer.token
    );

    setSelectedToken(servingFarmer.token);

    await loadProcurementStatus(
      servingFarmer.token
    );

    return;
  }

  const savedToken = localStorage.getItem(
    ACTIVE_TOKEN_KEY
  );

  const savedFarmer = savedToken
    ? updatedFarmers.find(
        (farmer) => farmer.token === savedToken
      )
    : null;

  if (savedFarmer) {
    setSelectedToken(savedFarmer.token);

    await loadProcurementStatus(
      savedFarmer.token
    );

    return;
  }

  setSelectedToken(
    updatedFarmers[0]?.token ?? null
  );

  if (updatedFarmers[0]?.token) {
    await loadProcurementStatus(
      updatedFarmers[0].token
    );
  }
}

  useEffect(() => {
    const initialize = () => {
      void loadQueue();
    };

    const updateQueue = () => {
      void loadQueue();
    };

    const updateProcurement = () => {
      const token = localStorage.getItem(ACTIVE_TOKEN_KEY);

      if (token) {
        void loadProcurementStatus(token);
      }
    };

    const timer = window.setTimeout(initialize, 0);

    window.addEventListener(
      "agritrack-active-token-updated",
      updateQueue
    );

    window.addEventListener(
      "agritrack-queue-updated",
      updateQueue
    );

    window.addEventListener(
      "agritrack-procurement-updated",
      updateProcurement
    );

    return () => {
      window.clearTimeout(timer);

      window.removeEventListener(
        "agritrack-active-token-updated",
        updateQueue
      );

      window.removeEventListener(
        "agritrack-queue-updated",
        updateQueue
      );

      window.removeEventListener(
        "agritrack-procurement-updated",
        updateProcurement
      );
    };
  }, []);

  const servingFarmer = useMemo(
    () =>
      farmers.find(
        (farmer) => farmer.status === "Serving"
      ),
    [farmers]
  );

  const selectedFarmer = useMemo(
    () =>
      servingFarmer ??
      farmers.find(
        (farmer) => farmer.token === selectedToken
      ),
    [farmers, selectedToken, servingFarmer]
  );

  const waitingCount = farmers.filter(
    (farmer) => farmer.status === "Waiting"
  ).length;

  const arrivedCount = farmers.filter(
    (farmer) => farmer.status === "Arrived"
  ).length;

  const completedCount = farmers.filter(
    (farmer) => farmer.status === "Completed"
  ).length;

  async function serveNext() {
    const currentServing = farmers.find(
      (farmer) => farmer.status === "Serving"
    );

    // FIX: an "Arrived" farmer must always be served before a "Waiting" one —
    // "Waiting" means the farmer hasn't physically checked in yet. The old
    // code did `farmer.status === "Arrived" || farmer.status === "Waiting"`,
    // which returns whichever of the two appears first in queue order
    // (i.e. sorted by created_at), so a farmer who hasn't arrived could get
    // served ahead of one who has. We now look for an Arrived farmer first
    // and only fall back to Waiting if nobody has checked in yet.
    const nextFarmer =
      farmers.find((farmer) => farmer.status === "Arrived") ??
      farmers.find((farmer) => farmer.status === "Waiting");

    if (!nextFarmer) {
      return;
    }

    if (currentServing) {
      const { error } = await supabase
        .from("queue_entries")
        .update({
          status: "Completed",
          updated_at: new Date().toISOString(),
        })
        .eq("token", currentServing.token);

      if (error) {
        console.error(
          "Complete current farmer error:",
          error
        );
        return;
      }
    }

    const { error: serveError } = await supabase
      .from("queue_entries")
      .update({
        status: "Serving",
        updated_at: new Date().toISOString(),
      })
      .eq("token", nextFarmer.token);

    if (serveError) {
      console.error(
        "Serve next farmer error:",
        serveError
      );
      return;
    }

    localStorage.setItem(
      ACTIVE_TOKEN_KEY,
      nextFarmer.token
    );

    setSelectedToken(nextFarmer.token);

    setFarmers((currentFarmers) =>
      currentFarmers.map((farmer) => {
        if (farmer.token === currentServing?.token) {
          return {
            ...farmer,
            status: "Completed",
          };
        }

        if (farmer.token === nextFarmer.token) {
          return {
            ...farmer,
            status: "Serving",
          };
        }

        return farmer;
      })
    );

    await loadProcurementStatus(nextFarmer.token);

    window.dispatchEvent(
      new Event("agritrack-active-token-updated")
    );

    window.dispatchEvent(
      new Event("agritrack-queue-updated")
    );
  }

  async function markArrived(token: string) {
    const { error } = await supabase
      .from("queue_entries")
      .update({
        status: "Arrived",
        updated_at: new Date().toISOString(),
      })
      .eq("token", token);

    if (error) {
      console.error("Mark arrived error:", error);
      return;
    }

    setFarmers((current) =>
      current.map((farmer) =>
        farmer.token === token
          ? {
              ...farmer,
              status: "Arrived",
            }
          : farmer
      )
    );

    window.dispatchEvent(
      new Event("agritrack-queue-updated")
    );
  }

  async function serveFarmer(token: string) {
    const currentServing = farmers.find(
      (farmer) => farmer.status === "Serving"
    );

    if (currentServing && currentServing.token !== token) {
      const { error: completeError } = await supabase
        .from("queue_entries")
        .update({
          status: "Completed",
          updated_at: new Date().toISOString(),
        })
        .eq("token", currentServing.token);

      if (completeError) {
        console.error(
          "Complete current farmer error:",
          completeError
        );
        return;
      }
    }

    const { error } = await supabase
      .from("queue_entries")
      .update({
        status: "Serving",
        updated_at: new Date().toISOString(),
      })
      .eq("token", token);

    if (error) {
      console.error("Serve farmer error:", error);
      return;
    }

    localStorage.setItem(ACTIVE_TOKEN_KEY, token);

    setSelectedToken(token);

    setFarmers((currentFarmers) =>
      currentFarmers.map((farmer) => {
        if (farmer.token === token) {
          return {
            ...farmer,
            status: "Serving",
          };
        }

        if (farmer.status === "Serving") {
          return {
            ...farmer,
            status: "Completed",
          };
        }

        return farmer;
      })
    );

    await loadProcurementStatus(token);

    window.dispatchEvent(
      new Event("agritrack-active-token-updated")
    );

    window.dispatchEvent(
      new Event("agritrack-queue-updated")
    );
  }

  async function skipFarmer(token: string) {
    const { error } = await supabase
      .from("queue_entries")
      .update({
        status: "Cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("token", token);

    if (error) {
      console.error("Skip farmer error:", error);
      return;
    }

    setFarmers((currentFarmers) =>
      currentFarmers.map((farmer) =>
        farmer.token === token
          ? {
              ...farmer,
              status: "Cancelled",
            }
          : farmer
      )
    );

    window.dispatchEvent(
      new Event("agritrack-queue-updated")
    );
  }

    async function updateProcurementStatus(
  status: ProcurementStatus
) {
  // Use the farmer currently shown in the procurement desk.
  const serving = selectedFarmer;

  if (!serving || serving.status !== "Serving") {
    console.error("No serving farmer selected.");
    return;
  }

  const updateData: {
    status: ProcurementStatus;
    updated_at: string;
    payment_status?: "Pending" | "Processing" | "Received";
  } = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "processing") {
    updateData.payment_status = "Processing";
  }

  if (status === "paid") {
    updateData.payment_status = "Received";
  }

  console.log(
    "Updating procurement:",
    serving.token,
    updateData
  );

  const { data: procurementData, error: procurementError } =
    await supabase
      .from("procurements")
      .update(updateData)
      .eq("token", serving.token)
      .select("token, status, payment_status")
      .maybeSingle();

  if (procurementError) {
    console.error(
      "Procurement update error:",
      procurementError
    );
    alert(
      `Could not update procurement: ${procurementError.message}`
    );
    return;
  }

  if (!procurementData) {
    console.error(
      "No procurement row found for token:",
      serving.token
    );
    alert(
      `No procurement record found for ${serving.token}.`
    );
    return;
  }

  console.log(
    "Procurement updated successfully:",
    procurementData
  );

  // Payment received = procurement finished + farmer leaves queue.
  if (status === "paid") {
    const { error: queueError } = await supabase
      .from("queue_entries")
      .update({
        status: "Completed",
        updated_at: new Date().toISOString(),
      })
      .eq("token", serving.token)
      .eq("status", "Serving");

    if (queueError) {
      console.error(
        "Queue completion error:",
        queueError
      );
      alert(
        `Payment updated, but queue completion failed: ${queueError.message}`
      );
      return;
    }

    setFarmers((currentFarmers) =>
      currentFarmers.map((farmer) =>
        farmer.token === serving.token
          ? {
              ...farmer,
              status: "Completed",
            }
          : farmer
      )
    );

    setProcurementStatus("paid");
    setSelectedToken(null);

    localStorage.removeItem(ACTIVE_TOKEN_KEY);

    return;
  }

  // Update the procurement stage immediately on screen.
  setProcurementStatus(status);

  // Tell the procurement UI to refresh.
  window.dispatchEvent(
    new Event("agritrack-procurement-updated")
  );
}

  async function resetDemo() {
    const { error } = await supabase
      .from("queue_entries")
      .update({
        status: "Waiting",
        updated_at: new Date().toISOString(),
      })
      .neq("status", "Waiting");

    if (error) {
      console.error("Reset queue error:", error);
      return;
    }

    const { error: procurementError } = await supabase
      .from("procurements")
      .update({
        status: "booking",
        payment_status: "Pending",
        updated_at: new Date().toISOString(),
      })
      .neq("status", "booking");

    if (procurementError) {
      console.error(
        "Reset procurement error:",
        procurementError
      );
      return;
    }

    localStorage.removeItem(ACTIVE_TOKEN_KEY);

    setSelectedToken(null);
    setProcurementStatus(null);

    await loadQueue();

    window.dispatchEvent(
      new Event("agritrack-active-token-updated")
    );

    window.dispatchEvent(
      new Event("agritrack-queue-updated")
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F0E6] text-[#172019]">
      {/* NAVBAR */}
      <nav className="border-b border-[#173F2A]/10 bg-[#F4F0E6]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#173F2A] text-[#F4F0E6]">
              <Weight size={17} strokeWidth={2} />
            </div>

            <div>
              <div className="text-lg font-semibold tracking-[-0.04em]">
                AgriTrack
              </div>

              <div className="text-[10px] uppercase tracking-[0.16em] text-[#172019]/40">
                Procurement Centre
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-7 md:flex">
            <button className="text-sm font-medium text-[#173F2A]">
              Dashboard
            </button>

            <button
              onClick={() =>
                router.push("/centre/dashboard")
              }
              className="text-sm text-[#172019]/50 transition hover:text-[#173F2A]"
            >
              Queue
            </button>

            <button className="text-sm text-[#172019]/50 transition hover:text-[#173F2A]">
              Procurement
            </button>

            <button className="text-sm text-[#172019]/50 transition hover:text-[#173F2A]">
              Payments
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button className="rounded-full border border-[#173F2A]/15 bg-white/30 px-4 py-2 text-sm">
              English
            </button>

            <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#D9C99A]/60 text-sm font-semibold md:flex">
              PC
            </div>
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-14">
        {/* HEADER */}
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <button
              onClick={() => router.push("/")}
              className="mb-6 flex items-center gap-2 text-sm text-[#172019]/45 transition hover:text-[#173F2A]"
            >
              <ArrowLeft size={15} />
              Exit centre
            </button>

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#5F8F45]">
              Lasalgaon · Today
            </p>

            <h1 className="text-4xl font-semibold tracking-[-0.06em] md:text-6xl">
              Centre dashboard
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-[#172019]/55">
              Manage today&apos;s farmer queue, procurement and
              payment progress from one place.
            </p>
          </div>

          <button
            onClick={resetDemo}
            className="flex items-center justify-center gap-2 rounded-[12px] border border-[#173F2A]/15 bg-white/35 px-5 py-3 text-sm font-medium transition hover:bg-white/70"
          >
            <RefreshCw size={15} />
            Reset demo
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 border-y border-[#173F2A]/10 md:grid-cols-4">
          <div className="border-r border-[#173F2A]/10 px-5 py-6">
            <p className="text-xs uppercase tracking-[0.14em] text-[#172019]/40">
              Booked today
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
              {farmers.length}
            </p>
          </div>

          <div className="px-5 py-6 md:border-r md:border-[#173F2A]/10">
            <p className="text-xs uppercase tracking-[0.14em] text-[#172019]/40">
              Waiting
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
              {waitingCount}
            </p>
          </div>

          <div className="border-r border-[#173F2A]/10 px-5 py-6">
            <p className="text-xs uppercase tracking-[0.14em] text-[#172019]/40">
              Arrived
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
              {arrivedCount}
            </p>
          </div>

          <div className="px-5 py-6">
            <p className="text-xs uppercase tracking-[0.14em] text-[#172019]/40">
              Completed
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
              {completedCount}
            </p>
          </div>
        </div>

        {/* NOW SERVING */}
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[16px] bg-[#173F2A] p-7 text-[#F4F0E6] md:p-9">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F4F0E6]/50">
                  Now serving
                </p>

                <p className="mt-5 text-6xl font-semibold tracking-[-0.07em] md:text-8xl">
                  {servingFarmer?.token ?? "—"}
                </p>

                <p className="mt-3 text-lg text-[#F4F0E6]/70">
                  {servingFarmer?.name ??
                    "No farmer currently being served"}
                </p>
              </div>

              <div className="rounded-full bg-[#D78A32] px-3 py-1 text-xs font-semibold text-[#172019]">
                LIVE
              </div>
            </div>

            {servingFarmer && (
              <div className="mt-8 grid grid-cols-2 gap-3 border-t border-[#F4F0E6]/10 pt-6 md:grid-cols-3">
                <div>
                  <p className="text-xs text-[#F4F0E6]/40">
                    Crop
                  </p>

                  <p className="mt-1 text-sm">
                    {servingFarmer.crop}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#F4F0E6]/40">
                    Quantity
                  </p>

                  <p className="mt-1 text-sm">
                    {servingFarmer.quantity}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#F4F0E6]/40">
                    Slot
                  </p>

                  <p className="mt-1 text-sm">
                    {servingFarmer.slot}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={serveNext}
              className="mt-8 flex w-full items-center justify-between rounded-[12px] bg-[#F4F0E6] px-5 py-4 text-left text-[#173F2A] transition hover:bg-white"
            >
              <span className="font-medium">
                Serve next farmer
              </span>

              <ChevronRight size={19} />
            </button>
          </div>

          {/* SELECTED FARMER */}
          <div className="border-y border-[#173F2A]/10 py-7 lg:border-y-0 lg:border-l lg:px-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5F8F45]">
              Procurement desk
            </p>

            {selectedFarmer ? (
              <>
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D9C99A]/60">
                    <UserRound size={20} />
                  </div>

                  <div>
                    <p className="font-semibold">
                      {selectedFarmer.name}
                    </p>

                    <p className="text-sm text-[#172019]/45">
                      Token {selectedFarmer.token}
                    </p>
                  </div>
                </div>

                <div className="mt-7 space-y-4 border-t border-[#173F2A]/10 pt-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#172019]/45">
                      Crop
                    </span>

                    <span>{selectedFarmer.crop}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-[#172019]/45">
                      Quantity
                    </span>

                    <span>
                      {selectedFarmer.quantity}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-[#172019]/45">
                      Queue status
                    </span>

                    <span>{selectedFarmer.status}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-[#172019]/45">
                      Procurement
                    </span>

                    <span className="capitalize">
                      {procurementStatus ?? "—"}
                    </span>
                  </div>
                </div>

                <div className="mt-7 space-y-2">
                  <button
                    onClick={() =>
                      router.push(
                        `/procurement?token=${selectedFarmer.token}`
                      )
                    }
                    className="flex w-full items-center justify-between rounded-[12px] bg-[#173F2A] px-5 py-4 text-sm font-medium text-[#F4F0E6] transition hover:bg-[#204D34]"
                  >
                    Open procurement
                    <ChevronRight size={17} />
                  </button>

                  {selectedFarmer.status === "Serving" && (
                    <>
                      {/*
                        FIX: this used to render unconditionally whenever the
                        farmer was "Serving", so "Start weighing" stayed
                        visible even after the procurement had already moved
                        on to quality/completed/processing/paid — showing
                        multiple stage buttons at once. It now only shows
                        while the procurement hasn't started weighing yet.
                      */}
                      {(procurementStatus === null ||
                        procurementStatus === "booking" ||
                        procurementStatus === "arrived") && (
                        <button
                          onClick={() =>
                            updateProcurementStatus(
                              "weighing"
                            )
                          }
                          className="flex w-full items-center justify-between rounded-[12px] border border-[#173F2A]/15 bg-white/30 px-5 py-4 text-sm transition hover:bg-white/60"
                        >
                          Start weighing
                          <Weight size={17} />
                        </button>
                      )}

                      {procurementStatus === "weighing" && (
                        <button
                          onClick={() =>
                            updateProcurementStatus(
                              "quality"
                            )
                          }
                          className="flex w-full items-center justify-between rounded-[12px] border border-[#173F2A]/15 bg-white/30 px-5 py-4 text-sm transition hover:bg-white/60"
                        >
                          Complete weighing → Quality check
                          <ChevronRight size={17} />
                        </button>
                      )}

                      {procurementStatus === "quality" && (
                        <button
                          onClick={() =>
                            updateProcurementStatus(
                              "completed"
                            )
                          }
                          className="flex w-full items-center justify-between rounded-[12px] border border-[#173F2A]/15 bg-white/30 px-5 py-4 text-sm transition hover:bg-white/60"
                        >
                          Complete procurement
                          <Check size={17} />
                        </button>
                      )}

                      {procurementStatus === "completed" && (
                        <button
                          onClick={() =>
                            updateProcurementStatus(
                              "processing"
                            )
                          }
                          className="flex w-full items-center justify-between rounded-[12px] border border-[#173F2A]/15 bg-white/30 px-5 py-4 text-sm transition hover:bg-white/60"
                        >
                          Start payment
                          <ChevronRight size={17} />
                        </button>
                      )}

                      {procurementStatus === "processing" && (
                        <button
                          onClick={() =>
                            updateProcurementStatus("paid")
                          }
                          className="flex w-full items-center justify-between rounded-[12px] border border-[#173F2A]/15 bg-white/30 px-5 py-4 text-sm transition hover:bg-white/60"
                        >
                          Mark payment received
                          <Check size={17} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              <p className="mt-6 text-sm text-[#172019]/50">
                Select a farmer from the queue.
              </p>
            )}
          </div>
        </div>

        {/* QUEUE */}
        <div className="mt-14">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5F8F45]">
                Today&apos;s queue
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                Farmers
              </h2>
            </div>

            <p className="hidden text-sm text-[#172019]/40 md:block">
              {farmers.length} tokens
            </p>
          </div>

          <div className="overflow-x-auto border-y border-[#173F2A]/10">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-[#173F2A]/10 text-xs uppercase tracking-[0.13em] text-[#172019]/40">
                  <th className="px-4 py-4 font-medium">
                    Token
                  </th>

                  <th className="px-4 py-4 font-medium">
                    Farmer
                  </th>

                  <th className="px-4 py-4 font-medium">
                    Crop
                  </th>

                  <th className="px-4 py-4 font-medium">
                    Quantity
                  </th>

                  <th className="px-4 py-4 font-medium">
                    Status
                  </th>

                  <th className="px-4 py-4 font-medium text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {farmers.map((farmer) => (
                  <tr
                    key={farmer.token}
                    onClick={() => {
                      setSelectedToken(farmer.token);
                      void loadProcurementStatus(
                        farmer.token
                      );
                    }}
                    className={`cursor-pointer border-b border-[#173F2A]/8 transition hover:bg-white/40 ${
                      selectedToken === farmer.token
                        ? "bg-white/50"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-5 font-semibold">
                      {farmer.token}
                    </td>

                    <td className="px-4 py-5 text-sm">
                      {farmer.name}
                    </td>

                    <td className="px-4 py-5 text-sm text-[#172019]/60">
                      {farmer.crop}
                    </td>

                    <td className="px-4 py-5 text-sm text-[#172019]/60">
                      {farmer.quantity}
                    </td>

                    <td className="px-4 py-5">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
                          farmer.status === "Serving"
                            ? "bg-[#173F2A] text-[#F4F0E6]"
                            : farmer.status === "Completed"
                              ? "bg-[#5F8F45]/15 text-[#173F2A]"
                              : farmer.status === "Arrived"
                                ? "bg-[#D78A32]/20 text-[#7A4B17]"
                                : "bg-[#172019]/8 text-[#172019]/60"
                        }`}
                      >
                        {farmer.status === "Completed" && (
                          <Check size={12} />
                        )}

                        {farmer.status === "Serving" && (
                          <Clock3 size={12} />
                        )}

                        {farmer.status}
                      </span>
                    </td>

                    <td className="px-4 py-5">
                      <div className="flex justify-end gap-2">
                        {farmer.status === "Waiting" && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              void markArrived(
                                farmer.token
                              );
                            }}
                            className="rounded-[10px] border border-[#173F2A]/15 px-3 py-2 text-xs font-medium hover:bg-white"
                          >
                            Mark arrived
                          </button>
                        )}

                        {farmer.status === "Arrived" && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              void serveFarmer(
                                farmer.token
                              );
                            }}
                            className="rounded-[10px] bg-[#173F2A] px-3 py-2 text-xs font-medium text-[#F4F0E6] hover:bg-[#204D34]"
                          >
                            Serve
                          </button>
                        )}

                        {(farmer.status === "Waiting" ||
                          farmer.status === "Arrived") && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              void skipFarmer(
                                farmer.token
                              );
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-[#173F2A]/10 hover:bg-white"
                            title="Skip"
                          >
                            <SkipForward size={14} />
                          </button>
                        )}

                        {farmer.status === "Serving" && (
                          <button
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-[#173F2A]/10 hover:bg-white"
                            title="More"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* INSIGHT */}
        <div className="mt-10 flex flex-col justify-between gap-5 rounded-[14px] border border-[#173F2A]/10 bg-[#D9C99A]/15 p-6 md:flex-row md:items-center">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D9C99A]/50">
              <Clock3 size={18} />
            </div>

            <div>
              <p className="font-medium">
                Queue is moving normally
              </p>

              <p className="mt-1 text-sm leading-6 text-[#172019]/50">
                Average processing time is currently around
                18 minutes per farmer.
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/queue")}
            className="flex items-center justify-center gap-2 text-sm font-medium text-[#173F2A]"
          >
            View farmer queue
            <ChevronRight size={16} />
          </button>
        </div>
      </section>
    </main>
  );
}