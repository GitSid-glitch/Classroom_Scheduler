import { useState } from "react";
import { createRoom } from "../api";

export default function RoomForm({ onCreated, existingRooms }) {
  const [form, setForm] = useState({
    name: "",  
    capacity: "",
    room_type: "THEORY",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isDuplicate = existingRooms?.some(
      room => room.name === form.name  
    );
    
    if (isDuplicate) {
      alert(`Error: Room ${form.name} already exists! Please use a different room name.`);
      return;
    }

    try {
      await createRoom({
        ...form,
        capacity: parseInt(form.capacity),
      });
      setForm({
        name: "",  
        capacity: "",
        room_type: "THEORY",
      });
      onCreated?.();
    } catch (error) {
      console.error("Error creating room:", error);
      alert(error.message || "Error creating room");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel" style={{ marginBottom: "20px" }}>
      <h3 className="text-gradient" style={{ marginBottom: "20px", fontSize: "1.5rem" }}>🏢 Add Room</h3>
      
      <label>Room Number</label>
      <input
        type="text"
        name="name"  
        placeholder="e.g. 101"
        value={form.name}  
        onChange={handleChange}
        required
      />
      
      <label>Capacity</label>
      <input
        type="number"
        name="capacity"
        placeholder="e.g. 50"
        value={form.capacity}
        onChange={handleChange}
        required
      />
      
      <label>Room Type</label>
      <select name="room_type" value={form.room_type} onChange={handleChange}>
        <option value="THEORY">Theory</option>
        <option value="LAB">Lab</option>
      </select>
      
      <button type="submit" style={{ width: "100%", marginTop: "10px" }}>Add Room</button>
    </form>
  );
}
