"use client";

import React, { useState } from "react";
import Pilots from "./components/Pilots";
import PilotLocations from "./components/pilotLocations";
import Image from "next/image";


export default function Home() {
  return (
    <div className="h-full w-full">
      {/* Uncomment Pilots if needed */}
      {/* <Pilots /> */}
      <PilotLocations />
    </div>
  );
}