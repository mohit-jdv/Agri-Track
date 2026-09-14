"use client";

import {
  ArrowLeft,
  Bell,
  Check,
  Clock3,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type QueueStatus =
  | "waiting"
  | "near"
  | "serving"
  | "completed"
  | "cancelled";

type QueueRow = {
  id: string;
  booking_id: string;
  farmer_id: string;
  token: string;
  centre_name: string;
  queue_position: number | null;
  status:
    | "Waiting"
    | "Arrived"
    | "Serving"
    | "Completed"
    | "Cancelled";
  estimated_wait_minutes: number | null;
  created_at: string;
  farmer_name: string;
  crop: string;
  quantity: number;
  slot: string;
};

type QueueItem = QueueRow & {
  displayStatus: QueueStatus;
  name: string;
  quantityLabel: string;
};

const ACTIVE_TOKEN_KEY = "agritrack-active-token";

function getDisplayStatus(
  status: QueueRow["status"]
): QueueStatus {
  if (status === "Serving") return "serving";
  if (status === "Arrived") return "near";
  if (status === "Completed") return "completed";
  if (status === "Cancelled") return "cancelled";
  return "waiting";
}

export default function FarmerQueue() {
  const router = useRouter();

  const [queueRows, setQueueRows] = useState<QueueRow[]>([]);
  const [yourToken, setYourToken] =
    useState<string | null>(null);
  const [farmerName, setFarmerName] =
    useState("Farmer");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadQueue = useCallback(async () => {
    setError("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;

    if (!user) {
      setLoading(false);
      setError(
        "Your session has expired. Please login again."
      );
      return;
    }

    const activeToken =
      localStorage.getItem(ACTIVE_TOKEN_KEY);

    setYourToken(activeToken);

    const { data: queueData, error: queueError } =
      await supabase.rpc("get_live_queue");

    if (queueError) {
      console.error(
        "Live queue error:",
        queueError
      );
      setError("Unable to load the live queue.");
      setLoading(false);
      return;
    }

    const rows = (queueData ?? []) as QueueRow[];

    /*
     * Find the current farmer's queue entry first.
     * This tells us which procurement centre the
     * farmer is currently using.
     */
    const currentFarmer =
  rows.find(
    (row) => row.token === activeToken
  ) ??
  rows.find(
    (row) => row.farmer_id === user.id
  );

    if (currentFarmer?.farmer_name) {
      setFarmerName(currentFarmer.farmer_name);
    }

    /*
     * Only show the queue for the farmer's own
     * procurement centre.
     *
     * The current RPC returns all queue rows, so
     * we filter the result here.
     */
    const currentCentre =
      currentFarmer?.centre_name ?? null;

    const centreRows = currentCentre
      ? rows.filter(
          (row) =>
            row.centre_name === currentCentre
        )
      : [];

    setQueueRows(centreRows);

    setLoading(false);
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadQueue();
    }, 0);

    const updateQueue = () => {
      void loadQueue();
    };

    window.addEventListener(
      "agritrack-active-token-updated",
      updateQueue
    );

    /*
     * Supabase Realtime
     *
     * Any change to queue_entries causes the
     * farmer queue to reload automatically.
     */
    const realtimeChannel = supabase
      .channel("farmer-queue-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_entries",
        },
        () => {
          void loadQueue();
        }
      )
      .subscribe((status) => {
        console.log(
          "Queue realtime status:",
          status
        );
      });

    return () => {
      window.clearTimeout(initialLoad);

      window.removeEventListener(
        "agritrack-active-token-updated",
        updateQueue
      );

      void supabase.removeChannel(
        realtimeChannel
      );
    };
  }, [loadQueue]);

  const queue = useMemo<QueueItem[]>(
    () =>
      queueRows.map((row) => ({
        ...row,
        displayStatus: getDisplayStatus(
          row.status
        ),
        name:
          row.farmer_name || "Farmer",
        quantityLabel: `${row.quantity} quintals`,
      })),
    [queueRows]
  );

  const yourFarmer = useMemo(
    () =>
      queue.find(
        (farmer) =>
          farmer.token === yourToken
      ),
    [queue, yourToken]
  );

  const farmersAhead = useMemo(() => {
    if (!yourFarmer?.queue_position) {
      return 0;
    }

    if (
      yourFarmer.displayStatus ===
        "completed" ||
      yourFarmer.displayStatus ===
        "cancelled" ||
      yourFarmer.displayStatus ===
        "serving"
    ) {
      return 0;
    }

    return Math.max(
      0,
      yourFarmer.queue_position - 1
    );
  }, [yourFarmer]);

  const isYourTurn =
    yourFarmer?.displayStatus ===
    "serving";

  const estimatedWait = isYourTurn
    ? 0
    : yourFarmer?.estimated_wait_minutes ??
      0;

  async function refreshQueue() {
    setLoading(true);
    await loadQueue();
  }

  return (
    <main className="min-h-screen bg-[#F4F0E6] text-[#172019]">
      {/* NAVBAR */}
      <nav className="border-b border-[#173F2A]/10 bg-[#F4F0E6]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#173F2A] text-[#F4F0E6]">
              <Clock3
                size={17}
                strokeWidth={2}
              />
            </div>

            <div>
              <div className="text-lg font-semibold tracking-[-0.04em]">
                AgriTrack
              </div>

              <div className="text-[10px] uppercase tracking-[0.16em] text-[#172019]/40">
                Farmer queue
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-7 md:flex">
            <button
              type="button"
              onClick={() =>
                router.push("/dashboard")
              }
              className="text-sm text-[#172019]/50 transition hover:text-[#173F2A]"
            >
              Dashboard
            </button>

            <button
              type="button"
              className="text-sm font-medium text-[#173F2A]"
            >
              Queue
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/procurement")
              }
              className="text-sm text-[#172019]/50 transition hover:text-[#173F2A]"
            >
              Procurement
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/payment")
              }
              className="text-sm text-[#172019]/50 transition hover:text-[#173F2A]"
            >
              Payments
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-full border border-[#173F2A]/15 bg-white/30 px-4 py-2 text-sm"
            >
              English
            </button>

            <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#D9C99A]/60 text-sm font-semibold md:flex">
              {farmerName
                .split(" ")
                .map(
                  (part) => part[0]
                )
                .slice(0, 2)
                .join("")
                .toUpperCase()}
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
              type="button"
              onClick={() =>
                router.push("/dashboard")
              }
              className="mb-6 flex items-center gap-2 text-sm text-[#172019]/45 transition hover:text-[#173F2A]"
            >
              <ArrowLeft size={15} />
              Back to dashboard
            </button>

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#5F8F45]">
              {yourFarmer?.centre_name ??
                "Procurement Centre"}{" "}
              · Today
            </p>

            <h1 className="text-4xl font-semibold tracking-[-0.06em] md:text-6xl">
              Live queue
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-[#172019]/55">
              Follow your position without
              waiting at the centre.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshQueue}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-[12px] border border-[#173F2A]/15 bg-white/35 px-5 py-3 text-sm font-medium transition hover:bg-white/70 disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-8 rounded-[12px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading && queue.length === 0 && (
          <div className="mb-8 border-y border-[#173F2A]/10 py-10 text-center text-sm text-[#172019]/50">
            Loading live queue...
          </div>
        )}

        {/* YOUR STATUS */}
        {!loading && (
          <div
            className={`rounded-[16px] p-7 md:p-9 ${
              isYourTurn
                ? "bg-[#173F2A] text-[#F4F0E6]"
                : "border border-[#173F2A]/10 bg-white/35"
            }`}
          >
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div>
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                    isYourTurn
                      ? "text-[#F4F0E6]/50"
                      : "text-[#5F8F45]"
                  }`}
                >
                  Your token
                </p>

                <div className="mt-4 flex items-center gap-5">
                  <span className="text-6xl font-semibold tracking-[-0.07em] md:text-8xl">
                    {yourToken ?? "—"}
                  </span>

                  {isYourTurn && (
                    <span className="rounded-full bg-[#D78A32] px-3 py-1 text-xs font-semibold text-[#172019]">
                      YOUR TURN
                    </span>
                  )}
                </div>

                <p
                  className={`mt-4 text-base ${
                    isYourTurn
                      ? "text-[#F4F0E6]/65"
                      : "text-[#172019]/50"
                  }`}
                >
                  {yourFarmer?.displayStatus ===
                  "cancelled"
                    ? "This booking has been cancelled."
                    : yourFarmer?.displayStatus ===
                        "completed"
                      ? "Your procurement is completed."
                      : isYourTurn
                        ? "Please proceed to the procurement desk."
                        : yourFarmer?.displayStatus ===
                            "near"
                          ? "You are next. Please stay ready."
                          : "We’ll notify you when your turn is near."}
                </p>
              </div>

              {!isYourTurn &&
                yourFarmer?.displayStatus !==
                  "completed" &&
                yourFarmer?.displayStatus !==
                  "cancelled" && (
                  <div className="grid grid-cols-2 gap-8 md:min-w-[280px]">
                    <div>
                      <p className="text-xs uppercase tracking-[0.13em] text-[#172019]/40">
                        Ahead
                      </p>

                      <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
                        {farmersAhead}
                      </p>

                      <p className="mt-1 text-sm text-[#172019]/45">
                        farmers
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.13em] text-[#172019]/40">
                        Est. wait
                      </p>

                      <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
                        {estimatedWait}
                      </p>

                      <p className="mt-1 text-sm text-[#172019]/45">
                        minutes
                      </p>
                    </div>
                  </div>
                )}
            </div>

            {!isYourTurn &&
              yourFarmer?.displayStatus !==
                "completed" &&
              yourFarmer?.displayStatus !==
                "cancelled" && (
                <div className="mt-8">
                  <div className="h-2 overflow-hidden rounded-full bg-[#173F2A]/10">
                    <div
                      className="h-full rounded-full bg-[#5F8F45] transition-all duration-500"
                      style={{
                        width: `${
                          yourFarmer?.queue_position
                            ? Math.min(
                                100,
                                Math.max(
                                  10,
                                  ((queue.length -
                                    farmersAhead) /
                                    Math.max(
                                      queue.length,
                                      1
                                    )) *
                                    100
                                )
                              )
                            : 10
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}
          </div>
        )}

        {/* CENTRE INFO */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="border-y border-[#173F2A]/10 py-6">
            <div className="flex items-center gap-3">
              <MapPin
                size={18}
                className="text-[#5F8F45]"
              />

              <div>
                <p className="text-xs uppercase tracking-[0.13em] text-[#172019]/40">
                  Procurement centre
                </p>

                <p className="mt-1 font-medium">
                  {yourFarmer?.centre_name ??
                    "Procurement Centre"}
                </p>
              </div>
            </div>
          </div>

          <div className="border-y border-[#173F2A]/10 py-6">
            <div className="flex items-center gap-3">
              <Bell
                size={18}
                className="text-[#D78A32]"
              />

              <div>
                <p className="text-xs uppercase tracking-[0.13em] text-[#172019]/40">
                  Notifications
                </p>

                <p className="mt-1 font-medium">
                  {isYourTurn
                    ? "Your turn notification sent"
                    : "Queue updates are enabled"}
                </p>

                <p className="mt-1 text-sm text-[#172019]/45">
                  You’ll be alerted when
                  your turn is near.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* QUEUE LIST */}
        <div className="mt-14">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5F8F45]">
                Today&apos;s queue
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                Live position
              </h2>
            </div>

            <p className="hidden text-sm text-[#172019]/40 md:block">
              {queue.length} tokens
            </p>
          </div>

          {queue.length === 0 && !loading ? (
            <div className="border-y border-[#173F2A]/10 py-12 text-center">
              <p className="font-medium">
                No active queue found.
              </p>

              <p className="mt-2 text-sm text-[#172019]/45">
                Book a procurement slot to
                join the live queue.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border-y border-[#173F2A]/10">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="border-b border-[#173F2A]/10 text-xs uppercase tracking-[0.13em] text-[#172019]/40">
                    <th className="px-4 py-4 font-medium">
                      Position
                    </th>

                    <th className="px-4 py-4 font-medium">
                      Token
                    </th>

                    <th className="px-4 py-4 font-medium">
                      Farmer
                    </th>

                    <th className="px-4 py-4 font-medium">
                      Slot
                    </th>

                    <th className="px-4 py-4 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {queue.map((farmer) => {
                    const isYou =
                      farmer.token ===
                      yourToken;

                    return (
                      <tr
                        key={farmer.id}
                        className={`border-b border-[#173F2A]/8 ${
                          isYou
                            ? "bg-white/60"
                            : ""
                        }`}
                      >
                        <td className="px-4 py-5 font-semibold">
                          {farmer.queue_position ??
                            "—"}
                        </td>

                        <td className="px-4 py-5 font-semibold">
                          <div className="flex items-center gap-2">
                            {farmer.token}

                            {isYou && (
                              <span className="rounded-full bg-[#D78A32]/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#7A4B17]">
                                You
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-5 text-sm">
                          {isYou
                            ? farmerName
                            : farmer.name}
                        </td>

                        <td className="px-4 py-5 text-sm text-[#172019]/60">
                          {farmer.slot}
                        </td>

                        <td className="px-4 py-5">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
                              farmer.displayStatus ===
                              "serving"
                                ? "bg-[#173F2A] text-[#F4F0E6]"
                                : farmer.displayStatus ===
                                    "completed"
                                  ? "bg-[#5F8F45]/15 text-[#173F2A]"
                                  : farmer.displayStatus ===
                                      "near"
                                    ? "bg-[#D78A32]/20 text-[#7A4B17]"
                                    : farmer.displayStatus ===
                                        "cancelled"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-[#172019]/8 text-[#172019]/60"
                            }`}
                          >
                            {farmer.displayStatus ===
                              "completed" && (
                              <Check size={12} />
                            )}

                            {farmer.displayStatus ===
                              "serving" && (
                              <Clock3
                                size={12}
                              />
                            )}

                            {farmer.displayStatus ===
                            "near"
                              ? "Next"
                              : farmer.displayStatus ===
                                  "serving"
                                ? "Serving"
                                : farmer.displayStatus ===
                                    "completed"
                                  ? "Completed"
                                  : farmer.displayStatus ===
                                      "cancelled"
                                    ? "Cancelled"
                                    : "Waiting"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}