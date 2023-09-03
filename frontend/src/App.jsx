import React from 'react';
import './App.css';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoggedInRoute from './utils/LoggedInRoute';
import ProtectedRoute from './utils/ProtectedRoute';
import SignupPage from './screens/SignupScreen';
import Navbar from './components/Navbar'
import CreateTaskScreen from './screens/CreateTaskScreen'
import ScheduleScreen from './screens/ScheduleScreen'
import TaskScreen from './screens/TaskScreen'
import { Box, Typography } from '@mui/material';
import ConnectionsScreen from './screens/ConnectionScreen';
import EditTaskScreen from './screens/EditTaskScreen';

function App() {
  return (
    <Box bgcolor='#F7F1EE' minHeight='100vh'>
    <BrowserRouter>
        {/* <Navbar /> */}
        <Routes>
          <Route element={<LoggedInRoute />}>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<SignupPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<DashboardScreen />} />
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/profile/:id" element={<ProfileScreen />} />
            <Route path="/task/new" element={<CreateTaskScreen />} />
            <Route path="/task/:id" element={<TaskScreen />} />
            <Route path="/task/:id/edit" element={<EditTaskScreen />} />
            <Route path="/connections" element={<ConnectionsScreen />} />
            <Route path="/schedule" element={<ScheduleScreen />} />
          </Route>
          <Route path="*" element={
            <Typography variant="h1" component="h1">
              <h1> COMP390011WBEndGame: 404 Page not found</h1>
            </Typography>
          } />
        </Routes>
    </BrowserRouter>
    </Box>
  );
}

export default App;
