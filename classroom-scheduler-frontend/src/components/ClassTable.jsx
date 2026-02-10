export default function ClassTable({ classes }) {
    if (!classes || classes.length === 0) {
      return (
        <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
          No classes added yet. Add a class session to get started.
        </div>
      );
    }
  
    return (
      <div style={{ padding: "20px" }}>
        <h3 style={{ marginBottom: "15px", color: "#333" }}>Added Class Sessions</h3>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          backgroundColor: "#fff"
        }}>
          <thead>
            <tr style={{ backgroundColor: "#2196F3", color: "white" }}>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Subject</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Teacher</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Batch</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Day</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Time</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Capacity</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Priority</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((cls, index) => (
              <tr key={cls.id || index} style={{
                backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#fff",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f0f0"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#f9f9f9" : "#fff"}
              >
                <td style={{ padding: "12px", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>{cls.subject}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>{cls.teacher}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>{cls.batch}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>{cls.day_of_week}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>
                  {cls.start_time} - {cls.end_time}
                </td>
                <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>{cls.required_capacity}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    backgroundColor: cls.value >= 7 ? "#ffebee" : "#e8f5e9",
                    color: cls.value >= 7 ? "#c62828" : "#2e7d32",
                    fontSize: "12px",
                    fontWeight: "bold"
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
  