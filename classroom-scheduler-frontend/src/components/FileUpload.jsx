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
    <div className="glass-panel" style={{
      border: "2px dashed var(--primary-color)",
      marginBottom: "30px",
      textAlign: "left"
    }}>
      <h3 className="text-gradient" style={{ marginTop: 0, fontSize: "1.5rem", marginBottom: "10px" }}>📁 Bulk Upload (CSV)</h3>
      <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "25px" }}>
        Upload CSV files to add multiple rooms and classes at once
      </p>

      <div className="grid-2">
        {/* Rooms */}
        <div style={{ background: "rgba(255,255,255,0.02)", padding: "20px", borderRadius: "12px" }}>
          <h4 style={{ fontSize: "16px", color: "var(--text-primary)", marginBottom: "15px" }}>🏢 Upload Rooms</h4>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setRoomsFile(e.target.files[0])}
              style={{ fontSize: "14px", padding: "8px", margin: 0, background: "rgba(15,23,42,0.4)" }}
            />
            <button
              onClick={handleRoomsUpload}
              disabled={uploading || !roomsFile}
              style={{ padding: "10px 16px", whiteSpace: "nowrap" }}
            >
              {uploading ? "..." : "Upload"}
            </button>
          </div>
          <small style={{ color: "var(--text-muted)", fontSize: "12px" }}>
            Format: name,capacity,room_type
          </small>
        </div>

        {/* Classes  */}
        <div style={{ background: "rgba(255,255,255,0.02)", padding: "20px", borderRadius: "12px" }}>
          <h4 style={{ fontSize: "16px", color: "var(--text-primary)", marginBottom: "15px" }}>📚 Upload Classes</h4>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setClassesFile(e.target.files[0])}
              style={{ fontSize: "14px", padding: "8px", margin: 0, background: "rgba(15,23,42,0.4)" }}
            />
            <button
              onClick={handleClassesUpload}
              disabled={uploading || !classesFile}
              className="btn-gradient"
              style={{ padding: "10px 16px", whiteSpace: "nowrap" }}
            >
              {uploading ? "..." : "Upload"}
            </button>
          </div>
          <small style={{ color: "var(--text-muted)", fontSize: "12px" }}>
            Format: subject,teacher,batch,day_of_week...
          </small>
        </div>
      </div>
    </div>
  );
}
