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
import { useEffect, useMemo, useState } from "react";
import {
  Farmer,
  getQueue,
  saveQueue,
} from "@/lib/demo-store";

type QueueStatus =
  | "waiting"
  | "near"
  | "serving"
  | "completed";

type QueueItem = {
  token: string;
  name: string;
  crop: string;
  quantity: string;
  slot: string;
  status: QueueStatus;
};

const DEFAULT_TOKEN = "A-105";
const ACTIVE_TOKEN_KEY = "agritrack-active-token";

function getStatus(
  status: Farmer["status"]
): QueueStatus {
  if (status === "Serving") return "serving";
  if (status === "Arrived") return "near";
  if (status === "Completed") return "completed";
  return "waiting";
}

export default function FarmerQueue() {
  const router = useRouter();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [yourToken, setYourToken] =
    useState(DEFAULT_TOKEN);

  useEffect(() => {
    const loadData = () => {
      setFarmers(getQueue());

      const activeToken = localStorage.getItem(
        ACTIVE_TOKEN_KEY
      );

      if (activeToken) {
        setYourToken(activeToken);
      }
    };

    loadData();

    const updateQueue = () => {
      setFarmers(getQueue());

      const activeToken = localStorage.getItem(
        ACTIVE_TOKEN_KEY
      );

      if (activeToken) {
        setYourToken(activeToken);
      }
    };

    window.addEventListener("storage", updateQueue);

    window.addEventListener(
      "agritrack-queue-updated",
      updateQueue
    );

    window.addEventListener(
      "agritrack-active-token-updated",
      updateQueue
    );

    return () => {
      window.removeEventListener(
        "storage",
        updateQueue
      );

      window.removeEventListener(
        "agritrack-queue-updated",
        updateQueue
      );

      window.removeEventListener(
        "agritrack-active-token-updated",
        updateQueue
      );
    };
  }, []);

  const queue = useMemo<QueueItem[]>(
    () =>
      farmers.map((farmer) => ({
        ...farmer,
        status: getStatus(farmer.status),
      })),
    [farmers]
  );

  const yourFarmer = useMemo(
    () =>
      queue.find(
        (farmer) => farmer.token === yourToken
      ),
    [queue, yourToken]
  );

  const servingFarmer = useMemo(
    () =>
      queue.find(
        (farmer) => farmer.status === "serving"
      ),
    [queue]
  );

  const yourIndex = useMemo(
    () =>
      queue.findIndex(
        (farmer) => farmer.token === yourToken
      ),
    [queue, yourToken]
  );

  const servingIndex = useMemo(
    () =>
      queue.findIndex(
        (farmer) => farmer.status === "serving"
      ),
    [queue]
  );

  const farmersAhead =
    yourIndex >= 0 && servingIndex >= 0
      ? Math.max(0, yourIndex - servingIndex)
      : 0;

  const isYourTurn =
    yourFarmer?.status === "serving";

  const estimatedWait = isYourTurn
    ? 0
    : farmersAhead * 18;

  function refreshQueue() {
    setFarmers(getQueue());

    const activeToken = localStorage.getItem(
      ACTIVE_TOKEN_KEY
    );

    if (activeToken) {
      setYourToken(activeToken);
    }
  }

  /*
   * Demo-only control.
   *
   * Moves the current Serving farmer to Completed
   * and the next Waiting/Arrived farmer to Serving.
   *
   * It also updates the shared active token so that
   * farmer-facing pages follow the new token.
   */
  function simulateNextToken() {
    const currentIndex = farmers.findIndex(
      (farmer) => farmer.status === "Serving"
    );

    const nextIndex = farmers.findIndex(
      (farmer, index) =>
        index > currentIndex &&
        (farmer.status === "Waiting" ||
          farmer.status === "Arrived")
    );

    if (nextIndex === -1) return;

    const nextToken = farmers[nextIndex].token;

    const updated = farmers.map((farmer) => {
      if (farmer.status === "Serving") {
        return {
          ...farmer,
          status: "Completed" as const,
        };
      }

      if (farmer.token === nextToken) {
        return {
          ...farmer,
          status: "Serving" as const,
        };
      }

      return farmer;
    });

    saveQueue(updated);

    localStorage.setItem(
      ACTIVE_TOKEN_KEY,
      nextToken
    );

    window.dispatchEvent(
      new Event("agritrack-active-token-updated")
    );

    setFarmers(updated);
    setYourToken(nextToken);
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
              RP
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
              Lasalgaon · Today
            </p>

            <h1 className="text-4xl font-semibold tracking-[-0.06em] md:text-6xl">
              Live queue
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-[#172019]/55">
              Follow your position without waiting at
              the centre.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshQueue}
            className="flex items-center justify-center gap-2 rounded-[12px] border border-[#173F2A]/15 bg-white/35 px-5 py-3 text-sm font-medium transition hover:bg-white/70"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {/* YOUR STATUS */}
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
                  {yourToken}
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
                {isYourTurn
                  ? "Please proceed to the procurement desk."
                  : yourFarmer?.status === "near"
                    ? "You are next. Please stay ready."
                    : "We’ll notify you when your turn is near."}
              </p>
            </div>

            {!isYourTurn && (
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

          {!isYourTurn && (
            <div className="mt-8">
              <div className="h-2 overflow-hidden rounded-full bg-[#173F2A]/10">
                <div
                  className="h-full rounded-full bg-[#5F8F45] transition-all duration-500"
                  style={{
                    width: `${
                      queue.length > 0
                        ? Math.min(
                            100,
                            Math.max(
                              10,
                              ((queue.length -
                                farmersAhead) /
                                queue.length) *
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
                  Lasalgaon Procurement Centre
                </p>

                <p className="mt-1 text-sm text-[#172019]/45">
                  Lasalgaon, Nashik
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
                  You’ll be alerted when your turn is
                  near.
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

          <div className="overflow-x-auto border-y border-[#173F2A]/10">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="border-b border-[#173F2A]/10 text-xs uppercase tracking-[0.13em] text-[#172019]/40">
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
                    farmer.token === yourToken;

                  return (
                    <tr
                      key={farmer.token}
                      className={`border-b border-[#173F2A]/8 ${
                        isYou ? "bg-white/60" : ""
                      }`}
                    >
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
                          ? "Ramesh Patil"
                          : farmer.name}
                      </td>

                      <td className="px-4 py-5 text-sm text-[#172019]/60">
                        {farmer.slot}
                      </td>

                      <td className="px-4 py-5">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
                            farmer.status ===
                            "serving"
                              ? "bg-[#173F2A] text-[#F4F0E6]"
                              : farmer.status ===
                                  "completed"
                                ? "bg-[#5F8F45]/15 text-[#173F2A]"
                                : farmer.status ===
                                    "near"
                                  ? "bg-[#D78A32]/20 text-[#7A4B17]"
                                  : "bg-[#172019]/8 text-[#172019]/60"
                          }`}
                        >
                          {farmer.status ===
                            "completed" && (
                            <Check size={12} />
                          )}

                          {farmer.status ===
                            "serving" && (
                            <Clock3 size={12} />
                          )}

                          {farmer.status === "near"
                            ? "Next"
                            : farmer.status === "serving"
                              ? "Serving"
                              : farmer.status ===
                                  "completed"
                                ? "Completed"
                                : "Waiting"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* DEMO CONTROL */}
        <div className="mt-10 flex flex-col justify-between gap-4 rounded-[14px] border border-[#D78A32]/20 bg-[#D9C99A]/15 p-5 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium">
              Demo queue control
            </p>

            <p className="mt-1 text-xs leading-5 text-[#172019]/45">
              Use this only during the presentation to
              simulate the next token being served.
            </p>
          </div>

          <button
            type="button"
            onClick={simulateNextToken}
            className="rounded-[10px] bg-[#173F2A] px-4 py-3 text-sm font-medium text-[#F4F0E6] transition hover:bg-[#204D34]"
          >
            Simulate next token
          </button>
        </div>
      </section>
    </main>
  );
}