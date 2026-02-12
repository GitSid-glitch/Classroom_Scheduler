import { Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import SchedulerPage from './components/SchedulerPage';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/scheduler" element={<SchedulerPage />} />
    </Routes>
  );
}

export default App;
