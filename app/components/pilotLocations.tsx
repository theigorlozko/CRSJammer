"use client";

import React, { useState } from "react";
import Image from "next/image";

interface Complex {
  re: number;
  im: number;
}

const bandwidthToSubcarriers = (bw: number) => {
    switch (bw) {
      case 1.4: return { subcarriers: 72, fftSize: 128 };
      case 3: return { subcarriers: 180, fftSize: 256 };
      case 5: return { subcarriers: 300, fftSize: 512 };
      case 10: return { subcarriers: 600, fftSize: 1024 };
      case 15: return { subcarriers: 900, fftSize: 1536 };
      case 20: return { subcarriers: 1200, fftSize: 2048 };
      default: return { subcarriers: 72, fftSize: 128 };
    }
  };

const PilotLocations = () => {
  const [centerFreq, setCenterFreq] = useState(2.3e9);
  const [subcarrierSpacing, setSubcarrierSpacing] = useState(15000);
  const [symbolDuration, setSymbolDuration] = useState(66.67);
  const [pci, setPci] = useState(0);
  const [antennaPort, setAntennaPort] = useState(0);
  const [bandwidth, setBandwidth] = useState(1.4);
  const { subcarriers, fftSize } = bandwidthToSubcarriers(bandwidth);
  const [results, setResults] = useState<any[]>([]);
  const [pilotMatrix, setPilotMatrix] = useState<number[][]>([]);

  const generatePilotMatrix = (
    pci: number,
    antennaPort: number,
    totalSubcarriers: number
  ): number[][] => {
    const cols = 14;
    const vShift = pci % 6;
    const matrix: number[][] = Array.from({ length: totalSubcarriers }, () =>
      Array(cols).fill(0)
    );
  
    // Define which symbols are used for each antenna port
    const symbolIndices = {
      0: [0, 4, 7, 11],
      1: [0, 4, 7, 11],
      2: [1, 8],
      3: [1, 8],
    };
  
    // Define corresponding vertical shift offsets for pilot mapping
    const symbolOffsets = {
      0: [0, 3],  // symbol 0, 4
      1: [3, 0],  // symbol 0, 4
      2: [0, 3],  // symbol 1, 8
      3: [3, 0],  // symbol 1, 8
    };
  
    const isPortWithCopy = antennaPort === 0 || antennaPort === 1;
  
    if (isPortWithCopy) {
      // For ports 0 & 1, align symbol 7 with 0, and 11 with 4
      const [offset0, offset4] = symbolOffsets[antennaPort];
  
      for (let r = 0; r < totalSubcarriers; r++) {
        if ((r % 6) === (vShift + offset0) % 6) {
          matrix[r][0] = 1; // Symbol 0
          matrix[r][7] = 1; // Symbol 7 (copy of 0)
        }
        if ((r % 6) === (vShift + offset4) % 6) {
          matrix[r][4] = 1; // Symbol 4
          matrix[r][11] = 1; // Symbol 11 (copy of 4)
        }
      }
    } else {
      // Ports 2 & 3 follow standard mapping, no copying logic needed
      const indices = symbolIndices[antennaPort as keyof typeof symbolIndices];
      const offsets = symbolOffsets[antennaPort as keyof typeof symbolOffsets];
      for (let r = 0; r < totalSubcarriers; r++) {
        for (let i = 0; i < indices.length; i++) {
          const c = indices[i];
          const offset = offsets[i];
          if ((r % 6) === (vShift + offset) % 6) {
            matrix[r][c] = 1;
          }
        }
      }
    }
  
    return matrix;
  };

  const handleGenerate = () => {
    const totalSubcarriers = bandwidthToSubcarriers(bandwidth).subcarriers;
    const matrix = generatePilotMatrix(pci, antennaPort, totalSubcarriers);
    setPilotMatrix(matrix);
    const pilots: any[] = [];

    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[0].length; col++) {
        if (matrix[row][col] === 1) {
          pilots.push({
            row,
            col,
            freq: centerFreq + (row - totalSubcarriers / 2) * subcarrierSpacing,
            time: col * symbolDuration,
            symbol: getSymbol(row, col),
          });
        }
      }
    }

    // sort by col in desired order: 0 → 4 → 7 → 11 → rest
    const colPriority = [0, 4, 7, 11];
    setResults(
      pilots.sort((a, b) => {
        const aIdx = colPriority.indexOf(a.col) === -1 ? 99 : colPriority.indexOf(a.col);
        const bIdx = colPriority.indexOf(b.col) === -1 ? 99 : colPriority.indexOf(b.col);
        return aIdx - bIdx || a.row - b.row;
      })
    );
  };

  const getSymbol = (row: number, col: number): Complex => {
    const val = (row + col) % 4;
    switch (val) {
      case 0:
        return { re: 1 / Math.SQRT2, im: 1 / Math.SQRT2 };
      case 1:
        return { re: -1 / Math.SQRT2, im: 1 / Math.SQRT2 };
      case 2:
        return { re: -1 / Math.SQRT2, im: -1 / Math.SQRT2 };
      default:
        return { re: 1 / Math.SQRT2, im: -1 / Math.SQRT2 };
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">LTE Pilot Signal Mapper</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <label className="flex flex-col">
          <span className="text-sm font-medium">Center Frequency (Hz)</span>
          <input
            type="number"
            value={centerFreq}
            onChange={(e) => setCenterFreq(parseFloat(e.target.value))}
            className="border rounded px-3 py-2"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm font-medium">Subcarrier Spacing (Hz)</span>
          <input
            type="number"
            value={subcarrierSpacing}
            onChange={(e) => setSubcarrierSpacing(parseFloat(e.target.value))}
            className="border rounded px-3 py-2"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm font-medium">Symbol Duration (µs)</span>
          <input
            type="number"
            value={symbolDuration}
            onChange={(e) => setSymbolDuration(parseFloat(e.target.value))}
            className="border rounded px-3 py-2"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm font-medium">Physical Cell ID (PCI)</span>
          <input
            type="number"
            value={pci}
            onChange={(e) => setPci(parseInt(e.target.value))}
            className="border rounded px-3 py-2"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm font-medium">Antenna Port (0–3)</span>
          <input
            type="number"
            value={antennaPort}
            onChange={(e) => setAntennaPort(parseInt(e.target.value))}
            min={0}
            max={3}
            className="border rounded px-3 py-2"
          />
        </label>
        <label className="flex flex-col">
        <span className="text-sm font-medium text-white mb-1">Bandwidth (MHz)</span>
        <select
            value={bandwidth}
            onChange={(e) => setBandwidth(parseFloat(e.target.value))}
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white text-black dark:bg-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
            {[1.4, 3, 5, 10, 15, 20].map((bw) => (
            <option key={bw} value={bw}>
                {bw}
            </option>
            ))}
        </select>
        </label>
      </div>
    
      <button
        onClick={handleGenerate}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded mb-6"
      >
        Generate Table
      </button>
      <Image
        src="/pilots.jpeg" // Correct path to the image in the public folder
        alt="Pilot Map"
        width={600}
        height={600}
        className="mx-auto my-4"
      />
    {results.length > 0 && pilotMatrix.length > 0 && (
      <div className="flex flex-col lg:flex-row gap-8 mt-10">
        {/* Pilot Table */}
        <div className="w-full lg:w-1/2">
          <h2 className="text-xl font-semibold mb-2">📋 Pilot Table</h2>
          <table className="w-full border text-sm table-fixed">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="border px-3 py-2 text-left">Row (Subcarrier)</th>
                <th className="border px-3 py-2 text-left">Col (Symbol)</th>
                <th className="border px-3 py-2 text-left">Freq (Hz)</th>
                <th className="border px-3 py-2 text-left">Time (µs)</th>
                <th className="border px-3 py-2 text-left">Symbol</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-3 py-2">{r.row}</td>
                  <td className="px-3 py-2">{r.col}</td>
                  <td className="px-3 py-2">{r.freq.toFixed(2)}</td>
                  <td className="px-3 py-2">{r.time.toFixed(2)}</td>
                  <td className="px-3 py-2">
                    {r.symbol.re.toFixed(2)} + {r.symbol.im.toFixed(2)}j
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pilot Grid View */}
        <div className="w-full lg:w-1/2">
          <h2 className="text-xl font-semibold mb-2">🧭 Pilot Grid View</h2>
          <div className="overflow-x-auto border rounded p-4 bg-white text-black">
            <table className="text-xs table-auto border-collapse">
              <thead>
                <tr>
                  <th className="border px-1 py-1">SubC ↓ / Sym →</th>
                  {Array.from({ length: pilotMatrix[0].length }, (_, i) => (
                    <th key={i} className="border px-1 py-1 text-center">{i}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pilotMatrix.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="border px-1 py-1 font-medium">{rowIndex}</td>
                    {row.map((val, colIndex) => (
                      <td
                        key={colIndex}
                        className={`border px-2 py-1 text-center ${
                          val === 1
                            ? 'bg-red-500 text-white font-bold'
                            : 'bg-gray-100'
                        }`}
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}
      
        <div className="mt-8 p-6 border rounded bg-gray-800 text-white space-y-4">
            <h2 className="text-xl font-semibold mb-2">📡 Recommended Jamming Strategy</h2>

            <p><b>🎯 Target:</b> LTE Downlink Reference Signals (Pilot Symbols)</p>

            <p>
                <b>🕒 Symbol Timing:</b> Each OFDM symbol lasts <b>{symbolDuration.toFixed(2)} µs</b>.
                The targeted pilot symbols for antenna port {antennaPort} (based on PCI {pci}) occur at:
            </p>

            <ul className="list-disc pl-5">
                {[...new Set(results.map(r => r.col))].sort((a, b) => a - b).map(col => {
                const start = col * symbolDuration;
                const end = start + symbolDuration;
                return (
                    <li key={col}>
                    Symbol {col}: Start = {start.toFixed(2)} µs, End = {end.toFixed(2)} µs
                    </li>
                );
                })}
            </ul>

            <p>
                <b>📡 Frequency Range:</b> Centered at <b>{(centerFreq / 1e6).toFixed(3)} MHz</b>, span ±
                <b>{(subcarriers * subcarrierSpacing / 2 / 1e6).toFixed(3)} MHz</b>. (i.e., full occupied bandwidth: 
                <b> {(subcarriers * subcarrierSpacing).toLocaleString()} Hz</b>)
            </p>

            <p>
                <b>📶 Subcarrier Bandwidth:</b> <b>{subcarrierSpacing.toFixed(0)} Hz</b> per tone
            </p>

            <p>
                <b>🔊 Recommended Waveform:</b> {
                antennaPort <= 1
                    ? "Single-tone jamming or Gaussian white noise"
                    : "Pseudo-random BPSK bursts or Zadoff-Chu sequences"
                }
            </p>

            <p>
                <b>💥 Jamming Pulse Duration:</b> Short bursts of <b>{symbolDuration.toFixed(2)} µs</b>, precisely timed to the start of each pilot symbol.
            </p>

            <p>
                <b>📈 Amplitude :</b> +5 to +10 dB over expected LTE signal strength.
            </p>
            </div>
    </div>
  );
};

export default PilotLocations;
