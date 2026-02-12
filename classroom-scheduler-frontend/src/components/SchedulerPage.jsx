import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RoomForm from "./RoomForm";
import ClassForm from "./ClassForm";
import ScheduleView from "./ScheduleView";
import RoomTable from "./RoomTable";
import ClassTable from "./ClassTable";
import FileUpload from "./FileUpload";
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
\      <button
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
          fontWeight: "bold",
          transition: "background-color 0.3s"
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = "#5a6268"}
        onMouseLeave={(e) => e.target.style.backgroundColor = "#6c757d"}
      >
        ← Back to Home
      </button>

      <h1>🎓 Classroom Scheduler (DP + Heap)</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>
        Create rooms, add class sessions, and run the optimized scheduler!
      </p>

      <FileUpload onUploadComplete={fetchData} />

      <div style={{
        borderTop: "2px solid #dee2e6",
        margin: "30px 0",
        position: "relative"
      }}>
        <span style={{
          position: "absolute",
          top: "-12px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "white",
          padding: "0 15px",
          color: "#6c757d",
          fontWeight: "bold",
          fontSize: "14px"
        }}>
          OR ADD MANUALLY
        </span>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr", 
        gap: "20px", 
        marginBottom: "30px" 
      }}>
        <RoomForm onCreated={fetchData} existingRooms={rooms} />
        <ClassForm onCreated={fetchData} existingClasses={classes} />
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr", 
        gap: "20px", 
        marginBottom: "30px" 
      }}>
        <RoomTable rooms={rooms} />
        <ClassTable classes={classes} />
      </div>

      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button
          onClick={handleRunOptimized}
          disabled={loading}
          style={{
            padding: "15px 40px",
            fontSize: "18px",
            backgroundColor: loading ? "#6c757d" : "#007bff",
            color: "white",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            borderRadius: "8px",
            fontWeight: "bold",
            boxShadow: "0 4px 6px rgba(0,123,255,0.3)",
            transition: "all 0.3s ease",
            transform: loading ? "scale(1)" : "scale(1)"
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = "#0056b3";
              e.target.style.transform = "scale(1.05)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = "#007bff";
              e.target.style.transform = "scale(1)";
            }
          }}
        >
          {loading ? "🔄 Running..." : "🚀 Run Optimized Schedule (DP + Heap)"}
        </button>
      </div>
      
      <ScheduleView scheduleResult={scheduleResult} />
    </div>
  );
}
