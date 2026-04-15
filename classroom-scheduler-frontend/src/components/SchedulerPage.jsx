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
    <div className="app-container">
      <div className="page-container">
        
        <div className="glass-panel" style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "30px",
          padding: "30px"
        }}>
          <div>
            <h1 className="text-gradient" style={{ fontSize: "2.5rem", marginBottom: "5px" }}>
              Scheduler Dashboard
            </h1>
            <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "1.1rem" }}>
              Manage resources and execute the Dynamic Programming + Heap Algorithm
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            style={{ 
              backgroundColor: "rgba(255,255,255,0.05)", 
              border: "1px solid var(--glass-border)",
              boxShadow: "none",
              padding: "12px 24px"
            }}
          >
            ← Back to Home
          </button>
        </div>

        <FileUpload onUploadComplete={fetchData} />

        <div style={{ position: "relative", margin: "40px 0" }}>
          <div style={{ borderTop: "1px solid var(--glass-border)", width: "100%" }}></div>
          <span style={{
            position: "absolute",
            top: "-12px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#161b36", 
            padding: "0 20px",
            color: "var(--text-muted)",
            fontWeight: "600",
            fontSize: "14px",
            letterSpacing: "1px",
            borderRadius: "50px",
            border: "1px solid var(--glass-border)"
          }}>
            OR ADD MANUALLY
          </span>
        </div>

        <div className="grid-2" style={{ marginBottom: "30px" }}>
          <RoomForm onCreated={fetchData} existingRooms={rooms} />
          <ClassForm onCreated={fetchData} existingClasses={classes} />
        </div>

        <div className="grid-2" style={{ marginBottom: "40px" }}>
          <RoomTable rooms={rooms} />
          <ClassTable classes={classes} />
        </div>

        <div style={{ textAlign: "center", margin: "50px 0 30px" }}>
          <button
            onClick={handleRunOptimized}
            disabled={loading}
            className="btn-gradient"
            style={{
              padding: "18px 50px",
              fontSize: "1.2rem",
              borderRadius: "50px",
              boxShadow: "0 0 30px rgba(99, 102, 241, 0.4)",
              letterSpacing: "0.5px"
            }}
          >
            {loading ? "🔄 Running DP + Heap Algorithm..." : "🚀 Generate Optimized Schedule"}
          </button>
        </div>
        
        <ScheduleView scheduleResult={scheduleResult} classes={classes} />
        
      </div>
    </div>
  );
}
