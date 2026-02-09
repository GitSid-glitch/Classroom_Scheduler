export default function ScheduleView({ scheduleResult }) {
    if (!scheduleResult) {
      return <p>No schedule generated yet. Click "Run Optimized Schedule" to generate one.</p>;
    }
    const { max_value, min_rooms, schedule } = scheduleResult;
    return (
      <div style={{ border: "2px solid green", padding: "20px", marginTop: "20px" }}>
        <h3>✅ Schedule Generated!</h3>
        <p><strong>Max Value Achieved:</strong> {max_value}</p>
        <p><strong>Minimum Rooms Used:</strong> {min_rooms}</p>
  
        <h4>Assignments:</h4>
        {schedule.assignments && schedule.assignments.length > 0 ? (
          <table border="1" cellPadding="10">
            <thead>
              <tr>
                <th>Class ID</th>
                <th>Room ID</th>
              </tr>
            </thead>
            <tbody>
              {schedule.assignments.map((a) => (
                <tr key={a.id}>
                  <td>{a.class_session}</td>
                  <td>{a.room}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No assignments found.</p>
        )}
      </div>
    );
  }
  