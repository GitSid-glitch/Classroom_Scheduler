import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/scheduler');
  };

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      boxSizing: "border-box"
    }}>
      <div style={{
        maxWidth: "900px",
        width: "100%",
        backgroundColor: "white",
        borderRadius: "20px",
        padding: "50px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        boxSizing: "border-box"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ 
            fontSize: "48px", 
            margin: "0 0 10px 0",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: "bold"
          }}>
            🎓 Classroom Scheduler
          </h1>
          <p style={{ 
            fontSize: "20px", 
            color: "#666",
            margin: "0"
          }}>
            Intelligent Scheduling with Dynamic Programming + Heap Algorithms
          </p>
        </div>

        {/* Description */}
        <section style={{ marginBottom: "35px" }}>
          <h2 style={{ 
            fontSize: "28px", 
            color: "#333", 
            marginBottom: "15px",
            borderBottom: "3px solid #667eea",
            paddingBottom: "10px"
          }}>
            📚 What Does This App Do?
          </h2>
          <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#555" }}>
            This application helps you create an <strong>optimal class schedule</strong> by:
          </p>
          <ul style={{ fontSize: "16px", lineHeight: "2", color: "#555", marginLeft: "20px" }}>
            <li>📌 <strong>Maximizing Priority:</strong> Schedules the most important classes first</li>
            <li>⏰ <strong>Avoiding Conflicts:</strong> Ensures no time overlaps between classes</li>
            <li>🏢 <strong>Minimizing Rooms:</strong> Uses the fewest rooms possible to save resources</li>
            <li>🧮 <strong>Smart Algorithms:</strong> Uses Dynamic Programming (DP) for optimal selection and Heap for room assignment</li>
          </ul>
        </section>

        {/* Understanding */}
        <section style={{ marginBottom: "35px" }}>
          <h2 style={{ 
            fontSize: "28px", 
            color: "#333", 
            marginBottom: "15px",
            borderBottom: "3px solid #764ba2",
            paddingBottom: "10px"
          }}>
            🎯 What is Priority Value?
          </h2>
          <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#555", marginBottom: "15px" }}>
            <strong>Priority</strong> is a number from <strong>1 to 10</strong> that indicates how important a class is:
          </p>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
            marginBottom: "15px"
          }}>
            <div style={{ 
              padding: "15px", 
              backgroundColor: "#e8f5e9", 
              borderRadius: "10px",
              border: "2px solid #4caf50"
            }}>
              <strong style={{ color: "#2e7d32", fontSize: "18px" }}>Low Priority (1-3)</strong>
              <p style={{ margin: "5px 0 0 0", color: "#555", fontSize: "14px" }}>
                Optional classes, less critical
              </p>
            </div>
            <div style={{ 
              padding: "15px", 
              backgroundColor: "#fff3e0", 
              borderRadius: "10px",
              border: "2px solid #ff9800"
            }}>
              <strong style={{ color: "#e65100", fontSize: "18px" }}>Medium Priority (4-6)</strong>
              <p style={{ margin: "5px 0 0 0", color: "#555", fontSize: "14px" }}>
                Important but flexible
              </p>
            </div>
            <div style={{ 
              padding: "15px", 
              backgroundColor: "#ffebee", 
              borderRadius: "10px",
              border: "2px solid #f44336",
              gridColumn: "1 / -1"
            }}>
              <strong style={{ color: "#c62828", fontSize: "18px" }}>High Priority (7-10)</strong>
              <p style={{ margin: "5px 0 0 0", color: "#555", fontSize: "14px" }}>
                Critical classes that must be scheduled (e.g., exams, core subjects)
              </p>
            </div>
          </div>
          <p style={{ fontSize: "15px", lineHeight: "1.8", color: "#555", fontStyle: "italic" }}>
            💡 <strong>Example:</strong> An exam (priority 10) will be scheduled before an optional seminar (priority 2)
          </p>
        </section>

        {/* How to Use */}
        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ 
            fontSize: "28px", 
            color: "#333", 
            marginBottom: "15px",
            borderBottom: "3px solid #667eea",
            paddingBottom: "10px"
          }}>
            🚀 How to Use This App
          </h2>
          <ol style={{ fontSize: "16px", lineHeight: "2.2", color: "#555", marginLeft: "20px" }}>
            <li><strong>Add Rooms:</strong> Enter room numbers, capacity, and type (Theory/Lab)</li>
            <li><strong>Add Classes:</strong> Enter subject, teacher, batch, time, capacity, and <strong>priority (1-10)</strong></li>
            <li><strong>View Your Entries:</strong> Check the tables below to see all rooms and classes added</li>
            <li><strong>Run Scheduler:</strong> Click the blue button to generate the optimal schedule</li>
            <li><strong>See Results:</strong> View the maximum priority achieved, minimum rooms used, and class-room assignments</li>
          </ol>
        </section>

        <div style={{ textAlign: "center" }}>
          <button
            onClick={handleGetStarted}
            style={{
              fontSize: "20px",
              padding: "15px 50px",
              backgroundColor: "#667eea",
              color: "white",
              border: "none",
              borderRadius: "50px",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
              transition: "all 0.3s ease",
              transform: "scale(1)"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.05)";
              e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
            }}
          >
            Get Started →
          </button>
        </div>
      </div>
    </div>
  );
}
