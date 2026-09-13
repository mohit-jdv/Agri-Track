export type FarmerStatus =
  | "Waiting"
  | "Arrived"
  | "Serving"
  | "Completed";

export type Farmer = {
  token: string;
  name: string;
  crop: string;
  quantity: string;
  slot: string;
  status: FarmerStatus;
};

export const initialFarmers: Farmer[] = [
  {
    token: "A-101",
    name: "Suresh Pawar",
    crop: "Onion",
    quantity: "40 q",
    slot: "09:00–10:00",
    status: "Completed",
  },
  {
    token: "A-102",
    name: "Meena Shinde",
    crop: "Onion",
    quantity: "35 q",
    slot: "09:00–10:00",
    status: "Completed",
  },
  {
    token: "A-103",
    name: "Rajendra More",
    crop: "Onion",
    quantity: "50 q",
    slot: "10:00–11:00",
    status: "Completed",
  },
  {
    token: "A-104",
    name: "Vijay Patil",
    crop: "Onion",
    quantity: "45 q",
    slot: "10:00–11:00",
    status: "Serving",
  },
  {
    token: "A-105",
    name: "Ramesh Patil",
    crop: "Onion",
    quantity: "50 q",
    slot: "10:00–11:00",
    status: "Arrived",
  },
  {
    token: "A-106",
    name: "Sunita Jadhav",
    crop: "Onion",
    quantity: "42 q",
    slot: "11:00–12:00",
    status: "Waiting",
  },
  {
    token: "A-107",
    name: "Ganesh Wagh",
    crop: "Onion",
    quantity: "38 q",
    slot: "11:00–12:00",
    status: "Waiting",
  },
  {
    token: "A-108",
    name: "Prakash Kale",
    crop: "Onion",
    quantity: "55 q",
    slot: "12:00–13:00",
    status: "Waiting",
  },
];

const STORAGE_KEY = "agritrack-demo-queue";

export function getQueue(): Farmer[] {
  if (typeof window === "undefined") {
    return initialFarmers;
  }

  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialFarmers));
    return initialFarmers;
  }

  try {
    return JSON.parse(saved);
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialFarmers));
    return initialFarmers;
  }
}

export function saveQueue(queue: Farmer[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));

  // Tell other tabs that the queue changed.
  window.dispatchEvent(new Event("agritrack-queue-updated"));
}

export function resetQueue() {
  saveQueue(initialFarmers);
}

export type NotificationType =
  | "queue"
  | "procurement"
  | "payment";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
};

export const initialNotifications: Notification[] = [
  {
    id: "n1",
    type: "queue",
    title: "Queue update",
    message: "Your token A-105 is next. Please stay ready.",
    time: "Just now",
    read: false,
  },
];

const NOTIFICATION_KEY = "agritrack-demo-notifications";

export function getNotifications(): Notification[] {
  if (typeof window === "undefined") return initialNotifications;

  const saved = localStorage.getItem(NOTIFICATION_KEY);

  if (!saved) {
    localStorage.setItem(
      NOTIFICATION_KEY,
      JSON.stringify(initialNotifications)
    );

    return initialNotifications;
  }

  try {
    return JSON.parse(saved);
  } catch {
    localStorage.setItem(
      NOTIFICATION_KEY,
      JSON.stringify(initialNotifications)
    );

    return initialNotifications;
  }
}

export function saveNotifications(notifications: Notification[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    NOTIFICATION_KEY,
    JSON.stringify(notifications)
  );

  window.dispatchEvent(new Event("agritrack-notifications-updated"));
}

export function addNotification(
  notification: Omit<Notification, "id" | "time" | "read">
) {
  const current = getNotifications();

  const newNotification: Notification = {
    ...notification,
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    time: "Just now",
    read: false,
  };

  saveNotifications([newNotification, ...current]);
}


export type ProcurementStatus =
  | "booking"
  | "arrived"
  | "weighing"
  | "quality"
  | "completed"
  | "processing"
  | "paid";

export type ProcurementData = {
  token: string;
  status: ProcurementStatus;
  assessedQuantity: string;
  qualityGrade: string;
  qualityNote: string;
  finalPrice: string;
  paymentAmount: string;
};

export const initialProcurement: ProcurementData = {
  token: "A-105",
  status: "weighing",
  assessedQuantity: "48.5",
  qualityGrade: "Grade B",
  qualityNote: "Standard market quality",
  finalPrice: "4050",
  paymentAmount: "196425",
};

const procurementRecords: Record<string, ProcurementData> = {
  "A-104": {
    token: "A-104",
    status: "completed",
    assessedQuantity: "43.5",
    qualityGrade: "Grade A",
    qualityNote: "Good quality produce",
    finalPrice: "4300",
    paymentAmount: "187050",
  },

  "A-105": {
    token: "A-105",
    status: "weighing",
    assessedQuantity: "48.5",
    qualityGrade: "Grade B",
    qualityNote: "Standard market quality",
    finalPrice: "4050",
    paymentAmount: "196425",
  },

  "A-106": {
    token: "A-106",
    status: "arrived",
    assessedQuantity: "42",
    qualityGrade: "Grade B",
    qualityNote: "Standard market quality",
    finalPrice: "4050",
    paymentAmount: "170100",
  },

  "A-107": {
    token: "A-107",
    status: "arrived",
    assessedQuantity: "38",
    qualityGrade: "Grade A",
    qualityNote: "Good quality produce",
    finalPrice: "4300",
    paymentAmount: "163400",
  },

  "A-108": {
    token: "A-108",
    status: "arrived",
    assessedQuantity: "55",
    qualityGrade: "Grade B",
    qualityNote: "Standard market quality",
    finalPrice: "4050",
    paymentAmount: "222750",
  },
};

const PROCUREMENT_KEY = "agritrack-demo-procurement";

export function getProcurement(): ProcurementData {
  if (typeof window === "undefined") {
    return initialProcurement;
  }

  const saved = localStorage.getItem(PROCUREMENT_KEY);

  if (!saved) {
    localStorage.setItem(
      PROCUREMENT_KEY,
      JSON.stringify(initialProcurement)
    );

    return initialProcurement;
  }

  try {
    return JSON.parse(saved);
  } catch {
    localStorage.setItem(
      PROCUREMENT_KEY,
      JSON.stringify(initialProcurement)
    );

    return initialProcurement;
  }
}

export function getProcurementByToken(token: string): ProcurementData {
  if (typeof window === "undefined") {
    return procurementRecords[token] ?? initialProcurement;
  }

  const key = `agritrack-demo-procurement-${token}`;
  const saved = localStorage.getItem(key);

  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem(key);
    }
  }

  const record = procurementRecords[token] ?? {
    ...initialProcurement,
    token,
  };

  localStorage.setItem(key, JSON.stringify(record));

  return record;
}

export function saveProcurementByToken(data: ProcurementData) {
  if (typeof window === "undefined") return;

  const key = `agritrack-demo-procurement-${data.token}`;

  localStorage.setItem(key, JSON.stringify(data));

  window.dispatchEvent(
    new Event("agritrack-procurement-updated")
  );
}

export function saveProcurement(data: ProcurementData) {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    PROCUREMENT_KEY,
    JSON.stringify(data)
  );

  window.dispatchEvent(
    new Event("agritrack-procurement-updated")
  );
}

export function resetProcurement() {
  saveProcurement(initialProcurement);
}