import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BuildIcon from '@mui/icons-material/Build';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import axios from 'axios';

export default function Navigation({ onDisconnect }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleDisconnect = async () => {
    try {
      await axios.post('/api/auth/disconnect');
      onDisconnect(false);
      navigate('/');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Intune Admin Portal
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<DashboardIcon />}
            onClick={() => navigate('/dashboard')}
            variant={location.pathname === '/dashboard' ? 'outlined' : 'text'}
          >
            Dashboard
          </Button>
          <Button
            color="inherit"
            startIcon={<BuildIcon />}
            onClick={() => navigate('/automation')}
            variant={location.pathname === '/automation' ? 'outlined' : 'text'}
          >
            Automation Tool
          </Button>
          <Button
            color="inherit"
            startIcon={<ExitToAppIcon />}
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

