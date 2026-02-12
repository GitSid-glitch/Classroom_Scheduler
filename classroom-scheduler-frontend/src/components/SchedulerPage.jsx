import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RoomForm from "./RoomForm";
import ClassForm from "./ClassForm";
import ScheduleView from "./ScheduleView";
import RoomTable from "./RoomTable";
import ClassTable from "./ClassTable";
import { runSchedule, getRooms, getClasses } from "../api";

export default function SchedulerPage() {
  const navigate = useNavigate();
  const [scheduleResult, setScheduleResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [roomsData, classesData] = await Promise.all([
        getRooms(),
        getClasses()
      ]);
      setRooms(roomsData);
      setClasses(classesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleRunOptimized = async () => {
    setLoading(true);
    try {
      const res = await runSchedule();
      setScheduleResult(res);
    } catch (error) {
      console.error("Error running schedule:", error);
      alert("Error running schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "Arial", margin: "20px" }}>
      <button
        onClick={() => navigate('/')}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#6c757d",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          marginBottom: "20px",
          fontWeight: "bold"
        }}
      >
        ← Back to Home
      </button>

      <h1>🎓 Classroom Scheduler (DP + Heap)</h1>
      <p>Create rooms, add class sessions, and run the optimized scheduler!</p>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
        <RoomForm onCreated={fetchData} existingRooms={rooms} />
        <ClassForm onCreated={fetchData} existingClasses={classes} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
        <RoomTable rooms={rooms} />
        <ClassTable classes={classes} />
      </div>

      <button
        onClick={handleRunOptimized}
        disabled={loading}
        style={{
          padding: "15px 30px",
          fontSize: "18px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: "20px",
          borderRadius: "5px",
          fontWeight: "bold"
        }}
      >
        {loading ? "Running..." : "Run Optimized Schedule (DP + Heap)"}
      </button>
      
      <ScheduleView scheduleResult={scheduleResult} />
    </div>
  );
}
