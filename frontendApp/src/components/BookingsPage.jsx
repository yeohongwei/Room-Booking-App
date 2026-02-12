import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import UserContext from "../context/user";
import sharedFetch from "../shared/sharedFetch";
import Booking from "./Booking";

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
  const editDialogRef = useRef(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPast, setShowPast] = useState(false);

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

  useEffect(() => {
    const dialog = editDialogRef.current;
    if (!dialog) return;

    if (editing) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [editing]);

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
    editDialogRef.current?.close();
  };

  const onEditDialogClose = () => {
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

  const nowMs = Date.now();
  const upcomingBookings = bookings.filter((b) => {
    const start = Date.parse(b.start_time);
    if (!Number.isFinite(start)) return true;
    return start >= nowMs;
  });
  const pastBookings = bookings.filter((b) => {
    const start = Date.parse(b.start_time);
    if (!Number.isFinite(start)) return false;
    return start < nowMs;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            My Bookings
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Update or delete upcoming bookings.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {showPast ? "Hide Past" : "Show Past"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 text-sm text-slate-600">Loading...</div>
      ) : null}
      {errorMsg ? (
        <div className="mt-4 text-sm text-red-600">{errorMsg}</div>
      ) : null}

      {upcomingBookings.length === 0 && !loading ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600 shadow-sm backdrop-blur">
          No upcoming bookings found.
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {upcomingBookings.map((b) => (
          <Booking
            key={b.booking_id}
            booking={b}
            dateLabel={toSgDateInputValue(b.start_time)}
            startLabel={minutesToLabel(toSgTimeMinutes(b.start_time))}
            endLabel={minutesToLabel(toSgTimeMinutes(b.end_time))}
            onUpdate={() => openEdit(b)}
            onDelete={() => deleteBooking(b.booking_id)}
          />
        ))}
      </div>

      {showPast ? (
        <div className="mt-10">
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">
            Past Bookings
          </h3>

          {pastBookings.length === 0 ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600 shadow-sm backdrop-blur">
              No past bookings.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pastBookings.map((b) => (
                <Booking
                  key={b.booking_id}
                  booking={b}
                  dateLabel={toSgDateInputValue(b.start_time)}
                  startLabel={minutesToLabel(toSgTimeMinutes(b.start_time))}
                  endLabel={minutesToLabel(toSgTimeMinutes(b.end_time))}
                  onUpdate={() => openEdit(b)}
                  onDelete={() => deleteBooking(b.booking_id)}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}

      <dialog
        ref={editDialogRef}
        onClose={onEditDialogClose}
        className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {editing ? (
          <>
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">
              Update Booking
            </h3>

            <div className="mt-4 grid gap-4">
              <label className="grid gap-1">
                <span className="text-sm font-medium text-slate-700">
                  Date (SGT)
                </span>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium text-slate-700">
                  Start time (SGT)
                </span>
                <select
                  value={editStart}
                  onChange={(e) => setEditStart(Number(e.target.value))}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

              <label className="grid gap-1">
                <span className="text-sm font-medium text-slate-700">
                  Duration (max 2 hours)
                </span>
                <select
                  value={editDuration}
                  onChange={(e) => setEditDuration(Number(e.target.value))}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1 hour 30 minutes</option>
                  <option value={120}>2 hour</option>
                </select>
              </label>

              {editStatus ? (
                <div
                  className={
                    editIsError
                      ? "text-sm text-red-600"
                      : "text-sm text-emerald-700"
                  }
                >
                  {editStatus}
                </div>
              ) : null}

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={saveEdit}
                  className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={closeEdit}
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        ) : null}
      </dialog>
    </div>
  );
};

export default BookingsPage;
