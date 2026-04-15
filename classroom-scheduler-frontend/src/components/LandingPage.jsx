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
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      boxSizing: "border-box"
    }}>
      <div className="glass-panel" style={{
        maxWidth: "900px",
        width: "100%",
        padding: "50px",
        textAlign: "left"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <h1 className="text-gradient" style={{ 
            fontSize: "3.5rem", 
            marginBottom: "10px"
          }}>
            🎓 Classroom Scheduler
          </h1>
          <p style={{ 
            fontSize: "1.25rem", 
            color: "var(--text-secondary)",
            margin: "0"
          }}>
            Intelligent Scheduling with Dynamic Programming + Heap Algorithms
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid-2" style={{ marginBottom: "40px" }}>
          <section className="glass-panel" style={{ padding: "30px", background: "rgba(255,255,255,0.02)" }}>
            <h2 style={{ 
              fontSize: "1.5rem", 
              color: "var(--text-primary)", 
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <span style={{ fontSize: "1.8rem" }}>📚</span> What Does This App Do?
            </h2>
            <ul style={{ fontSize: "1.1rem", lineHeight: "1.8", color: "var(--text-secondary)", paddingLeft: "20px", margin: 0 }}>
              <li style={{ marginBottom: "10px" }}><strong style={{color:"#a5b4fc"}}>Maximizing Priority:</strong> Schedules the most important classes first</li>
              <li style={{ marginBottom: "10px" }}><strong style={{color:"#a5b4fc"}}>Avoiding Conflicts:</strong> Ensures no time overlaps between classes</li>
              <li style={{ marginBottom: "10px" }}><strong style={{color:"#a5b4fc"}}>Minimizing Rooms:</strong> Uses the fewest rooms possible to save resources</li>
              <li><strong style={{color:"#a5b4fc"}}>Smart Algorithms:</strong> Uses DP for optimal selection and Heap for room assignment</li>
            </ul>
          </section>

          <section className="glass-panel" style={{ padding: "30px", background: "rgba(255,255,255,0.02)" }}>
            <h2 style={{ 
              fontSize: "1.5rem", 
              color: "var(--text-primary)", 
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <span style={{ fontSize: "1.8rem" }}>🎯</span> Priority Levels
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ padding: "15px", borderRadius: "8px", background: "rgba(74, 222, 128, 0.1)", borderLeft: "4px solid #4ade80" }}>
                <strong style={{ color: "#4ade80", display: "block", marginBottom: "5px" }}>Low (1-3)</strong>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Optional classes, less critical</span>
              </div>
              <div style={{ padding: "15px", borderRadius: "8px", background: "rgba(250, 204, 21, 0.1)", borderLeft: "4px solid #facc15" }}>
                <strong style={{ color: "#facc15", display: "block", marginBottom: "5px" }}>Medium (4-6)</strong>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Important but flexible</span>
              </div>
              <div style={{ padding: "15px", borderRadius: "8px", background: "rgba(248, 113, 113, 0.1)", borderLeft: "4px solid #f87171" }}>
                <strong style={{ color: "#f87171", display: "block", marginBottom: "5px" }}>High (7-10)</strong>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Critical classes (exams, core subjects)</span>
              </div>
            </div>
          </section>
        </div>

        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <button
            onClick={handleGetStarted}
            className="btn-gradient"
            style={{
              fontSize: "1.2rem",
              padding: "16px 48px",
              borderRadius: "50px",
              letterSpacing: "1px"
            }}
          >
            Get Started <span style={{ marginLeft: "8px" }}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
