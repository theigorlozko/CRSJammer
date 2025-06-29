"use client";

import React, { useState } from "react";

const PASSWORD = process.env.NEXT_PUBLIC_SITE_PASSWORD || "fallbackpassword";

const PasswordGate = ({ children }: { children: React.ReactNode }) => {
  const [entered, setEntered] = useState(false);
  const [input, setInput] = useState("");

  if (!entered) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <h1 className="mb-4 text-xl">🔒 Enter Password</h1>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="mb-4 px-3 py-2 rounded text-black bg-red-600"
        />
        <button
          onClick={() => setEntered(input === PASSWORD)}
          className="bg-blue-600 px-4 py-2 rounded"
        >
          Submit
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default PasswordGate;
