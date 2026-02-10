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
    <form onSubmit={handleSubmit} style={{ border: "1px solid #ccc", padding: "20px" }}>
      <h3>Add Room</h3>
      <input
        type="text"
        name="name"  
        placeholder="Room Number"
        value={form.name}  
        onChange={handleChange}
        required
      />
      <input
        type="number"
        name="capacity"
        placeholder="Capacity"
        value={form.capacity}
        onChange={handleChange}
        required
      />
      <select name="room_type" value={form.room_type} onChange={handleChange}>
        <option value="THEORY">Theory</option>
        <option value="LAB">Lab</option>
      </select>
      <button type="submit">Add Room</button>
    </form>
  );
}
