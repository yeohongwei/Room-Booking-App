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

  if (loading) return <div style={{ padding: "0 16px" }}>Loading...</div>;

  return (
    <div style={{ padding: "0 16px 16px" }}>
      <h2>Room Details</h2>

      {errorMsg ? <div>{errorMsg}</div> : null}

      {room ? (
        <div style={{ padding: 12, border: "1px solid", marginBottom: 12 }}>
          <div style={{ marginBottom: 6 }}>
            <strong>{room.name}</strong>
          </div>
          <div style={{ marginBottom: 6 }}>Capacity: {room.capacity}</div>
          <div style={{ marginBottom: 6 }}>
            Location: {room.location || "-"}
          </div>
          <div>
            Equipments:{" "}
            {Array.isArray(room.equipments) && room.equipments.length
              ? room.equipments
                  .map((e) => `${e.code} x${e.quantity}`)
                  .join(", ")
              : "-"}
          </div>
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 8, maxWidth: 420, marginBottom: 12 }}>
        <label>
          Select date (SGT)
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </label>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ flex: "0 0 50%" }}>
          <h3>Availability (08:00 - 18:00, 30 min)</h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              tableLayout: "fixed",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid",
                    padding: 8,
                    width: 160,
                  }}
                >
                  Time (SGT)
                </th>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid",
                    padding: 8,
                    width: 220,
                  }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {slots.map((s) => {
                const booked = isSlotBooked(s.start, s.end);
                const booking = booked ? getSlotBooking(s.start, s.end) : null;
                const bookedBy = booking
                  ? booking.user_id === userCtx.userId
                    ? "Booked by You"
                    : `Booked by ${booking.user_name || "User"}`
                  : null;
                return (
                  <tr key={s.start}>
                    <td style={{ borderBottom: "1px solid", padding: 8 }}>
                      {minutesToLabel(s.start)} - {minutesToLabel(s.end)}
                    </td>
                    <td
                      style={{
                        borderBottom: "1px solid",
                        padding: 8,
                        wordBreak: "break-word",
                      }}
                    >
                      {booked ? bookedBy || "Booked" : "Available"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ flex: "1", padding: 12, border: "1px solid" }}>
          <h3>Make a Booking</h3>

          <div style={{ display: "grid", gap: 10 }}>
            <label>
              Start time (SGT)
              <select
                value={startMinutes}
                onChange={(e) => setStartMinutes(Number(e.target.value))}
              >
                {timeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Duration (max 2 hours)
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1 hour 30 minutes</option>
                <option value={120}>2 hour</option>
              </select>
            </label>

            <button type="button" onClick={submitBooking}>
              Book
            </button>

            {bookingStatus ? (
              <div style={bookingIsError ? { color: "red" } : undefined}>
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
