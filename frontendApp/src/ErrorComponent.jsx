import React from "react";

const ErrorComponent = (props) => {
  console.error("Error Encountered", props.error);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="max-w-2xl rounded-2xl border border-red-200 bg-white/80 p-6 shadow-sm backdrop-blur">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-slate-700">
          Error message: {props.error.message}
        </p>
      </div>
    </div>
  );
};

export default ErrorComponent;
