import React from "react";

const Booking = ({
  booking,
  dateLabel,
  startLabel,
  endLabel,
  onUpdate,
  onDelete,
}) => {
  if (!booking) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="text-sm text-slate-700">
        <span className="font-medium">Date:</span> {dateLabel}
      </div>
      <div className="mt-2 text-sm text-slate-700">
        <span className="font-medium">Time:</span> {startLabel} – {endLabel}
      </div>
      <div className="mt-2 text-sm text-slate-700">
        <span className="font-medium">Venue:</span>{" "}
        <span className="font-semibold text-slate-900">
          {booking.room_name}
        </span>
      </div>
      <div className="mt-2 text-sm text-slate-700">
        <span className="font-medium">Location:</span> {booking.location || "-"}
      </div>
      <div className="mt-1 text-sm text-slate-700">
        <span className="font-medium">Capacity:</span> {booking.capacity}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onUpdate}
          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Update
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default Booking;
