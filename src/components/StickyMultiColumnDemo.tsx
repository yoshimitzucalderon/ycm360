import React from "react";

const colWidths = [120, 120, 120, 120, 120, 120, 120];

const data = [
  ["A", "B", "C", "Dato 1", "Dato 2", "X", "Y"],
  ["D", "E", "F", "Dato 3", "Dato 4", "W", "Z"],
  ["G", "H", "I", "Dato 5", "Dato 6", "M", "N"],
];

export default function StickyMultiColumnDemo() {
  // Suma de anchos para offsets
  const left1 = 0;
  const left2 = colWidths[0];
  // Para right sticky, suma desde el final
  const right1 = 0;
  const right2 = colWidths[colWidths.length - 1];
  return (
    <div style={{
      width: 700,
      overflowX: "auto",
      border: "1px solid #e5e7eb",
      margin: "32px 0"
    }}>
      <table
        style={{
          borderCollapse: "separate",
          borderSpacing: 0,
          width: "100%",
          minWidth: 1000,
          tableLayout: "fixed"
        }}
      >
        <thead>
          <tr>
            {/* Sticky left 1 */}
            <th style={{
              position: "sticky",
              left: left1,
              background: "#f8fafc",
              zIndex: 4,
              minWidth: colWidths[0],
              boxShadow: "2px 0 4px -2px rgba(0,0,0,0.08)",
              borderRight: "none"
            }}>Sticky L1</th>
            {/* Sticky left 2 */}
            <th style={{
              position: "sticky",
              left: left2,
              background: "#f8fafc",
              zIndex: 3,
              minWidth: colWidths[1],
              boxShadow: "2px 0 4px -2px rgba(0,0,0,0.08)",
              borderRight: "none"
            }}>Sticky L2</th>
            {/* Normal */}
            <th style={{ minWidth: colWidths[2] }}>Normal 1</th>
            <th style={{ minWidth: colWidths[3] }}>Normal 2</th>
            <th style={{ minWidth: colWidths[4] }}>Normal 3</th>
            {/* Sticky right 2 */}
            <th style={{
              position: "sticky",
              right: right2,
              background: "#f0f9ff",
              zIndex: 3,
              minWidth: colWidths[5],
              boxShadow: "-2px 0 4px -2px rgba(0,0,0,0.08)",
              borderLeft: "none"
            }}>Sticky R2</th>
            {/* Sticky right 1 */}
            <th style={{
              position: "sticky",
              right: right1,
              background: "#f0f9ff",
              zIndex: 4,
              minWidth: colWidths[6],
              boxShadow: "-2px 0 4px -2px rgba(0,0,0,0.08)",
              borderLeft: "none"
            }}>Sticky R1</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {/* Sticky left 1 */}
              <td style={{
                position: "sticky",
                left: left1,
                background: "#f8fafc",
                zIndex: 4,
                minWidth: colWidths[0],
                boxShadow: "2px 0 4px -2px rgba(0,0,0,0.08)",
                borderRight: "none"
              }}>{row[0]}</td>
              {/* Sticky left 2 */}
              <td style={{
                position: "sticky",
                left: left2,
                background: "#f8fafc",
                zIndex: 3,
                minWidth: colWidths[1],
                boxShadow: "2px 0 4px -2px rgba(0,0,0,0.08)",
                borderRight: "none"
              }}>{row[1]}</td>
              {/* Normal */}
              <td style={{ minWidth: colWidths[2] }}>{row[2]}</td>
              <td style={{ minWidth: colWidths[3] }}>{row[3]}</td>
              <td style={{ minWidth: colWidths[4] }}>{row[4]}</td>
              {/* Sticky right 2 */}
              <td style={{
                position: "sticky",
                right: right2,
                background: "#f0f9ff",
                zIndex: 3,
                minWidth: colWidths[5],
                boxShadow: "-2px 0 4px -2px rgba(0,0,0,0.08)",
                borderLeft: "none"
              }}>{row[5]}</td>
              {/* Sticky right 1 */}
              <td style={{
                position: "sticky",
                right: right1,
                background: "#f0f9ff",
                zIndex: 4,
                minWidth: colWidths[6],
                boxShadow: "-2px 0 4px -2px rgba(0,0,0,0.08)",
                borderLeft: "none"
              }}>{row[6]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 