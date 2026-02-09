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
    <form onSubmit={handleSubmit} style={{ border: "1px solid #ccc", padding: "20px", marginBottom: "20px" }}>
      <h3>Add Class Session</h3>
      <input
        type="text"
        name="subject"
        placeholder="Subject"
        value={form.subject}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="teacher"
        placeholder="Teacher Name"
        value={form.teacher}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="batch"
        placeholder="Batch (e.g., B1)"
        value={form.batch}
        onChange={handleChange}
        required
      />
      <select name="day_of_week" value={form.day_of_week} onChange={handleChange}>
        <option value="MON">Monday</option>
        <option value="TUE">Tuesday</option>
        <option value="WED">Wednesday</option>
        <option value="THU">Thursday</option>
        <option value="FRI">Friday</option>
        <option value="SAT">Saturday</option>
      </select>
      <input
        type="time"
        name="start_time"
        value={form.start_time}
        onChange={handleChange}
        required
      />
      <input
        type="time"
        name="end_time"
        value={form.end_time}
        onChange={handleChange}
        required
      />
      <input
        type="number"
        name="required_capacity"
        placeholder="Required capacity"
        value={form.required_capacity}
        onChange={handleChange}
      />
      <select name="required_type" value={form.required_type} onChange={handleChange}>
        <option value="ANY">Any</option>
        <option value="THEORY">Theory</option>
        <option value="LAB">Lab</option>
      </select>
      <input
        type="number"
        name="value"
        placeholder="Priority (1-10)"
        value={form.value}
        onChange={handleChange}
        min={1}
        max={10}
      />
      <button type="submit">Add Class</button>
    </form>
  );
}
