import { useState } from 'react';
import { uploadRoomsCSV, uploadClassesCSV } from '../api';

export default function FileUpload({ onUploadComplete }) {
  const [roomsFile, setRoomsFile] = useState(null);
  const [classesFile, setClassesFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleRoomsUpload = async () => {
    if (!roomsFile) {
      alert("Please select a rooms CSV file first!");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', roomsFile);

    try {
      const response = await uploadRoomsCSV(formData);
      alert(`✅ Success! ${response.created} rooms added, ${response.updated} updated, ${response.failed} failed.`);
      setRoomsFile(null);
      onUploadComplete();
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleClassesUpload = async () => {
    if (!classesFile) {
      alert("Please select a classes CSV file first!");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', classesFile);

    try {
      const response = await uploadClassesCSV(formData);
      alert(`✅ Success! ${response.created} classes added, ${response.updated} updated, ${response.failed} failed.`);
      setClassesFile(null);
      onUploadComplete();
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: "#f8f9fa",
      padding: "20px",
      borderRadius: "10px",
      marginBottom: "30px",
      border: "2px dashed #007bff"
    }}>
      <h3 style={{ marginTop: 0, color: "#333" }}>📁 Bulk Upload (CSV)</h3>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>
        Upload CSV files to add multiple rooms and classes at once
      </p>

      {/* Rooms */}
      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ fontSize: "16px", color: "#555", marginBottom: "10px" }}>🏢 Upload Rooms</h4>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setRoomsFile(e.target.files[0])}
            style={{ fontSize: "14px" }}
          />
          <button
            onClick={handleRoomsUpload}
            disabled={uploading || !roomsFile}
            style={{
              padding: "8px 16px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: uploading || !roomsFile ? "not-allowed" : "pointer",
              fontWeight: "bold"
            }}
          >
            {uploading ? "Uploading..." : "Upload Rooms"}
          </button>
        </div>
        <small style={{ color: "#666", fontSize: "12px" }}>
          Format: name,capacity,room_type
        </small>
      </div>

      {/* Classes  */}
      <div>
        <h4 style={{ fontSize: "16px", color: "#555", marginBottom: "10px" }}>📚 Upload Classes</h4>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setClassesFile(e.target.files[0])}
            style={{ fontSize: "14px" }}
          />
          <button
            onClick={handleClassesUpload}
            disabled={uploading || !classesFile}
            style={{
              padding: "8px 16px",
              backgroundColor: "#17a2b8",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: uploading || !classesFile ? "not-allowed" : "pointer",
              fontWeight: "bold"
            }}
          >
            {uploading ? "Uploading..." : "Upload Classes"}
          </button>
        </div>
        <small style={{ color: "#666", fontSize: "12px" }}>
          Format: subject,teacher,batch,day_of_week,start_time,end_time,required_capacity,required_type,value
        </small>
      </div>
    </div>
  );
}
