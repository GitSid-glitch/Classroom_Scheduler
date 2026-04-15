import { useState } from "react";
import { createClassSession } from "../api";

export default function ClassForm({ onCreated }) {
  const [form, setForm] = useState({
    subject: "",
    teacher: "",
    batch: "",
    day_of_week: "MON",
    start_time: "",
    end_time: "",
    required_capacity: 0,
    required_type: "ANY",
    value: 1,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createClassSession({
        ...form,
        required_capacity: parseInt(form.required_capacity),
        value: parseInt(form.value),
      });
      alert("Class created!");
      setForm({
        subject: "",
        teacher: "",
        batch: "",
        day_of_week: "MON",
        start_time: "",
        end_time: "",
        required_capacity: 0,
        required_type: "ANY",
        value: 1,
      });
      onCreated?.();
    } catch (error) {
      console.error("Error creating class:", error);
      alert("Error creating class");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel" style={{ marginBottom: "20px" }}>
      <h3 className="text-gradient" style={{ marginBottom: "20px", fontSize: "1.5rem" }}>📚 Add Class Session</h3>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <label>Subject</label>
          <input
            type="text"
            name="subject"
            placeholder="e.g. Mathematics"
            value={form.subject}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Teacher</label>
          <input
            type="text"
            name="teacher"
            placeholder="e.g. John Doe"
            value={form.teacher}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <label>Batch</label>
          <input
            type="text"
            name="batch"
            placeholder="e.g. B1"
            value={form.batch}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Day of Week</label>
          <select name="day_of_week" value={form.day_of_week} onChange={handleChange}>
            <option value="MON">Monday</option>
            <option value="TUE">Tuesday</option>
            <option value="WED">Wednesday</option>
            <option value="THU">Thursday</option>
            <option value="FRI">Friday</option>
            <option value="SAT">Saturday</option>
          </select>
        </div>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <label>Start Time</label>
          <input
            type="time"
            name="start_time"
            value={form.start_time}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>End Time</label>
          <input
            type="time"
            name="end_time"
            value={form.end_time}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <label>Required Capacity</label>
          <input
            type="number"
            name="required_capacity"
            placeholder="Capacity"
            value={form.required_capacity}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Required Type</label>
          <select name="required_type" value={form.required_type} onChange={handleChange}>
            <option value="ANY">Any</option>
            <option value="THEORY">Theory</option>
            <option value="LAB">Lab</option>
          </select>
        </div>
      </div>
      
      <div>
        <label>Priority (1-10)</label>
        <input
          type="number"
          name="value"
          placeholder="Priority"
          value={form.value}
          onChange={handleChange}
          min={1}
          max={10}
        />
      </div>
      
      <button type="submit" style={{ width: "100%", marginTop: "10px" }}>Add Class</button>
    </form>
  );
}
