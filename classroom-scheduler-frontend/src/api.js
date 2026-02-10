const API_BASE = "http://localhost:8000/api";

export async function createRoom(data) {
  const res = await fetch(`${API_BASE}/rooms/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to create room");
  }
  return res.json();
}

export async function getRooms() {
  const res = await fetch(`${API_BASE}/rooms/`);
  if (!res.ok) throw new Error("Failed to fetch rooms");
  return res.json();
}

export async function createClassSession(data) {
  const res = await fetch(`${API_BASE}/classes/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to create class");
  }
  return res.json();
}

export async function getClasses() {
  const res = await fetch(`${API_BASE}/classes/`);
  if (!res.ok) throw new Error("Failed to fetch classes");
  return res.json();
}

export async function runSchedule(teacher = null, batch = null) {
  const body = {};
  if (teacher) body.teacher = teacher;
  if (batch) body.batch = batch;
  
  const res = await fetch(`${API_BASE}/schedules/run_optimized/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to run schedule");
  return res.json();
}
