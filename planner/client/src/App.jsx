import { Routes, Route } from 'react-router-dom';
import BottomTabBar from './components/BottomTabBar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Tasks from './pages/Tasks.jsx';
import Calendar from './pages/Calendar.jsx';
import Goals from './pages/Goals.jsx';
import Notes from './pages/Notes.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <main className="mx-auto max-w-lg px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/notes" element={<Notes />} />
        </Routes>
      </main>
      <BottomTabBar />
    </div>
  );
}
