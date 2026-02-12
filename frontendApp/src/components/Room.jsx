import React from "react";
import EquipmentShort from "./EquipmentShort";

const Room = ({
  room,
  equipmentNameByCode,
  actions,
  className = "",
  compact = false,
}) => {
  if (!room) return null;

  const equipments = Array.isArray(room.equipments) ? room.equipments : [];

  return (
    <div
      className={
        "flex h-full flex-col rounded-xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur " +
        (compact ? "p-4" : "p-4") +
        (className ? ` ${className}` : "")
      }
    >
      <div className="flex-1">
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
          {equipments.length ? (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Equipment</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {equipments.map((e) => {
                    const name =
                      e.display_name ||
                      (equipmentNameByCode
                        ? equipmentNameByCode[e.code]
                        : null) ||
                      e.code;
                    return (
                      <EquipmentShort
                        key={String(e.code || name)}
                        name={name}
                        quantity={e.quantity}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-slate-600">
              <span className="font-medium text-slate-700">Equipment</span>: -
            </div>
          )}
        </div>
      </div>

      {actions ? <div className="mt-auto pt-4">{actions}</div> : null}
    </div>
  );
};

export default Room;
