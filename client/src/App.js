import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import axios from 'axios';

import AuthPage from './components/AuthPage';
import AutomationTool from './components/AutomationTool';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0078d4',
    },
    secondary: {
      main: '#106ebe',
    },
  },
});

axios.defaults.baseURL = 'http://localhost:5000';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/api/auth/status');
      setIsAuthenticated(response.data.connected);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthChange = (status) => {
    setIsAuthenticated(status);
  };

  if (loading) {
    return <Box>Loading...</Box>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {isAuthenticated && <Navigation onDisconnect={() => setIsAuthenticated(false)} />}
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <AuthPage onAuthChange={handleAuthChange} />
              )
            }
          />
          <Route
            path="/automation"
            element={
              isAuthenticated ? (
                <AutomationTool />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <Dashboard />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;

