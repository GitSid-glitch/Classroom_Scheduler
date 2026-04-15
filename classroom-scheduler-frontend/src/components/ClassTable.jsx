export default function ClassTable({ classes }) {
  if (!classes || classes.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", gridColumn: "1 / -1" }}>
        No classes added yet. Add a class session to get started.
      </div>
    );
  }
  
  return (
    <div className="glass-panel" style={{ overflowX: "auto" }}>
      <h3 className="text-gradient" style={{ marginBottom: "20px", fontSize: "1.3rem" }}>📚 Added Class Sessions</h3>
      <table>
        <thead>
          <tr>
            <th>Subject</th>
            <th>Teacher</th>
            <th>Batch</th>
            <th>Day</th>
            <th>Time</th>
            <th>Cap</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((cls, index) => (
            <tr key={cls.id || index}>
              <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{cls.subject}</td>
              <td>{cls.teacher}</td>
              <td>{cls.batch}</td>
              <td>{cls.day_of_week}</td>
              <td>{cls.start_time} - {cls.end_time}</td>
              <td>{cls.required_capacity}</td>
              <td>
                <span style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  backgroundColor: cls.value >= 7 ? "rgba(239, 68, 68, 0.2)" : (cls.value >= 4 ? "rgba(234, 179, 8, 0.2)" : "rgba(34, 197, 94, 0.2)"),
                  color: cls.value >= 7 ? "#f87171" : (cls.value >= 4 ? "#facc15" : "#4ade80"),
                  fontSize: "12px",
                  fontWeight: "bold",
                  border: `1px solid ${cls.value >= 7 ? "#ef4444" : (cls.value >= 4 ? "#eab308" : "#22c55e")}`
                }}>
                  {cls.value}/10
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}