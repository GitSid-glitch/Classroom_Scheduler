import React, { useState } from "react";
import axios from "axios";
import ClassInputForm from "./components/ClassInputForm";
import ScheduleResult from "./components/ScheduleResult";

function App() {
  const [results, setResults] = useState(null);
  const [totalRooms, setTotalRooms] = useState(null);

  const handleSubmit = async (classes) => {
    try {
      const res = await axios.post("http://127.0.0.1:5000/schedule", { classes });
      setResults(res.data.results);
      setTotalRooms(res.data.total_rooms);
    } catch (error) {
      console.error("Backend error:", error);
      alert("Error connecting to backend: " + error.message);
    }    
  };

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>📅 Smart Classroom Scheduler</h1>
      <ClassInputForm onSubmit={handleSubmit} />
      {results && <ScheduleResult results={results} totalRooms={totalRooms} />}
    </div>
  );
}

export default App;
