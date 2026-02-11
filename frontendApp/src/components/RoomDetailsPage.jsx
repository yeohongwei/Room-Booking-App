import React, { useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import UserContext from "../context/user";
import sharedFetch from "../shared/sharedFetch";

const pad2 = (n) => String(n).padStart(2, "0");
const minutesToLabel = (mins) =>
  `${pad2(Math.floor(mins / 60))}:${pad2(mins % 60)}`;

const buildSlots = () => {
  const slots = [];
  for (let start = 8 * 60; start < 18 * 60; start += 30) {
    slots.push({ start, end: start + 30 });
  }
  return slots;
};

const sgDateTimeToUtcMs = (dateStr, minutesFromMidnight) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const hours = Math.floor(minutesFromMidnight / 60);
  const minutes = minutesFromMidnight % 60;
  return Date.UTC(y, m - 1, d, hours - 8, minutes, 0, 0);
};

const sgDateTimeToUtcIso = (dateStr, minutesFromMidnight) => {
  return new Date(
    sgDateTimeToUtcMs(dateStr, minutesFromMidnight),
  ).toISOString();
};

const todaySgDateStr = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now);
};

const RoomDetailsPage = () => {
  const { id } = useParams();
  const userCtx = useContext(UserContext);

  const [room, setRoom] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [equipmentNameByCode, setEquipmentNameByCode] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedDate, setSelectedDate] = useState(todaySgDateStr());

  const [startMinutes, setStartMinutes] = useState(8 * 60);
  const [duration, setDuration] = useState(30);
  const [bookingStatus, setBookingStatus] = useState("");

  const [bookingIsError, setBookingIsError] = useState(false);

  const fetchData = useMemo(
    () =>
      sharedFetch({
        getRefreshToken: () =>
          userCtx.refreshToken || localStorage.getItem("refreshToken"),
        setAccessToken: userCtx.setAccessToken,
        onAuthError: () => {
          userCtx.setRefreshToken?.("");
          userCtx.setAccessToken("");
        },
      }),
    [userCtx],
  );

  const load = async () => {
    setLoading(true);
    setErrorMsg("");

    const roomRes = await fetchData(
      `/rooms/${id}`,
      "GET",
      null,
      userCtx.accessToken,
    );
    if (!roomRes.ok) {
      setErrorMsg(roomRes.msg || "Failed to load room");
      setLoading(false);
      return;
    }
    setRoom(roomRes.data);

    const bookingsRes = await fetchData(
      `/bookings/room/${id}`,
      "GET",
      null,
      userCtx.accessToken,
    );
    if (!bookingsRes.ok) {
      setErrorMsg(bookingsRes.msg || "Failed to load room bookings");
      setBookings([]);
      setLoading(false);
      return;
    }
    setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);

    const eqRes = await fetchData(
      "/equipments",
      "GET",
      null,
      userCtx.accessToken,
    );
    if (eqRes.ok) {
      const list = Array.isArray(eqRes.data) ? eqRes.data : [];
      const map = {};
      for (const eq of list) {
        if (eq?.code) map[String(eq.code)] = eq.display_name || eq.code;
      }
      setEquipmentNameByCode(map);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const slots = buildSlots();

  const isSlotBooked = (slotStartMin, slotEndMin) => {
    const slotStartUtc = sgDateTimeToUtcMs(selectedDate, slotStartMin);
    const slotEndUtc = sgDateTimeToUtcMs(selectedDate, slotEndMin);

    return bookings.some((b) => {
      const bStart = Date.parse(b.start_time);
      const bEnd = Date.parse(b.end_time);
      return bStart < slotEndUtc && bEnd > slotStartUtc;
    });
  };

  const getSlotBooking = (slotStartMin, slotEndMin) => {
    const slotStartUtc = sgDateTimeToUtcMs(selectedDate, slotStartMin);
    const slotEndUtc = sgDateTimeToUtcMs(selectedDate, slotEndMin);

    return (
      bookings.find((b) => {
        const bStart = Date.parse(b.start_time);
        const bEnd = Date.parse(b.end_time);
        return bStart < slotEndUtc && bEnd > slotStartUtc;
      }) || null
    );
  };

  const submitBooking = async () => {
    setBookingStatus("");
    setBookingIsError(false);

    if (!userCtx.userId) {
      setBookingIsError(true);
      setBookingStatus("Missing user id");
      return;
    }

    const endMinutes = startMinutes + duration;

    if (startMinutes < 8 * 60 || startMinutes >= 18 * 60) {
      setBookingIsError(true);
      setBookingStatus("Start time must be between 08:00 and 18:00");
      return;
    }
    if (endMinutes > 18 * 60) {
      setBookingIsError(true);
      setBookingStatus("End time must be 18:00 or earlier");
      return;
    }
    if (duration > 120) {
      setBookingIsError(true);
      setBookingStatus("Booking duration must be 2 hours or less");
      return;
    }

    const startUtc = sgDateTimeToUtcIso(selectedDate, startMinutes);
    const endUtc = sgDateTimeToUtcIso(selectedDate, endMinutes);

    const res = await fetchData(
      "/bookings",
      "PUT",
      {
        user_id: userCtx.userId,
        room_id: id,
        start_time: startUtc,
        end_time: endUtc,
      },
      userCtx.accessToken,
    );

    if (!res.ok) {
      setBookingIsError(true);
      setBookingStatus(res.msg || "Booking failed");
      return;
    }

    setBookingStatus("Booking added");
    await load();
  };

  const timeOptions = [];
  for (let m = 8 * 60; m <= 17 * 60 + 30; m += 30) {
    timeOptions.push({ value: m, label: minutesToLabel(m) });
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-sm text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h2 className="text-xl font-semibold tracking-tight text-slate-900">
        Room Details
      </h2>

      {errorMsg ? (
        <div className="mt-4 text-sm text-red-600">{errorMsg}</div>
      ) : null}

      {room ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-slate-900">
                {room.name}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Capacity: {room.capacity}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Location: {room.location || "-"}
              </div>
            </div>
          </div>

          <div className="mt-4">
            {Array.isArray(room.equipments) && room.equipments.length ? (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Equipment</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {room.equipments.map((e) => {
                      const name =
                        e.display_name || equipmentNameByCode[e.code] || e.code;
                      return (
                        <tr key={e.code || name}>
                          <td className="px-3 py-2 text-slate-700">{name}</td>
                          <td className="px-3 py-2 text-right text-slate-700">
                            {e.quantity}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-slate-600">
                <span className="font-medium text-slate-700">Equipment</span>:
                -
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div className="mt-4 max-w-sm">
        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-700">
            Select date (SGT)
          </span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
          <h3 className="text-base font-semibold text-slate-900">
            Availability
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            08:00 - 18:00 (30 min slots)
          </p>

          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full table-fixed border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-40 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Time (SGT)
                  </th>
                  <th className="w-56 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {slots.map((s) => {
                  const booked = isSlotBooked(s.start, s.end);
                  const booking = booked
                    ? getSlotBooking(s.start, s.end)
                    : null;
                  const bookedBy = booking
                    ? booking.user_id === userCtx.userId
                      ? "Booked by You"
                      : `Booked by ${booking.user_name || "User"}`
                    : null;
                  return (
                    <tr key={s.start} className="text-sm">
                      <td className="px-3 py-2 text-slate-700">
                        {minutesToLabel(s.start)} - {minutesToLabel(s.end)}
                      </td>
                      <td className="px-3 py-2 text-slate-700 break-words">
                        {booked ? bookedBy || "Booked" : "Available"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
          <h3 className="text-base font-semibold text-slate-900">
            Make a Booking
          </h3>

          <div className="mt-4 grid gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-700">
                Start time (SGT)
              </span>
              <select
                value={startMinutes}
                onChange={(e) => setStartMinutes(Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {timeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-700">
                Duration (max 2 hours)
              </span>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1 hour 30 minutes</option>
                <option value={120}>2 hour</option>
              </select>
            </label>

            <button
              type="button"
              onClick={submitBooking}
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Book
            </button>

            {bookingStatus ? (
              <div
                className={
                  bookingIsError
                    ? "text-sm text-red-600"
                    : "text-sm text-emerald-700"
                }
              >
                {bookingStatus}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailsPage;
