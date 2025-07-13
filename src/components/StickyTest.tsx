import React from 'react';

export default function StickyTest() {
  return (
    <div style={{ width: 600, overflowX: 'auto' }}>
      <table style={{ minWidth: 1000, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{
              position: 'sticky',
              left: 0,
              background: '#f0f6ff',
              zIndex: 10,
              minWidth: 120,
              border: '1px solid #ccc'
            }}>Sticky Col</th>
            <th>Col 2</th>
            <th>Col 3</th>
            <th>Col 4</th>
            <th>Col 5</th>
            <th>Col 6</th>
            <th>Col 7</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(10)].map((_, i) => (
            <tr key={i}>
              <td style={{
                position: 'sticky',
                left: 0,
                background: '#f0f6ff',
                zIndex: 5,
                minWidth: 120,
                border: '1px solid #ccc'
              }}>Sticky {i + 1}</td>
              <td>Data 2</td>
              <td>Data 3</td>
              <td>Data 4</td>
              <td>Data 5</td>
              <td>Data 6</td>
              <td>Data 7</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 