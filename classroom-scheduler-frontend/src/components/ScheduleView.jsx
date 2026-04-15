const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function ScheduleView({ scheduleResult, classes }) {
  if (!scheduleResult) return null;

  const { max_value, min_rooms, assignments } = scheduleResult;

  const grid = {};

  assignments.forEach((a) => {
    const cls = classes.find((c) => c.id === a.class_session);
    if (!cls) return;

    const key = `${cls.day_of_week}_${cls.start_time}`;

    grid[key] = {
      subject: cls.subject,
      room: a.room,
      teacher: cls.teacher,
    };
  });

  const TIMES = [
    ...new Set(classes.map((c) => c.start_time))
  ].sort();

  return (
    <div className="glass-panel" style={{ marginTop: "30px" }}>
      
      {/* Header */}
      <h3 style={{ fontSize: "1.8rem", marginBottom: "20px", color: "#4ade80" }}>
        📅 Timetable
      </h3>

      {/* Stats */}
      <div className="grid-2" style={{ marginBottom: "20px" }}>
        <div>
          <b>Max Value:</b> {max_value}
        </div>
        <div>
          <b>Rooms Used:</b> {min_rooms}
        </div>
      </div>

      {/* Grid */}
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              {DAYS.map((day) => (
                <th key={day}>{day}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {TIMES.map((time) => (
              <tr key={time}>
                <td>{time}</td>

                {DAYS.map((day) => {
                  const key = `${day}_${time}`;
                  const cell = grid[key];

                  return (
                    <td key={day}>
                      {cell ? (
                        <div style={{
                          background: "#1e293b",
                          padding: "10px",
                          borderRadius: "8px",
                          border: "1px solid #6366f1"
                        }}>
                          <div style={{ fontWeight: "bold" }}>
                            {cell.subject}
                          </div>
                          <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                            {cell.teacher}
                          </div>
                          <div style={{ fontSize: "12px", color: "#a5b4fc" }}>
                            Room {cell.room}
                          </div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}