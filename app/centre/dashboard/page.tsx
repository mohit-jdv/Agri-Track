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
import { useEffect, useMemo, useState } from "react";
import {
  Farmer,
  addNotification,
  getQueue,
  resetQueue,
  saveQueue,
  getProcurementByToken,
saveProcurementByToken,
} from "@/lib/demo-store";

const ACTIVE_TOKEN_KEY = "agritrack-active-token";

export default function CentreDashboard() {
  const router = useRouter();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [selectedToken, setSelectedToken] = useState("A-105");
  const [procurementStatus, setProcurementStatus] = useState(
  getProcurementByToken("A-105").status
);

  useEffect(() => {
  const queue = getQueue();

  setFarmers(queue);

  const serving = queue.find(
    (farmer) => farmer.status === "Serving"
  );

  if (serving) {
    localStorage.setItem(ACTIVE_TOKEN_KEY, serving.token);
    setSelectedToken(serving.token);
    setProcurementStatus(
      getProcurementByToken(serving.token).status
    );
  }

  const updateQueue = () => {
    const updatedQueue = getQueue();

    setFarmers(updatedQueue);

    const servingFarmer = updatedQueue.find(
      (farmer) => farmer.status === "Serving"
    );

    if (servingFarmer) {
      localStorage.setItem(
        ACTIVE_TOKEN_KEY,
        servingFarmer.token
      );

      setSelectedToken(servingFarmer.token);

      setProcurementStatus(
        getProcurementByToken(servingFarmer.token).status
      );
    }
  };

  window.addEventListener("storage", updateQueue);
  window.addEventListener("agritrack-queue-updated", updateQueue);

  return () => {
    window.removeEventListener("storage", updateQueue);
    window.removeEventListener(
      "agritrack-queue-updated",
      updateQueue
    );
  };
}, []);

  // Always calculate the currently serving farmer from the actual queue.
  const servingFarmer = useMemo(
    () => farmers.find((farmer) => farmer.status === "Serving"),
    [farmers]
  );

  const selectedFarmer = useMemo(
  () =>
    farmers.find((farmer) => farmer.status === "Serving") ??
    farmers.find((farmer) => farmer.token === selectedToken),
  [farmers, selectedToken]
);

const activeProcurementStatus = selectedFarmer
  ? getProcurementByToken(selectedFarmer.token).status
  : procurementStatus;

  const waitingCount = farmers.filter(
    (farmer) => farmer.status === "Waiting"
  ).length;

  const arrivedCount = farmers.filter(
    (farmer) => farmer.status === "Arrived"
  ).length;

  const completedCount = farmers.filter(
    (farmer) => farmer.status === "Completed"
  ).length;

 
function serveNext() {
  setFarmers((currentFarmers) => {
    const currentServingIndex = currentFarmers.findIndex(
      (farmer) => farmer.status === "Serving"
    );

    const nextIndex = currentFarmers.findIndex(
      (farmer, index) =>
        index > currentServingIndex &&
        (farmer.status === "Waiting" || farmer.status === "Arrived")
    );

    if (nextIndex === -1) {
      return currentFarmers;
    }

    const nextFarmer = currentFarmers[nextIndex];
    const nextToken = nextFarmer.token;

    const updatedFarmers = currentFarmers.map((farmer) => {
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

    localStorage.setItem(ACTIVE_TOKEN_KEY, nextToken);

    window.dispatchEvent(
      new Event("agritrack-active-token-updated")
    );

    setSelectedToken(nextToken);

    const nextProcurement = getProcurementByToken(nextToken);

    setProcurementStatus(nextProcurement.status);

    saveQueue(updatedFarmers);

    addNotification({
      type: "queue",
      title: "It's your turn",
      message: `Token ${nextToken} is now being served. Please proceed to the procurement desk.`,
    });

    return updatedFarmers;
  });
}


  function markArrived(token: string) {
  setFarmers((current) => {
    const updated = current.map((farmer) =>
      farmer.token === token
        ? { ...farmer, status: "Arrived" as const }
        : farmer
    );

    saveQueue(updated);

    return updated;
  });
}

  function serveFarmer(token: string) {
  setFarmers((currentFarmers) => {
    const updatedQueue = currentFarmers.map((farmer) => {
      if (farmer.token === token) {
        return {
          ...farmer,
          status: "Serving" as const,
        };
      }

      if (farmer.status === "Serving") {
        return {
          ...farmer,
          status: "Completed" as const,
        };
      }

      return farmer;
    });

    localStorage.setItem(ACTIVE_TOKEN_KEY, token);

    window.dispatchEvent(
      new Event("agritrack-active-token-updated")
    );

    setSelectedToken(token);

    const procurement = getProcurementByToken(token);

    setProcurementStatus(procurement.status);

    saveQueue(updatedQueue);

    return updatedQueue;
  });
}

  function skipFarmer(token: string) {
  setFarmers((current) => {
    const updated = current.map((farmer) =>
      farmer.token === token
        ? { ...farmer, status: "Waiting" as const }
        : farmer
    );

    saveQueue(updated);

    return updated;
  });
}

function updateProcurementStatus(
  status:
    | "booking"
    | "arrived"
    | "weighing"
    | "quality"
    | "completed"
    | "processing"
    | "paid"
) {
  const serving = farmers.find(
    (farmer) => farmer.status === "Serving"
  );

  if (!serving) {
    return;
  }

  const current = getProcurementByToken(serving.token);

  const updated = {
    ...current,
    token: serving.token,
    status,
  };

  saveProcurementByToken(updated);
  setProcurementStatus(status);

  const messages = {
    arrived: "Farmer has arrived at the procurement centre.",
    weighing: "Weighing has started for your procurement.",
    quality: "Quality assessment is now in progress.",
    completed: "Procurement has been completed successfully.",
    processing: "Your payment is now being processed.",
    paid: "Payment has been received successfully.",
    booking: "Your procurement booking is confirmed.",
  };

  addNotification({
    type:
      status === "paid" || status === "processing"
        ? "payment"
        : "procurement",
    title:
      status === "paid"
        ? "Payment received"
        : status === "processing"
          ? "Payment processing"
          : "Procurement update",
    message: `Token ${serving.token}: ${messages[status]}`,
  });

  if (status !== "paid") {
    return;
  }

  setTimeout(() => {
    setFarmers((currentFarmers) => {
      const currentServingIndex = currentFarmers.findIndex(
        (farmer) => farmer.status === "Serving"
      );

      if (currentServingIndex === -1) {
        return currentFarmers;
      }

      const currentServingFarmer =
        currentFarmers[currentServingIndex];

      const completedQueue = currentFarmers.map((farmer) => {
        if (farmer.token === currentServingFarmer.token) {
          return {
            ...farmer,
            status: "Completed" as const,
          };
        }

        return farmer;
      });

      const nextFarmer = completedQueue.find(
        (farmer, index) =>
          index > currentServingIndex &&
          (farmer.status === "Arrived" ||
            farmer.status === "Waiting")
      );

      if (!nextFarmer) {
        saveQueue(completedQueue);
        return completedQueue;
      }

      const updatedQueue = completedQueue.map((farmer) => {
        if (farmer.token === nextFarmer.token) {
          return {
            ...farmer,
            status: "Serving" as const,
          };
        }

        return farmer;
      });

      saveQueue(updatedQueue);
      setSelectedToken(nextFarmer.token);

      const nextProcurement = getProcurementByToken(
        nextFarmer.token
      );

      saveProcurementByToken({
        ...nextProcurement,
        token: nextFarmer.token,
        status: "arrived",
      });

      setProcurementStatus("arrived");

      addNotification({
        type: "queue",
        title: "Your turn",
        message: `Token ${nextFarmer.token} is now being served. Please proceed to the procurement desk.`,
      });

      return updatedQueue;
    });
  }, 1000);
}

  function resetDemo() {
  resetQueue();

  const resetProcurementData = getProcurementByToken("A-105");

  saveProcurementByToken({
    ...resetProcurementData,
    token: "A-105",
    status: "arrived",
  });

  setFarmers(getQueue());
  setSelectedToken("A-105");

  localStorage.setItem(ACTIVE_TOKEN_KEY, "A-105");

  window.dispatchEvent(
    new Event("agritrack-active-token-updated")
  );

  setProcurementStatus("arrived");
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
              onClick={() => router.push("/centre/dashboard")}
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
              Manage today&apos;s farmer queue, procurement and payment
              progress from one place.
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
              18
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
                  {servingFarmer?.name ?? "No farmer currently being served"}
                </p>
              </div>

              <div className="rounded-full bg-[#D78A32] px-3 py-1 text-xs font-semibold text-[#172019]">
                LIVE
              </div>
            </div>

            {servingFarmer && (
              <div className="mt-8 grid grid-cols-2 gap-3 border-t border-[#F4F0E6]/10 pt-6 md:grid-cols-3">
                <div>
                  <p className="text-xs text-[#F4F0E6]/40">Crop</p>
                  <p className="mt-1 text-sm">{servingFarmer.crop}</p>
                </div>

                <div>
                  <p className="text-xs text-[#F4F0E6]/40">Quantity</p>
                  <p className="mt-1 text-sm">{servingFarmer.quantity}</p>
                </div>

                <div>
                  <p className="text-xs text-[#F4F0E6]/40">Slot</p>
                  <p className="mt-1 text-sm">{servingFarmer.slot}</p>
                </div>
              </div>
            )}

            <button
              onClick={serveNext}
              className="mt-8 flex w-full items-center justify-between rounded-[12px] bg-[#F4F0E6] px-5 py-4 text-left text-[#173F2A] transition hover:bg-white"
            >
              <span className="font-medium">Serve next farmer</span>
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
                    <p className="font-semibold">{selectedFarmer.name}</p>
                    <p className="text-sm text-[#172019]/45">
                      Token {selectedFarmer.token}
                    </p>
                  </div>
                </div>

                <div className="mt-7 space-y-4 border-t border-[#173F2A]/10 pt-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#172019]/45">Crop</span>
                    <span>{selectedFarmer.crop}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-[#172019]/45">Quantity</span>
                    <span>{selectedFarmer.quantity}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-[#172019]/45">Status</span>
                    <span>{selectedFarmer.status}</span>
                  </div>
                </div>

                <div className="mt-7 space-y-2">
  <button
    onClick={() =>
      router.push(`/procurement?token=${selectedFarmer.token}`)
    }
    className="flex w-full items-center justify-between rounded-[12px] bg-[#173F2A] px-5 py-4 text-sm font-medium text-[#F4F0E6] transition hover:bg-[#204D34]"
  >
    Open procurement
    <ChevronRight size={17} />
  </button>

  {selectedFarmer.status === "Serving" && (
    <>
      {procurementStatus === "arrived" && (
        <button
          onClick={() => updateProcurementStatus("weighing")}
          className="flex w-full items-center justify-between rounded-[12px] border border-[#173F2A]/15 bg-white/30 px-5 py-4 text-sm transition hover:bg-white/60"
        >
          Start weighing
          <Weight size={17} />
        </button>
      )}

      {procurementStatus === "weighing" && (
        <button
          onClick={() => updateProcurementStatus("quality")}
          className="flex w-full items-center justify-between rounded-[12px] border border-[#173F2A]/15 bg-white/30 px-5 py-4 text-sm transition hover:bg-white/60"
        >
          Complete weighing → Quality check
          <ChevronRight size={17} />
        </button>
      )}

      {procurementStatus === "quality" && (
        <button
          onClick={() => updateProcurementStatus("completed")}
          className="flex w-full items-center justify-between rounded-[12px] border border-[#173F2A]/15 bg-white/30 px-5 py-4 text-sm transition hover:bg-white/60"
        >
          Complete procurement
          <Check size={17} />
        </button>
      )}

      {procurementStatus === "completed" && (
        <button
          onClick={() => updateProcurementStatus("processing")}
          className="flex w-full items-center justify-between rounded-[12px] border border-[#173F2A]/15 bg-white/30 px-5 py-4 text-sm transition hover:bg-white/60"
        >
          Start payment
          <ChevronRight size={17} />
        </button>
      )}

      {procurementStatus === "processing" && (
        <button
          onClick={() => updateProcurementStatus("paid")}
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
                  <th className="px-4 py-4 font-medium">Token</th>
                  <th className="px-4 py-4 font-medium">Farmer</th>
                  <th className="px-4 py-4 font-medium">Crop</th>
                  <th className="px-4 py-4 font-medium">Quantity</th>
                  <th className="px-4 py-4 font-medium">Status</th>
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

  const procurement = getProcurementByToken(
    farmer.token
  );

  setProcurementStatus(procurement.status);
}}
                    className={`cursor-pointer border-b border-[#173F2A]/8 transition hover:bg-white/40 ${
                      selectedToken === farmer.token ? "bg-white/50" : ""
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
                              markArrived(farmer.token);
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
                              serveFarmer(farmer.token);
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
                              skipFarmer(farmer.token);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-[#173F2A]/10 hover:bg-white"
                            title="Skip"
                          >
                            <SkipForward size={14} />
                          </button>
                        )}

                        {farmer.status === "Serving" && (
                          <button
                            onClick={(event) => event.stopPropagation()}
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
              <p className="font-medium">Queue is moving normally</p>
              <p className="mt-1 text-sm leading-6 text-[#172019]/50">
                Average processing time is currently around 18 minutes per
                farmer.
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