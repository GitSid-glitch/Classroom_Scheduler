import { useState } from "react";
import RoomForm from "./components/RoomForm";
import ClassForm from "./components/ClassForm";
import ScheduleView from "./components/ScheduleView";
import { runOptimizedSchedule } from "./api";

function App() {
  const [scheduleResult, setScheduleResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRunOptimized = async () => {
    setLoading(true);
    try {
      const res = await runOptimizedSchedule({});
      setScheduleResult(res.data);
    } catch (error) {
      console.error("Error running schedule:", error);
      alert("Error running schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "Arial", margin: "20px" }}>
      <h1>🎓 Classroom Scheduler (DP + Heap)</h1>
      <p>Create rooms, add class sessions, and run the optimized scheduler!</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <RoomForm />
        <ClassForm />
      </div>

      <button
        onClick={handleRunOptimized}
        disabled={loading}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        {loading ? "Running..." : "Run Optimized Schedule (DP + Heap)"}
      </button>

      <ScheduleView scheduleResult={scheduleResult} />
    </div>
  );
}

export default App;
