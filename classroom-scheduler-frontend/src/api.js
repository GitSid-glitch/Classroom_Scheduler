import axios from "axios";
const API_BASE = "http://127.0.0.1:8000/api";
export const createRoom = (data) =>
  axios.post(`${API_BASE}/rooms/`, data);

export const listRooms = () =>
  axios.get(`${API_BASE}/rooms/`);

export const createClassSession = (data) =>
  axios.post(`${API_BASE}/classes/`, data);

export const listClassSessions = () =>
  axios.get(`${API_BASE}/classes/`);

export const runOptimizedSchedule = (filters = {}) =>
  axios.post(`${API_BASE}/schedules/run_optimized/`, filters);

export const listSchedules = () =>
  axios.get(`${API_BASE}/schedules/`);
