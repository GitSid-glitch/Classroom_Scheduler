export default function RoomTable({ rooms }) {
  if (!rooms || rooms.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", gridColumn: "1 / -1" }}>
        No rooms added yet. Add a room to get started.
      </div>
    );
  }
  
  return (
    <div className="glass-panel" style={{ overflowX: "auto" }}>
      <h3 className="text-gradient" style={{ marginBottom: "20px", fontSize: "1.3rem" }}>🏢 Added Rooms</h3>
      <table>
        <thead>
          <tr>
            <th>Room Number</th>
            <th>Capacity</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room, index) => (
            <tr key={room.id || index}>
              <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{room.name}</td> 
              <td>{room.capacity}</td>
              <td>
                <span style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  backgroundColor: room.room_type === "LAB" ? "rgba(99, 102, 241, 0.2)" : "rgba(236, 72, 153, 0.2)",
                  color: room.room_type === "LAB" ? "#818cf8" : "#f472b6",
                  fontSize: "12px",
                  fontWeight: "bold",
                  border: `1px solid ${room.room_type === "LAB" ? "#6366f1" : "#ec4899"}`
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