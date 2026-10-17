import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Chat } from './pages/Chat';
import { Tasks } from './pages/Tasks';
import { Schedule } from './pages/Schedule';
import { Notes } from './pages/Notes';
import { StudyPlanner } from './pages/StudyPlanner';
import { AgentActivity } from './pages/AgentActivity';
import { ConnectedTools } from './pages/ConnectedTools';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="chat" element={<Chat />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="notes" element={<Notes />} />
          <Route path="study-planner" element={<StudyPlanner />} />
          <Route path="agent" element={<AgentActivity />} />
          <Route path="tools" element={<ConnectedTools />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
