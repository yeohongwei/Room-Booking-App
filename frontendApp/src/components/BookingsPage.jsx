import React, { useContext, useEffect, useMemo, useState } from "react";
import UserContext from "../context/user";
import sharedFetch from "../shared/sharedFetch";

const pad2 = (n) => String(n).padStart(2, "0");

const toSgDateInputValue = (utcIsoString) => {
  const date = new Date(utcIsoString);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date); // YYYY-MM-DD
};

const toSgTimeMinutes = (utcIsoString) => {
  const date = new Date(utcIsoString);
  const parts = new Intl.DateTimeFormat("en-SG", {
    timeZone: "Asia/Singapore",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(date)
    .reduce((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});
  const hours = Number(parts.hour);
  const minutes = Number(parts.minute);
  return hours * 60 + minutes;
};

const sgDateTimeToUtcIso = (dateStr, minutesFromMidnight) => {
  // Singapore is UTC+8 with no DST; convert SG local -> UTC by subtracting 8 hours
  const [y, m, d] = dateStr.split("-").map(Number);
  const hours = Math.floor(minutesFromMidnight / 60);
  const minutes = minutesFromMidnight % 60;
  const utcMs = Date.UTC(y, m - 1, d, hours - 8, minutes, 0, 0);
  return new Date(utcMs).toISOString();
};

const minutesToLabel = (mins) =>
  `${pad2(Math.floor(mins / 60))}:${pad2(mins % 60)}`;

const buildTimeOptions = () => {
  const opts = [];
  for (let m = 8 * 60; m <= 18 * 60; m += 30) {
    opts.push({ value: m, label: minutesToLabel(m) });
  }
  return opts;
};

const BookingsPage = () => {
  const userCtx = useContext(UserContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [editing, setEditing] = useState(null); // booking row
  const [editDate, setEditDate] = useState("");
  const [editStart, setEditStart] = useState(8 * 60);
  const [editDuration, setEditDuration] = useState(30);
  const [editStatus, setEditStatus] = useState("");
  const [editIsError, setEditIsError] = useState(false);

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

  const loadBookings = async () => {
    if (!userCtx.userId) return;
    setLoading(true);
    setErrorMsg("");

    const res = await fetchData(
      `/bookings/user/${userCtx.userId}`,
      "GET",
      null,
      userCtx.accessToken,
    );

    if (!res.ok) {
      setErrorMsg(res.msg || "Failed to load bookings");
      setBookings([]);
      setLoading(false);
      return;
    }

    setBookings(Array.isArray(res.data) ? res.data : []);
    setLoading(false);
  };

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCtx.userId]);

  const openEdit = (row) => {
    setEditing(row);
    setEditStatus("");
    setEditIsError(false);
    setEditDate(toSgDateInputValue(row.start_time));

    const startMins = toSgTimeMinutes(row.start_time);
    const endMins = toSgTimeMinutes(row.end_time);
    const dur = Math.min(120, Math.max(30, endMins - startMins));

    setEditStart(startMins);
    setEditDuration(dur);
  };

  const closeEdit = () => {
    setEditing(null);
    setEditStatus("");
    setEditIsError(false);
  };

  const saveEdit = async () => {
    if (!editing) return;

    const end = editStart + editDuration;
    if (end > 18 * 60) {
      setEditIsError(true);
      setEditStatus("End time must be 18:00 or earlier");
      return;
    }
    if (editDuration > 120) {
      setEditIsError(true);
      setEditStatus("Booking duration must be 2 hours or less");
      return;
    }

    const startUtc = sgDateTimeToUtcIso(editDate, editStart);
    const endUtc = sgDateTimeToUtcIso(editDate, end);

    const res = await fetchData(
      `/bookings/${editing.booking_id}`,
      "PATCH",
      { start_time: startUtc, end_time: endUtc },
      userCtx.accessToken,
    );

    if (!res.ok) {
      setEditIsError(true);
      setEditStatus(res.msg || "Update failed");
      return;
    }

    closeEdit();
    await loadBookings();
  };

  const deleteBooking = async (bookingId) => {
    const res = await fetchData(
      `/bookings/${bookingId}`,
      "DELETE",
      {},
      userCtx.accessToken,
    );

    if (!res.ok) {
      setErrorMsg(res.msg || "Delete failed");
      return;
    }

    await loadBookings();
  };

  const timeOptions = buildTimeOptions();

  return (
    <div style={{ padding: "0 16px 16px" }}>
      <h2>My Bookings</h2>

      {loading ? <div>Loading...</div> : null}
      {errorMsg ? <div>{errorMsg}</div> : null}

      {bookings.length === 0 && !loading ? <div>No bookings found.</div> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {bookings.map((b) => (
          <div key={b.booking_id} style={{ padding: 12, border: "1px solid" }}>
            <div style={{ marginBottom: 6 }}>
              <strong>{b.room_name}</strong> (Capacity {b.capacity})
            </div>
            <div style={{ marginBottom: 6 }}>Location: {b.location || "-"}</div>
            <div style={{ marginBottom: 6 }}>
              Time (SGT): {toSgDateInputValue(b.start_time)}{" "}
              {minutesToLabel(toSgTimeMinutes(b.start_time))} -{" "}
              {minutesToLabel(toSgTimeMinutes(b.end_time))}
            </div>
            <div style={{ marginBottom: 10 }}>
              Equipments:{" "}
              {Array.isArray(b.equipments) && b.equipments.length
                ? b.equipments.map((e) => `${e.code} x${e.quantity}`).join(", ")
                : "-"}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={() => openEdit(b)}>
                Update
              </button>
              <button type="button" onClick={() => deleteBooking(b.booking_id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing ? (
        <dialog open style={{ padding: 16, maxWidth: 520, width: "100%" }}>
          <h3>Update Booking</h3>

          <div style={{ display: "grid", gap: 10 }}>
            <label>
              Date (SGT)
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </label>

            <label>
              Start time (SGT)
              <select
                value={editStart}
                onChange={(e) => setEditStart(Number(e.target.value))}
              >
                {timeOptions
                  .filter((o) => o.value <= 17 * 60 + 30)
                  .map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
              </select>
            </label>

            <label>
              Duration (max 2 hours)
              <select
                value={editDuration}
                onChange={(e) => setEditDuration(Number(e.target.value))}
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1 hour 30 minutes</option>
                <option value={120}>2 hour</option>
              </select>
            </label>

            {editStatus ? (
              <div style={editIsError ? { color: "red" } : undefined}>
                {editStatus}
              </div>
            ) : null}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={saveEdit}>
                Save
              </button>
              <button type="button" onClick={closeEdit}>
                Cancel
              </button>
            </div>
          </div>
        </dialog>
      ) : null}
    </div>
  );
};

export default BookingsPage;
