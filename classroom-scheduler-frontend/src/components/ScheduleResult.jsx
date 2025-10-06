import React from "react";

function ScheduleResult({ results, totalRooms }) {
  return (
    <div style={{ marginTop: "20px" }}>
      <h2>✅ Schedule Result</h2>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Class ID</th>
            <th>Assigned Room</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.room}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p><b>Total Rooms Used:</b> {totalRooms}</p>
    </div>
  );
}

export default ScheduleResult;
