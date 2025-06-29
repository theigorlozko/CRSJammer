"use client";

import React, { useState } from "react";
import Pilots from "./components/Pilots";
import PilotLocations from "./components/pilotLocations";
import Image from "next/image";
import PasswordGate from "./components/PasswordGate";


export default function Home() {
  return (
    <div className="h-full w-full">
      <PasswordGate>
      <PilotLocations />
    </PasswordGate>
    </div>
  );
}