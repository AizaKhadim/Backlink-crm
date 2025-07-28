import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ProjectPage from './pages/Projects/ProjectPage';

import Dashboard from './pages/Dashboard/Dashboard';
import ProjectsList from './pages/Projects/ProjectsList';
import ProjectDetails from './pages/Projects/ProjectDetails';
import TeamPage from './pages/Team/TeamPage';
import ReportsPage from './pages/Reports/ReportsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import GoalsPage from './pages/Goals/GoalsPage';
import InboxPage from './pages/Inbox/InboxPage';
import SignUp from './pages/Auth/Signup';
import SignIn from './pages/Auth/Signin';
import HomeScreen from './pages/Homescreen/Homescreen';
import ManageUsers from './pages/Admin/ManageUsers';
import GlobalBacklinks from './pages/Backlinks/GlobalBacklinks';

import { AuthProvider, useAuth } from './context/AuthContext';

import './App.css';

// Layout wrapper for routes with/without navbar & sidebar
function LayoutWrapper({ children }) {
  const location = useLocation();
  const hideLayoutRoutes = ['/', '/signin', '/signup'];
  const hideLayout = hideLayoutRoutes.includes(location.pathname);

  return hideLayout ? (
    children
  ) : (
    <div className="app-wrapper">
      <Navbar />
      <div className="main-layout">
        <Sidebar />
        <div className="main-content">{children}</div>
      </div>
    </div>
  );
}

// Define protected + public routes
function AppRoutes() {
  const { role } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/projects/create" element={<ProjectPage />} />

      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/projects" element={<ProjectsList />} />
      <Route path="/projects/:id" element={<ProjectDetails />} />
      
      <Route path="/backlinks" element={<GlobalBacklinks />} />

      
      <Route path="/team" element={<TeamPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/goals" element={<GoalsPage />} />
      <Route path="/inbox" element={<InboxPage />} />
      


      {/* Admin Only Route */}
      <Route
        path="/admin/users"
        element={
          role === 'admin' ? <ManageUsers /> : <Navigate to="/dashboard" replace />
        }
      />
    </Routes>
  );
}

// App Root
function App() {
  return (
    <AuthProvider>
      <Router>
        <LayoutWrapper>
          <AppRoutes />
        </LayoutWrapper>
      </Router>
    </AuthProvider>
  );
}

export default App;
