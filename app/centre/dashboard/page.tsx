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

/*
 * This is the existing Lasalgaon Procurement Centre
 * from your Supabase database.
 */
function getActiveCentreId() {
  return localStorage.getItem("agritrack-centre-id");
}

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
  centre_id: string;
  centre_name: string;
  queue_position: number | null;
  status: QueueStatus;
  estimated_wait_minutes: number | null;
  created_at: string;
};

type CentreInfo = {
  id: string;
  name: string;
  avg_processing_minutes: number;
  is_active: boolean;
};

export default function CentreDashboard() {
  const router = useRouter();

  const loadQueueVersion = useRef(0);

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [selectedToken, setSelectedToken] = useState<string | null>(
    null
  );
  const [procurementStatus, setProcurementStatus] =
    useState<ProcurementStatus | null>(null);

  const [centre, setCentre] = useState<CentreInfo | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [qualityGrade, setQualityGrade] = useState("");
const [actualQuantity, setActualQuantity] = useState("");
const [finalPrice, setFinalPrice] = useState("");
const [finalAmount, setFinalAmount] = useState<number | null>(null);
const [assessmentSaved, setAssessmentSaved] = useState(false);

  /*
   * Load centre information.
   */
async function loadCentre() {
  const centreId = getActiveCentreId();

  if (!centreId) {
    router.push("/centre/login");
    return;
  }

  const { data, error } = await supabase
    .from("centres")
    .select(
      "id, name, avg_processing_minutes, is_active"
    )
    .eq("id", centreId)
    .maybeSingle();

  if (error) {
    console.error("Centre load error:", error);
    return;
  }

  if (!data) {
    console.error(
      "No centre found for logged-in account."
    );

    await supabase.auth.signOut();
    router.push("/centre/login");
    return;
  }

  setCentre({
    id: data.id,
    name: data.name,
    avg_processing_minutes:
      Number(data.avg_processing_minutes) || 15,
    is_active: Boolean(data.is_active),
  });
}

  /*
   * Load procurement status for one token.
   */
  async function loadProcurementStatus(token: string) {
  const { data, error } = await supabase
    .from("procurements")
    .select(
      "status, grade, actual_quantity, final_price, final_amount"
    )
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error(
      "Procurement load error:",
      error
    );

    setProcurementStatus(null);
    return;
  }

  setProcurementStatus(
    (data?.status as ProcurementStatus | null) ??
      null
  );

  setQualityGrade(data?.grade ?? "");

  setActualQuantity(
    data?.actual_quantity !== null &&
      data?.actual_quantity !== undefined
      ? String(data.actual_quantity)
      : ""
  );

  setFinalPrice(
    data?.final_price !== null &&
      data?.final_price !== undefined
      ? String(data.final_price)
      : ""
  );

  setFinalAmount(
    data?.final_amount !== null &&
      data?.final_amount !== undefined
      ? Number(data.final_amount)
      : null
  );

  setAssessmentSaved(
    Boolean(
      data?.grade &&
        data?.actual_quantity &&
        data?.final_price
    )
  );
}

  /*
   * Load the real queue for THIS centre only.
   */
  async function loadQueue() {
  const currentVersion =
    ++loadQueueVersion.current;

  const centreId = getActiveCentreId();

  if (!centreId) {
    router.push("/centre/login");
    return;
  }

  const { data: queueData, error: queueError } =
    await supabase
      .from("queue_entries")
      .select("*")
      .eq("centre_id", centreId)
        .order("created_at", {
          ascending: true,
        });

    if (
      currentVersion !==
      loadQueueVersion.current
    ) {
      return;
    }

    if (queueError) {
      console.error(
        "Queue load error:",
        queueError
      );

      setIsLoading(false);
      return;
    }

    if (!queueData || queueData.length === 0) {
      setFarmers([]);
      setSelectedToken(null);
      setProcurementStatus(null);
      setIsLoading(false);
      return;
    }

    const typedQueue =
      queueData as QueueEntry[];

    /*
     * Load booking information.
     */
    const bookingIds = typedQueue.map(
      (entry) => entry.booking_id
    );

    const {
      data: bookingData,
      error: bookingError,
    } = await supabase
      .from("bookings")
      .select(
        "id, crop, quantity, slot"
      )
      .in("id", bookingIds);

    if (
      currentVersion !==
      loadQueueVersion.current
    ) {
      return;
    }

    if (bookingError) {
      console.error(
        "Booking load error:",
        bookingError
      );
    }

    /*
     * Load farmer profiles.
     */
    const farmerIds = typedQueue.map(
      (entry) => entry.farmer_id
    );

    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", farmerIds);

    if (
      currentVersion !==
      loadQueueVersion.current
    ) {
      return;
    }

    if (profileError) {
      console.error(
        "Profile load error:",
        profileError
      );
    }

    /*
     * Combine queue + booking + profile data.
     */
    const updatedFarmers: Farmer[] =
      typedQueue.map((entry) => {
        const booking =
          bookingData?.find(
            (item) =>
              item.id ===
              entry.booking_id
          );

        const profile =
          profileData?.find(
            (item) =>
              item.id ===
              entry.farmer_id
          );

        return {
          token: entry.token,
          name:
            profile?.name ??
            "Farmer",
          crop:
            booking?.crop ??
            "—",
          quantity:
            booking?.quantity !==
              null &&
            booking?.quantity !==
              undefined
              ? `${booking.quantity} q`
              : "—",
          slot:
            booking?.slot ??
            "—",
          status: entry.status,
        };
      });

    if (
      currentVersion !==
      loadQueueVersion.current
    ) {
      return;
    }

    setFarmers(updatedFarmers);

    /*
     * If somebody is currently being served,
     * keep that farmer selected.
     */
    const servingFarmer =
      updatedFarmers.find(
        (farmer) =>
          farmer.status ===
          "Serving"
      );

    if (servingFarmer) {
      localStorage.setItem(
        ACTIVE_TOKEN_KEY,
        servingFarmer.token
      );

      setSelectedToken(
        servingFarmer.token
      );

      await loadProcurementStatus(
        servingFarmer.token
      );

      setIsLoading(false);
      return;
    }

    /*
     * Otherwise restore the last selected token.
     */
    const savedToken =
      localStorage.getItem(
        ACTIVE_TOKEN_KEY
      );

    const savedFarmer = savedToken
      ? updatedFarmers.find(
          (farmer) =>
            farmer.token ===
            savedToken
        )
      : null;

    if (savedFarmer) {
      setSelectedToken(
        savedFarmer.token
      );

      await loadProcurementStatus(
        savedFarmer.token
      );

      setIsLoading(false);
      return;
    }

    /*
     * Otherwise select the first farmer.
     */
    const firstFarmer =
      updatedFarmers[0];

    setSelectedToken(
      firstFarmer?.token ??
        null
    );

    if (firstFarmer?.token) {
      await loadProcurementStatus(
        firstFarmer.token
      );
    } else {
      setProcurementStatus(null);
    }

    setIsLoading(false);
  }

  /*
   * Initial loading + Supabase Realtime.
   */
  useEffect(() => {
    let queueChannel:
      | ReturnType<
          typeof supabase.channel
        >
      | null = null;

    let procurementChannel:
      | ReturnType<
          typeof supabase.channel
        >
      | null = null;

    const initialize = async () => {
      await loadCentre();
      await loadQueue();

      /*
       * Queue realtime.
       *
       * queue_entries is already part of
       * supabase_realtime in your database.
       */
      queueChannel = supabase
        .channel(
          "centre-dashboard-queue"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "queue_entries",
          },
          (payload) => {
            const newRow =
              payload.new as {
                centre_id?: string;
              };

            const oldRow =
              payload.old as {
                centre_id?: string;
              };

            const changedCentreId =
              newRow?.centre_id ??
              oldRow?.centre_id;

            /*
             * Only reload when the changed row
             * belongs to this centre.
             */
            if (
  changedCentreId ===
  getActiveCentreId()
) {
  void loadQueue();
}
          }
        )
        .subscribe(
          (status, error) => {
            console.log(
              "Centre queue realtime:",
              status
            );

            if (
              status ===
                "CHANNEL_ERROR" ||
              status ===
                "TIMED_OUT"
            ) {
              console.error(
                "Centre queue realtime error:",
                error
              );
            }
          }
        );

      /*
       * Procurement realtime.
       */
      procurementChannel =
        supabase
          .channel(
            "centre-dashboard-procurement"
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "procurements",
            },
            (payload) => {
              const newRow =
                payload.new as {
                  token?: string;
                };

              const oldRow =
                payload.old as {
                  token?: string;
                };

              const changedToken =
                newRow?.token ??
                oldRow?.token;

              const activeToken =
                localStorage.getItem(
                  ACTIVE_TOKEN_KEY
                );

              if (
                changedToken ===
                activeToken
              ) {
                void loadProcurementStatus(
                  changedToken
                );
              }

              /*
               * Reload queue as well because
               * payment received can complete
               * the farmer's queue entry.
               */
              void loadQueue();
            }
          )
          .subscribe(
            (status, error) => {
              console.log(
                "Centre procurement realtime:",
                status
              );

              if (
                status ===
                  "CHANNEL_ERROR" ||
                status ===
                  "TIMED_OUT"
              ) {
                console.error(
                  "Centre procurement realtime error:",
                  error
                );
              }
            }
          );
    };

    const timer =
      window.setTimeout(() => {
        void initialize();
      }, 0);

    /*
     * Keep compatibility with other AgriTrack
     * pages that dispatch local events.
     */
    const updateQueue = () => {
      void loadQueue();
    };

    const updateProcurement = () => {
      const token =
        localStorage.getItem(
          ACTIVE_TOKEN_KEY
        );

      if (token) {
        void loadProcurementStatus(
          token
        );
      }

      void loadQueue();
    };

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

      if (queueChannel) {
        void supabase.removeChannel(
          queueChannel
        );
      }

      if (procurementChannel) {
        void supabase.removeChannel(
          procurementChannel
        );
      }
    };
  }, []);

  /*
   * Current serving farmer.
   */
  const servingFarmer = useMemo(
    () =>
      farmers.find(
        (farmer) =>
          farmer.status ===
          "Serving"
      ),
    [farmers]
  );

  /*
   * Farmer currently shown in procurement desk.
   */
  const selectedFarmer = useMemo(
    () =>
      servingFarmer ??
      farmers.find(
        (farmer) =>
          farmer.token ===
          selectedToken
      ),
    [
      farmers,
      selectedToken,
      servingFarmer,
    ]
  );

  const waitingCount =
    farmers.filter(
      (farmer) =>
        farmer.status ===
        "Waiting"
    ).length;

  const arrivedCount =
    farmers.filter(
      (farmer) =>
        farmer.status ===
        "Arrived"
    ).length;

  const completedCount =
    farmers.filter(
      (farmer) =>
        farmer.status ===
        "Completed"
    ).length;

  /*
   * Serve next.
   *
   * IMPORTANT:
   * Only Arrived farmers can be served.
   * Waiting farmers have not checked in yet.
   */
  async function serveNext() {
    if (isUpdating) {
      return;
    }

    const currentServing =
      farmers.find(
        (farmer) =>
          farmer.status ===
          "Serving"
      );

    const nextFarmer =
      farmers.find(
        (farmer) =>
          farmer.status ===
          "Arrived"
      );

    if (!nextFarmer) {
      alert(
        "No arrived farmer is ready to be served."
      );
      return;
    }

    setIsUpdating(true);

    try {
      /*
       * Finish the current farmer first.
       */
      if (currentServing) {
        const {
          error,
        } = await supabase
          .from("queue_entries")
          .update({
            status: "Completed",
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "token",
            currentServing.token
          )
          .eq(
            "status",
            "Serving"
          );

        if (error) {
          console.error(
            "Complete current farmer error:",
            error
          );

          alert(
            `Could not complete ${currentServing.token}: ${error.message}`
          );

          return;
        }
      }

      /*
       * Serve the next Arrived farmer.
       */
      const {
        error: serveError,
      } = await supabase
        .from("queue_entries")
        .update({
          status: "Serving",
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "token",
          nextFarmer.token
        )
        .eq(
          "status",
          "Arrived"
        );

      if (serveError) {
        console.error(
          "Serve next farmer error:",
          serveError
        );

        alert(
          `Could not serve ${nextFarmer.token}: ${serveError.message}`
        );

        return;
      }

      localStorage.setItem(
        ACTIVE_TOKEN_KEY,
        nextFarmer.token
      );

      setSelectedToken(
        nextFarmer.token
      );

      await loadProcurementStatus(
        nextFarmer.token
      );

      await loadQueue();

      window.dispatchEvent(
        new Event(
          "agritrack-active-token-updated"
        )
      );

      window.dispatchEvent(
        new Event(
          "agritrack-queue-updated"
        )
      );
    } finally {
      setIsUpdating(false);
    }
  }

  /*
   * Mark a farmer as arrived.
   */
  async function markArrived(
    token: string
  ) {
    if (isUpdating) {
      return;
    }

    setIsUpdating(true);

    try {
      const { error } =
        await supabase
          .from("queue_entries")
          .update({
            status: "Arrived",
            updated_at:
              new Date().toISOString(),
          })
          .eq("token", token)
          .eq("status", "Waiting");

      if (error) {
        console.error(
          "Mark arrived error:",
          error
        );

        alert(
          `Could not mark ${token} as arrived: ${error.message}`
        );

        return;
      }

      await loadQueue();

      window.dispatchEvent(
        new Event(
          "agritrack-queue-updated"
        )
      );
    } finally {
      setIsUpdating(false);
    }
  }

  /*
   * Serve a specific Arrived farmer.
   */
  async function serveFarmer(
    token: string
  ) {
    if (isUpdating) {
      return;
    }

    const targetFarmer =
      farmers.find(
        (farmer) =>
          farmer.token === token
      );

    if (
      !targetFarmer ||
      targetFarmer.status !==
        "Arrived"
    ) {
      alert(
        "Only an arrived farmer can be served."
      );
      return;
    }

    const currentServing =
      farmers.find(
        (farmer) =>
          farmer.status ===
          "Serving"
      );

    setIsUpdating(true);

    try {
      /*
       * Finish previous serving farmer.
       */
      if (
        currentServing &&
        currentServing.token !== token
      ) {
        const {
          error: completeError,
        } = await supabase
          .from("queue_entries")
          .update({
            status: "Completed",
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "token",
            currentServing.token
          )
          .eq(
            "status",
            "Serving"
          );

        if (completeError) {
          console.error(
            "Complete current farmer error:",
            completeError
          );

          alert(
            `Could not complete ${currentServing.token}: ${completeError.message}`
          );

          return;
        }
      }

      /*
       * Start serving selected farmer.
       */
      const { error } =
        await supabase
          .from("queue_entries")
          .update({
            status: "Serving",
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "token",
            token
          )
          .eq(
            "status",
            "Arrived"
          );

      if (error) {
        console.error(
          "Serve farmer error:",
          error
        );

        alert(
          `Could not serve ${token}: ${error.message}`
        );

        return;
      }

      localStorage.setItem(
        ACTIVE_TOKEN_KEY,
        token
      );

      setSelectedToken(token);

      await loadProcurementStatus(
        token
      );

      await loadQueue();

      window.dispatchEvent(
        new Event(
          "agritrack-active-token-updated"
        )
      );

      window.dispatchEvent(
        new Event(
          "agritrack-queue-updated"
        )
      );
    } finally {
      setIsUpdating(false);
    }
  }

  /*
   * Skip / cancel a farmer.
   */
  async function skipFarmer(
    token: string
  ) {
    if (isUpdating) {
      return;
    }

    setIsUpdating(true);

    try {
      const { error } =
        await supabase
          .from("queue_entries")
          .update({
            status: "Cancelled",
            updated_at:
              new Date().toISOString(),
          })
          .eq("token", token)
          .in("status", [
            "Waiting",
            "Arrived",
          ]);

      if (error) {
        console.error(
          "Skip farmer error:",
          error
        );

        alert(
          `Could not skip ${token}: ${error.message}`
        );

        return;
      }

      if (
        localStorage.getItem(
          ACTIVE_TOKEN_KEY
        ) === token
      ) {
        localStorage.removeItem(
          ACTIVE_TOKEN_KEY
        );
      }

      await loadQueue();

      window.dispatchEvent(
        new Event(
          "agritrack-queue-updated"
        )
      );
    } finally {
      setIsUpdating(false);
    }
  }
  async function saveQualityAssessment() {
  const serving = selectedFarmer;

  if (
    !serving ||
    serving.status !== "Serving"
  ) {
    alert(
      "No farmer is currently being served."
    );
    return;
  }

  if (!qualityGrade) {
    alert("Please select a quality grade.");
    return;
  }

  const quantity = Number(actualQuantity);
  const price = Number(finalPrice);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    alert("Please enter a valid actual quantity.");
    return;
  }

  if (!Number.isFinite(price) || price <= 0) {
    alert("Please enter a valid final price.");
    return;
  }

  if (isUpdating) {
    return;
  }

  setIsUpdating(true);

  try {
    const { data, error } = await supabase
      .from("procurements")
      .update({
        grade: qualityGrade,
        actual_quantity: quantity,
        final_price: price,
        updated_at: new Date().toISOString(),
      })
      .eq("token", serving.token)
      .select(
        "token, status, grade, actual_quantity, final_price, final_amount"
      )
      .maybeSingle();

    if (error) {
      console.error(
        "Quality assessment error:",
        error
      );

      alert(
        `Could not save assessment: ${error.message}`
      );

      return;
    }

    if (!data) {
      alert(
        `No procurement record found for ${serving.token}.`
      );

      return;
    }

    setQualityGrade(data.grade ?? "");
    setActualQuantity(
      data.actual_quantity !== null &&
        data.actual_quantity !== undefined
        ? String(data.actual_quantity)
        : ""
    );

    setFinalPrice(
      data.final_price !== null &&
        data.final_price !== undefined
        ? String(data.final_price)
        : ""
    );

    setFinalAmount(
      data.final_amount !== null &&
        data.final_amount !== undefined
        ? Number(data.final_amount)
        : quantity * price
    );

    setAssessmentSaved(true);

    window.dispatchEvent(
      new Event(
        "agritrack-procurement-updated"
      )
    );

    alert(
      `Quality assessment saved for ${serving.token}.`
    );
  } finally {
    setIsUpdating(false);
  }
}
  /*
   * Move procurement through its stages.
   */
  async function updateProcurementStatus(
    status: ProcurementStatus
  ) {
    const serving =
      selectedFarmer;

    if (
      !serving ||
      serving.status !==
        "Serving"
    ) {
      alert(
        "No farmer is currently being served."
      );
      return;
    }

    if (isUpdating) {
      return;
    }

    const updateData: {
      status: ProcurementStatus;
      updated_at: string;
      payment_status?:
        | "Pending"
        | "Processing"
        | "Received";
    } = {
      status,
      updated_at:
        new Date().toISOString(),
    };

    if (
      status === "processing"
    ) {
      updateData.payment_status =
        "Processing";
    }

    if (status === "paid") {
      updateData.payment_status =
        "Received";
    }

    setIsUpdating(true);

    try {
      console.log(
        "Updating procurement:",
        serving.token,
        updateData
      );

      const {
        data: procurementData,
        error: procurementError,
      } = await supabase
        .from("procurements")
        .update(updateData)
        .eq(
          "token",
          serving.token
        )
        .select(
          "token, status, payment_status"
        )
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

      /*
       * Payment received means:
       * procurement is finished
       * AND farmer leaves the queue.
       */
      if (status === "paid") {
        const {
          error: queueError,
        } = await supabase
          .from("queue_entries")
          .update({
            status: "Completed",
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "token",
            serving.token
          )
          .eq(
            "status",
            "Serving"
          );

        if (queueError) {
          console.error(
            "Queue completion error:",
            queueError
          );

          alert(
            `Payment was received, but queue completion failed: ${queueError.message}`
          );

          return;
        }

        localStorage.removeItem(
          ACTIVE_TOKEN_KEY
        );

        setProcurementStatus(
          "paid"
        );

        setSelectedToken(
          null
        );

        await loadQueue();

        window.dispatchEvent(
          new Event(
            "agritrack-active-token-updated"
          )
        );

        window.dispatchEvent(
          new Event(
            "agritrack-queue-updated"
          )
        );

        window.dispatchEvent(
          new Event(
            "agritrack-procurement-updated"
          )
        );

        return;
      }

      setProcurementStatus(
        status
      );

      window.dispatchEvent(
        new Event(
          "agritrack-procurement-updated"
        )
      );
    } finally {
      setIsUpdating(false);
    }
  }

  /*
   * Reset demo.
   *
   * This resets all queue/procurement records
   * visible to this centre.
   */
  async function resetDemo() {
    if (isUpdating) {
      return;
    }

    const confirmed =
      window.confirm(
        `Reset the ${centre?.name ?? "centre"} demo queue and procurement stages?`
      );

    if (!confirmed) {
      return;
    }

    setIsUpdating(true);

    try {
      /*
       * Reset queue.
       */
      const {
        error: queueError,
      } = await supabase
        .from("queue_entries")
        .update({
          status: "Waiting",
          updated_at:
            new Date().toISOString(),
        })
        .eq(
  "centre_id",
  getActiveCentreId()
)
        .neq(
          "status",
          "Waiting"
        );

      if (queueError) {
        console.error(
          "Reset queue error:",
          queueError
        );

        alert(
          `Could not reset queue: ${queueError.message}`
        );

        return;
      }

      /*
       * Reset procurement.
       */
      const {
        error: procurementError,
      } = await supabase
        .from("procurements")
        .update({
          status: "booking",
          payment_status:
            "Pending",
          updated_at:
            new Date().toISOString(),
        })
        .in(
          "token",
          farmers.map(
            (farmer) =>
              farmer.token
          )
        );

      if (procurementError) {
        console.error(
          "Reset procurement error:",
          procurementError
        );

        alert(
          `Could not reset procurement: ${procurementError.message}`
        );

        return;
      }

      localStorage.removeItem(
        ACTIVE_TOKEN_KEY
      );

      setSelectedToken(null);
      setProcurementStatus(null);
      setQualityGrade("");
setActualQuantity("");
setFinalPrice("");
setFinalAmount(null);
setAssessmentSaved(false);

      await loadQueue();

      window.dispatchEvent(
        new Event(
          "agritrack-active-token-updated"
        )
      );

      window.dispatchEvent(
        new Event(
          "agritrack-queue-updated"
        )
      );
    } finally {
      setIsUpdating(false);
    }
  }

  /*
   * Show a useful loading state.
   */
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4F0E6] text-[#172019]">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#173F2A] text-[#F4F0E6]">
            <Weight size={20} />
          </div>

          <p className="mt-5 text-sm text-[#172019]/50">
            Loading centre dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F0E6] text-[#172019]">
      {/* NAVBAR */}
      <nav className="border-b border-[#173F2A]/10 bg-[#F4F0E6]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#173F2A] text-[#F4F0E6]">
              <Weight
                size={17}
                strokeWidth={2}
              />
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
                router.push(
                  "/centre/dashboard"
                )
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
              onClick={async () => {
  await supabase.auth.signOut();

  localStorage.removeItem("agritrack-centre-id");
  localStorage.removeItem("agritrack-centre-name");

  router.replace("/");
}}
              className="mb-6 flex items-center gap-2 text-sm text-[#172019]/45 transition hover:text-[#173F2A]"
            >
              <ArrowLeft size={15} />
              Exit centre
            </button>

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#5F8F45]">
              {centre?.name ??
                "Procurement Centre"}{" "}
              · Today
            </p>

            <h1 className="text-4xl font-semibold tracking-[-0.06em] md:text-6xl">
              Centre dashboard
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-[#172019]/55">
              Manage today&apos;s farmer
              queue, procurement and
              payment progress from one
              place.
            </p>
          </div>

          <button
            onClick={resetDemo}
            disabled={isUpdating}
            className="flex items-center justify-center gap-2 rounded-[12px] border border-[#173F2A]/15 bg-white/35 px-5 py-3 text-sm font-medium transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={
                isUpdating
                  ? "animate-spin"
                  : ""
              }
            />
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
                  {servingFarmer?.token ??
                    "—"}
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
                    {
                      servingFarmer.crop
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#F4F0E6]/40">
                    Quantity
                  </p>

                  <p className="mt-1 text-sm">
                    {
                      servingFarmer.quantity
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#F4F0E6]/40">
                    Slot
                  </p>

                  <p className="mt-1 text-sm">
                    {
                      servingFarmer.slot
                    }
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={serveNext}
              disabled={
                isUpdating ||
                arrivedCount === 0
              }
              className="mt-8 flex w-full items-center justify-between rounded-[12px] bg-[#F4F0E6] px-5 py-4 text-left text-[#173F2A] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="font-medium">
                {arrivedCount > 0
                  ? "Serve next farmer"
                  : "Waiting for farmer arrival"}
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
                      {
                        selectedFarmer.name
                      }
                    </p>

                    <p className="text-sm text-[#172019]/45">
                      Token{" "}
                      {
                        selectedFarmer.token
                      }
                    </p>
                  </div>
                </div>

                <div className="mt-7 space-y-4 border-t border-[#173F2A]/10 pt-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#172019]/45">
                      Crop
                    </span>

                    <span>
                      {
                        selectedFarmer.crop
                      }
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-[#172019]/45">
                      Quantity
                    </span>

                    <span>
                      {
                        selectedFarmer.quantity
                      }
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-[#172019]/45">
                      Queue status
                    </span>

                    <span>
                      {
                        selectedFarmer.status
                      }
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-[#172019]/45">
                      Procurement
                    </span>

                    <span className="capitalize">
                      {
                        procurementStatus ??
                        "—"
                      }
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

                  {selectedFarmer.status ===
                    "Serving" && (
                    <>
                      {(procurementStatus ===
                        null ||
                        procurementStatus ===
                          "booking" ||
                        procurementStatus ===
                          "arrived") && (
                        <button
                          disabled={
                            isUpdating
                          }
                          onClick={() =>
                            updateProcurementStatus(
                              "weighing"
                            )
                          }
                          className="flex w-full items-center justify-between rounded-[12px] border border-[#173F2A]/15 bg-white/30 px-5 py-4 text-sm transition hover:bg-white/60 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Start weighing
                          <Weight
                            size={17}
                          />
                        </button>
                      )}

                      {procurementStatus ===
                        "weighing" && (
                        <button
                          disabled={
                            isUpdating
                          }
                          onClick={() =>
                            updateProcurementStatus(
                              "quality"
                            )
                          }
                          className="flex w-full items-center justify-between rounded-[12px] border border-[#173F2A]/15 bg-white/30 px-5 py-4 text-sm transition hover:bg-white/60 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Complete
                          weighing →
                          Quality check
                          <ChevronRight
                            size={17}
                          />
                        </button>
                      )}

                      {procurementStatus === "quality" && (
  <div className="mt-4 space-y-4">
    <div className="border-y border-[#173F2A]/10 py-5">
      <div className="mb-4">
        <p className="text-sm font-semibold">
          Quality assessment
        </p>

        <p className="mt-1 text-xs leading-5 text-[#172019]/45">
          Enter the actual quantity and final price after physical quality checking.
        </p>
      </div>

      {/* GRADE */}
      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-[#172019]/45">
          Quality grade
        </label>

        <div className="grid grid-cols-3 gap-2">
          {["A", "B", "C"].map((grade) => (
            <button
              key={grade}
              type="button"
              disabled={isUpdating}
              onClick={() =>
                setQualityGrade(grade)
              }
              className={`rounded-[10px] border px-4 py-3 text-sm font-semibold transition ${
                qualityGrade === grade
                  ? "border-[#173F2A] bg-[#173F2A] text-[#F4F0E6]"
                  : "border-[#173F2A]/15 bg-white/30 hover:bg-white/70"
              }`}
            >
              Grade {grade}
            </button>
          ))}
        </div>
      </div>

      {/* ACTUAL QUANTITY */}
      <div>
        <label
          htmlFor="actual-quantity"
          className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-[#172019]/45"
        >
          Actual quantity (quintals)
        </label>

        <input
          id="actual-quantity"
          type="number"
          min="0.01"
          step="0.01"
          value={actualQuantity}
          onChange={(event) => {
            setActualQuantity(
              event.target.value
            );
            setAssessmentSaved(false);
          }}
          placeholder="e.g. 48.5"
          className="w-full rounded-[10px] border border-[#173F2A]/15 bg-white/40 px-4 py-3 text-sm outline-none transition focus:border-[#173F2A]"
        />
      </div>

      {/* FINAL PRICE */}
      <div>
        <label
          htmlFor="final-price"
          className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-[#172019]/45"
        >
          Final price (₹ / quintal)
        </label>

        <input
          id="final-price"
          type="number"
          min="0.01"
          step="0.01"
          value={finalPrice}
          onChange={(event) => {
            setFinalPrice(
              event.target.value
            );
            setAssessmentSaved(false);
          }}
          placeholder="e.g. 4050"
          className="w-full rounded-[10px] border border-[#173F2A]/15 bg-white/40 px-4 py-3 text-sm outline-none transition focus:border-[#173F2A]"
        />

        <p className="mt-2 text-xs leading-5 text-[#172019]/40">
          Final price may differ from the indicative booking price after quality assessment.
        </p>
      </div>

      {/* CALCULATED AMOUNT */}
      {actualQuantity &&
        finalPrice &&
        Number(actualQuantity) > 0 &&
        Number(finalPrice) > 0 && (
          <div className="rounded-[10px] bg-[#D9C99A]/20 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.12em] text-[#172019]/40">
              Final procurement amount
            </p>

            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              ₹
              {(
                Number(actualQuantity) *
                Number(finalPrice)
              ).toLocaleString("en-IN")}
            </p>

            <p className="mt-1 text-xs text-[#172019]/40">
              {actualQuantity} q × ₹
              {Number(finalPrice).toLocaleString(
                "en-IN"
              )}
              /q
            </p>
          </div>
        )}

      {/* SAVE */}
      <button
        disabled={
          isUpdating ||
          !qualityGrade ||
          !actualQuantity ||
          !finalPrice
        }
        onClick={() =>
          void saveQualityAssessment()
        }
        className="flex w-full items-center justify-between rounded-[12px] bg-[#5F8F45] px-5 py-4 text-sm font-medium text-white transition hover:bg-[#4F7D38] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span>
          {assessmentSaved
            ? "Assessment saved"
            : "Save quality assessment"}
        </span>

        <Check size={17} />
      </button>

      {/* COMPLETE */}
      <button
        disabled={
          isUpdating ||
          !assessmentSaved
        }
        onClick={() =>
          void updateProcurementStatus(
            "completed"
          )
        }
        className="flex w-full items-center justify-between rounded-[12px] border border-[#173F2A]/15 bg-white/30 px-5 py-4 text-sm transition hover:bg-white/60 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span>
          Complete procurement
        </span>

        <ChevronRight size={17} />
      </button>
    </div>
  </div>
)}

                      {procurementStatus ===
                        "completed" && (
                        <button
                          disabled={
                            isUpdating
                          }
                          onClick={() =>
                            updateProcurementStatus(
                              "processing"
                            )
                          }
                          className="flex w-full items-center justify-between rounded-[12px] border border-[#173F2A]/15 bg-white/30 px-5 py-4 text-sm transition hover:bg-white/60 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Start payment
                          <ChevronRight
                            size={17}
                          />
                        </button>
                      )}

                      {procurementStatus ===
                        "processing" && (
                        <button
                          disabled={
                            isUpdating
                          }
                          onClick={() =>
                            updateProcurementStatus(
                              "paid"
                            )
                          }
                          className="flex w-full items-center justify-between rounded-[12px] border border-[#173F2A]/15 bg-white/30 px-5 py-4 text-sm transition hover:bg-white/60 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Mark payment
                          received
                          <Check size={17} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              <p className="mt-6 text-sm text-[#172019]/50">
                Select a farmer from
                the queue.
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
                {farmers.map(
                  (farmer) => (
                    <tr
                      key={
                        farmer.token
                      }
                      onClick={() => {
                        setSelectedToken(
                          farmer.token
                        );

                        void loadProcurementStatus(
                          farmer.token
                        );
                      }}
                      className={`cursor-pointer border-b border-[#173F2A]/8 transition hover:bg-white/40 ${
                        selectedToken ===
                        farmer.token
                          ? "bg-white/50"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-5 font-semibold">
                        {
                          farmer.token
                        }
                      </td>

                      <td className="px-4 py-5 text-sm">
                        {
                          farmer.name
                        }
                      </td>

                      <td className="px-4 py-5 text-sm text-[#172019]/60">
                        {
                          farmer.crop
                        }
                      </td>

                      <td className="px-4 py-5 text-sm text-[#172019]/60">
                        {
                          farmer.quantity
                        }
                      </td>

                      <td className="px-4 py-5">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
                            farmer.status ===
                            "Serving"
                              ? "bg-[#173F2A] text-[#F4F0E6]"
                              : farmer.status ===
                                  "Completed"
                                ? "bg-[#5F8F45]/15 text-[#173F2A]"
                                : farmer.status ===
                                    "Arrived"
                                  ? "bg-[#D78A32]/20 text-[#7A4B17]"
                                  : farmer.status ===
                                      "Cancelled"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-[#172019]/8 text-[#172019]/60"
                          }`}
                        >
                          {farmer.status ===
                            "Completed" && (
                            <Check
                              size={12}
                            />
                          )}

                          {farmer.status ===
                            "Serving" && (
                            <Clock3
                              size={12}
                            />
                          )}

                          {farmer.status}
                        </span>
                      </td>

                      <td className="px-4 py-5">
                        <div className="flex justify-end gap-2">
                          {farmer.status ===
                            "Waiting" && (
                            <button
                              disabled={
                                isUpdating
                              }
                              onClick={(
                                event
                              ) => {
                                event.stopPropagation();

                                void markArrived(
                                  farmer.token
                                );
                              }}
                              className="rounded-[10px] border border-[#173F2A]/15 px-3 py-2 text-xs font-medium hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Mark arrived
                            </button>
                          )}

                          {farmer.status ===
                            "Arrived" && (
                            <button
                              disabled={
                                isUpdating
                              }
                              onClick={(
                                event
                              ) => {
                                event.stopPropagation();

                                void serveFarmer(
                                  farmer.token
                                );
                              }}
                              className="rounded-[10px] bg-[#173F2A] px-3 py-2 text-xs font-medium text-[#F4F0E6] hover:bg-[#204D34] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Serve
                            </button>
                          )}

                          {(
                            [
                              "Waiting",
                              "Arrived",
                            ] as QueueStatus[]
                          ).includes(
                            farmer.status
                          ) && (
                            <button
                              disabled={
                                isUpdating
                              }
                              onClick={(
                                event
                              ) => {
                                event.stopPropagation();

                                void skipFarmer(
                                  farmer.token
                                );
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-[#173F2A]/10 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                              title="Skip"
                            >
                              <SkipForward
                                size={14}
                              />
                            </button>
                          )}

                          {farmer.status ===
                            "Serving" && (
                            <button
                              onClick={(
                                event
                              ) =>
                                event.stopPropagation()
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-[#173F2A]/10 hover:bg-white"
                              title="More"
                            >
                              <MoreHorizontal
                                size={16}
                              />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )}
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
                Queue is{" "}
                {arrivedCount >
                0
                  ? "ready to move"
                  : "waiting for arrivals"}
              </p>

              <p className="mt-1 text-sm leading-6 text-[#172019]/50">
                Average processing time
                is currently around{" "}
                <span className="font-medium text-[#172019]/70">
                  {centre?.avg_processing_minutes ??
                    15}{" "}
                  minutes
                </span>{" "}
                per farmer.
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              router.push("/queue")
            }
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