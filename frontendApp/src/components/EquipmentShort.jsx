import React from "react";

const EquipmentShort = ({ name, quantity }) => {
  return (
    <tr>
      <td className="px-3 py-2 text-slate-700">{name}</td>
      <td className="px-3 py-2 text-right text-slate-700">{quantity}</td>
    </tr>
  );
};

export default EquipmentShort;
