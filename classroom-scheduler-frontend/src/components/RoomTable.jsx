export default function RoomTable({ rooms }) {
    if (!rooms || rooms.length === 0) {
      return (
        <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
          No rooms added yet. Add a room to get started.
        </div>
      );
    }
    
    return (
      <div style={{ padding: "20px" }}>
        <h3 style={{ marginBottom: "15px", color: "#333" }}>Added Rooms</h3>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          backgroundColor: "#fff"
        }}>
          <thead>
            <tr style={{ backgroundColor: "#4CAF50", color: "white" }}>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Room Number</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Capacity</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Type</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room, index) => (
              <tr key={room.id || index} style={{
                backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#fff",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f0f0"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#f9f9f9" : "#fff"}
              >
                <td style={{ padding: "12px", borderBottom: "1px solid #ddd", color: "#333" }}>{room.name}</td> 
                <td style={{ padding: "12px", borderBottom: "1px solid #ddd", color: "#333" }}>{room.capacity}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    backgroundColor: room.room_type === "LAB" ? "#e3f2fd" : "#fff3e0",
                    color: room.room_type === "LAB" ? "#1976d2" : "#f57c00",
                    fontSize: "12px",
                    fontWeight: "bold"
                  }}>
                    {room.room_type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  