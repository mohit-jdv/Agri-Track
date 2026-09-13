"use client";

import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Leaf,
  MapPin,
  Menu,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getNotifications,
  saveNotifications,
  getQueue,
  type Notification,
} from "@/lib/demo-store";

export default function Dashboard() {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  /*
   * IMPORTANT:
   * Do not call getQueue() inside useState().
   * getQueue() can read localStorage, which would make
   * server HTML and client HTML different during hydration.
   */
  const [queue, setQueue] = useState<ReturnType<typeof getQueue>>([]);

  useEffect(() => {
    setNotifications(getNotifications());
    setQueue(getQueue());

    const updateDashboard = () => {
      setNotifications(getNotifications());
      setQueue(getQueue());
    };

    window.addEventListener("storage", updateDashboard);

    window.addEventListener(
      "agritrack-notifications-updated",
      updateDashboard
    );

    window.addEventListener(
      "agritrack-queue-updated",
      updateDashboard
    );

    return () => {
      window.removeEventListener("storage", updateDashboard);

      window.removeEventListener(
        "agritrack-notifications-updated",
        updateDashboard
      );

      window.removeEventListener(
        "agritrack-queue-updated",
        updateDashboard
      );
    };
  }, []);

  /*
   * Current demo farmer is A-105.
   *
   * We intentionally do NOT fall back to another farmer's token.
   * Otherwise the dashboard could incorrectly display another
   * farmer's booking.
   */
  const yourFarmer = queue.find(
    (farmer) => farmer.token === "A-105"
  );

  const yourToken = yourFarmer?.token ?? "A-105";

  const servingFarmer = queue.find(
    (farmer) => farmer.status === "Serving"
  );

  const farmersAhead = yourFarmer
    ? queue.filter(
        (farmer) =>
          farmer.status === "Waiting" &&
          farmer.token !== yourToken
      ).length
    : 0;

  const estimatedWait = Math.max(farmersAhead * 4, 0);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  return (
    <main className="min-h-screen bg-[#F4F0E6] text-[#172019]">
      {/* NAVBAR */}
      <nav className="border-b border-[#173F2A]/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
          {/* Logo */}
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#173F2A] text-[#F4F0E6]">
              <Leaf size={17} />
            </div>

            <span className="text-lg font-semibold tracking-[-0.04em]">
              AgriTrack
            </span>
          </button>

          {/* Desktop navigation */}
          <div className="hidden items-center gap-7 lg:flex">
            <NavLink
              label="Dashboard"
              active
              onClick={() => router.push("/dashboard")}
            />

            <NavLink
              label="Book slot"
              onClick={() => router.push("/booking")}
            />

            <NavLink
              label="Queue"
              onClick={() => router.push("/queue")}
            />

            <NavLink
              label="Procurement"
              onClick={() => router.push("/procurement")}
            />

            <NavLink
              label="Payments"
              onClick={() => router.push("/payment")}
            />
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="hidden rounded-full border border-[#173F2A]/15 bg-white/30 px-4 py-2 text-sm transition hover:bg-white/60 sm:block"
            >
              English
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setNotificationsOpen(!notificationsOpen)
                }
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#173F2A]/15 bg-white/30 transition hover:bg-white/60"
                aria-label="Notifications"
              >
                <Bell size={18} />

                {unreadCount > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#D78A32]" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-12 z-50 w-[320px] rounded-[14px] border border-[#173F2A]/10 bg-[#F4F0E6] p-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-[#173F2A]/10 pb-3">
                    <div>
                      <p className="font-semibold">
                        Notifications
                      </p>

                      <p className="mt-0.5 text-xs text-[#172019]/40">
                        {unreadCount} unread
                      </p>
                    </div>

                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const readNotifications =
                            notifications.map(
                              (notification) => ({
                                ...notification,
                                read: true,
                              })
                            );

                          saveNotifications(readNotifications);
                          setNotifications(readNotifications);
                        }}
                        className="text-xs font-medium text-[#173F2A] hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-center text-sm text-[#172019]/40">
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`rounded-[10px] p-3 ${
                            notification.read
                              ? "bg-white/30"
                              : "bg-[#D9C99A]/20"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#173F2A]/10">
                              <Bell
                                size={14}
                                className="text-[#173F2A]"
                              />
                            </div>

                            <div>
                              <p className="text-sm font-medium">
                                {notification.title}
                              </p>

                              <p className="mt-1 text-xs leading-5 text-[#172019]/50">
                                {notification.message}
                              </p>

                              <p className="mt-1 text-[10px] text-[#172019]/35">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#173F2A]/15 bg-white/30 lg:hidden"
              aria-label="Menu"
            >
              {menuOpen ? (
                <X size={19} />
              ) : (
                <Menu size={19} />
              )}
            </button>

            {/* Avatar */}
            <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#173F2A] text-sm font-semibold text-[#F4F0E6] lg:flex">
              RP
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-[#173F2A]/10 px-6 py-5 lg:hidden">
            <div className="space-y-1">
              <MobileNavLink
                label="Dashboard"
                active
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/dashboard");
                }}
              />

              <MobileNavLink
                label="Book slot"
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/booking");
                }}
              />

              <MobileNavLink
                label="Queue"
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/queue");
                }}
              />

              <MobileNavLink
                label="Procurement"
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/procurement");
                }}
              />

              <MobileNavLink
                label="Payments"
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/payment");
                }}
              />
            </div>
          </div>
        )}
      </nav>

      {/* PAGE */}
      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-14">
        {/* HEADER */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#D78A32]" />

              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5F8F45]">
                Farmer dashboard
              </span>
            </div>

            <h1 className="text-[clamp(3rem,7vw,6rem)] font-semibold leading-[0.86] tracking-[-0.075em]">
              Good morning,
              <br />
              <span className="text-[#173F2A]">
                Ramesh.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-[#172019]/55">
              Here&apos;s everything you need for today&apos;s
              procurement.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/booking")}
            className="group flex w-full items-center justify-between rounded-[14px] bg-[#173F2A] px-6 py-5 text-left text-[#F4F0E6] transition hover:bg-[#204D34] md:w-auto md:min-w-[270px]"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#F4F0E6]/50">
                New booking
              </p>

              <p className="mt-1 text-lg font-medium">
                Book procurement slot
              </p>
            </div>

            <div className="ml-8 flex h-10 w-10 items-center justify-center rounded-full bg-[#D78A32] text-[#172019] transition-transform group-hover:translate-x-1">
              <ArrowUpRight size={19} />
            </div>
          </button>
        </div>

        {/* DIVIDER */}
        <div className="my-12 h-px bg-[#173F2A]/10" />

        {/* TODAY */}
        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr]">
          {/* Queue status */}
          <section>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#172019]/40">
                  Today&apos;s booking
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                  Your queue
                </h2>
              </div>

              <span className="rounded-full bg-[#D9C99A]/35 px-3 py-1.5 text-xs font-medium text-[#173F2A]">
                Confirmed
              </span>
            </div>

            <div className="rounded-[16px] border border-[#173F2A]/15 bg-white/40 p-6 md:p-8">
              {/* Queue top */}
              <div className="flex flex-col justify-between gap-7 sm:flex-row">
                <div>
                  <p className="text-sm text-[#172019]/45">
                    Token number
                  </p>

                  <p className="mt-1 text-5xl font-semibold tracking-[-0.06em] text-[#173F2A]">
                    {yourToken}
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-sm text-[#172019]/45">
                    Procurement centre
                  </p>

                  <div className="mt-2 flex items-center gap-2 sm:justify-end">
                    <MapPin
                      size={15}
                      className="text-[#5F8F45]"
                    />

                    <span className="font-medium">
                      Lasalgaon
                    </span>
                  </div>
                </div>
              </div>

              {/* Queue stats */}
              <div className="my-8 grid grid-cols-2 gap-4 border-y border-[#173F2A]/10 py-6 sm:grid-cols-3">
                <QueueStat
                  label="Now serving"
                  value={servingFarmer?.token ?? "—"}
                />

                <QueueStat
                  label="Ahead of you"
                  value={String(farmersAhead).padStart(
                    2,
                    "0"
                  )}
                />

                <QueueStat
                  label="Estimated wait"
                  value={`${estimatedWait} min`}
                />
              </div>

              {/* Progress */}
              <div>
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="font-medium text-[#173F2A]">
                    Queue progress
                  </span>

                  <span className="text-[#172019]/40">
                    {farmersAhead} farmers ahead
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-[#173F2A]/10">
                  <div
                    className="h-full rounded-full bg-[#5F8F45] transition-all"
                    style={{
                      width: `${Math.max(
                        10,
                        Math.min(
                          100,
                          ((queue.length -
                            farmersAhead) /
                            Math.max(
                              queue.length,
                              1
                            )) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Notification */}
              <div className="mt-7 flex items-start gap-3 rounded-[12px] bg-[#D9C99A]/20 p-4">
                <Bell
                  size={17}
                  className="mt-0.5 shrink-0 text-[#D78A32]"
                />

                <div>
                  <p className="text-sm font-medium">
                    We&apos;ll notify you when your turn is
                    near.
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#172019]/45">
                    You can continue with your day while
                    AgriTrack monitors the queue.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push("/queue")}
                className="mt-6 flex items-center gap-2 text-sm font-medium text-[#173F2A] hover:underline"
              >
                View live queue
                <ChevronRight size={16} />
              </button>
            </div>
          </section>

          {/* Booking details */}
          <section>
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#172019]/40">
                Booking details
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                Today&apos;s plan
              </h2>
            </div>

            <div className="space-y-3">
              <InfoRow
                icon={<Leaf size={18} />}
                label="Crop"
                value="Onion"
              />

              <InfoRow
                icon={<Wallet size={18} />}
                label="Quantity"
                value="50 quintals"
              />

              <InfoRow
                icon={<CalendarDays size={18} />}
                label="Date"
                value="12 September 2026"
              />

              <InfoRow
                icon={<Clock3 size={18} />}
                label="Slot"
                value="10:00 AM – 11:00 AM"
              />

              <InfoRow
                icon={<MapPin size={18} />}
                label="Centre"
                value="Lasalgaon Procurement Centre"
              />
            </div>

            <div className="mt-6 border-t border-[#173F2A]/10 pt-6">
              <p className="text-xs leading-5 text-[#172019]/40">
                Indicative price
              </p>

              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-semibold tracking-[-0.05em] text-[#173F2A]">
                  ₹4,400
                </span>

                <span className="text-sm text-[#172019]/45">
                  / quintal
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-[#172019]/40">
                Final price depends on quality and grade
                assessment at the centre.
              </p>
            </div>
          </section>
        </div>

        {/* PROCUREMENT JOURNEY */}
        <section className="mt-16">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#172019]/40">
                Procurement journey
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                Your progress
              </h2>
            </div>

            <button
              type="button"
              onClick={() => router.push("/procurement")}
              className="hidden items-center gap-1 text-sm font-medium text-[#173F2A] sm:flex"
            >
              View details
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="overflow-hidden rounded-[16px] border border-[#173F2A]/15 bg-white/35">
            <div className="grid md:grid-cols-6">
              <JourneyStep
                number="01"
                label="Booking confirmed"
                completed
              />

              <JourneyStep
                number="02"
                label="Arrived at centre"
                completed
              />

              <JourneyStep
                number="03"
                label="Weighing"
                active
              />

              <JourneyStep
                number="04"
                label="Quality assessment"
              />

              <JourneyStep
                number="05"
                label="Procurement completed"
              />

              <JourneyStep
                number="06"
                label="Payment received"
              />
            </div>
          </div>
        </section>

        {/* BOTTOM */}
        <section className="mt-16 grid gap-6 md:grid-cols-2">
          {/* Notification */}
          <div className="border-t border-[#173F2A]/15 pt-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D9C99A]/30 text-[#173F2A]">
                <Bell size={18} />
              </div>

              <div>
                <p className="text-sm font-medium">
                  Queue update
                </p>

                <p className="mt-1 text-sm leading-6 text-[#172019]/50">
                  Your estimated waiting time has changed
                  to {estimatedWait} minutes.
                </p>

                <p className="mt-2 text-xs text-[#172019]/35">
                  Just now
                </p>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="border-t border-[#173F2A]/15 pt-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D9C99A]/30 text-[#173F2A]">
                <Wallet size={18} />
              </div>

              <div>
                <p className="text-sm font-medium">
                  Last payment
                </p>

                <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#173F2A]">
                  ₹1,87,500
                </p>

                <p className="mt-1 text-xs text-[#172019]/40">
                  Onion · 45 quintals · Paid
                </p>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

/* Desktop navigation link */
function NavLink({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "text-sm transition " +
        (active
          ? "font-medium text-[#173F2A]"
          : "text-[#172019]/45 hover:text-[#173F2A]")
      }
    >
      {label}
    </button>
  );
}

/* Mobile navigation link */
function MobileNavLink({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex w-full items-center justify-between rounded-[10px] px-4 py-3 text-left text-sm " +
        (active
          ? "bg-[#173F2A] text-[#F4F0E6]"
          : "text-[#172019]/60 hover:bg-white/50")
      }
    >
      {label}

      {active && <Check size={16} />}
    </button>
  );
}

/* Queue statistic */
function QueueStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-[#172019]/40">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#173F2A]">
        {value}
      </p>
    </div>
  );
}

/* Booking information row */
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-[#173F2A]/10 py-4 last:border-b-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D9C99A]/25 text-[#173F2A]">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-[#172019]/40">
          {label}
        </p>

        <p className="mt-0.5 truncate text-sm font-medium">
          {value}
        </p>
      </div>
    </div>
  );
}

/* Procurement journey step */
function JourneyStep({
  number,
  label,
  completed = false,
  active = false,
}: {
  number: string;
  label: string;
  completed?: boolean;
  active?: boolean;
}) {
  return (
    <div
      className={
        "relative border-b border-[#173F2A]/10 p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 " +
        (active ? "bg-[#D9C99A]/20" : "")
      }
    >
      <div
        className={
          "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold " +
          (completed
            ? "bg-[#5F8F45] text-white"
            : active
              ? "bg-[#173F2A] text-[#F4F0E6]"
              : "border border-[#173F2A]/15 text-[#172019]/30")
        }
      >
        {completed ? <Check size={14} /> : number}
      </div>

      <p
        className={
          "mt-4 text-sm leading-5 " +
          (active
            ? "font-medium text-[#173F2A]"
            : completed
              ? "font-medium text-[#172019]"
              : "text-[#172019]/40")
        }
      >
        {label}
      </p>

      {active && (
        <span className="mt-3 inline-block text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D78A32]">
          Current
        </span>
      )}
    </div>
  );
}