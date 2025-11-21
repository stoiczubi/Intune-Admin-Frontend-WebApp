import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Grid,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import axios from 'axios';

export default function AuthPage({ onAuthChange }) {
  const [formData, setFormData] = useState({
    tenantId: '',
    clientId: '',
    clientSecret: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/connect', formData);
      if (response.data.success) {
        onAuthChange(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <LockIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Intune Admin Portal
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Connect to Microsoft Graph using Azure App Registration
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tenant ID"
                name="tenantId"
                value={formData.tenantId}
                onChange={handleChange}
                required
                variant="outlined"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Client ID (Application ID)"
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                required
                variant="outlined"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Client Secret"
                name="clientSecret"
                type="password"
                value={formData.clientSecret}
                onChange={handleChange}
                required
                variant="outlined"
                placeholder="Enter your client secret"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? 'Connecting...' : 'Connect'}
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Required Permissions:</strong> Your Azure App Registration needs the following
            Microsoft Graph API permissions:
            <ul style={{ marginTop: 8, marginBottom: 0 }}>
              <li>DeviceManagementManagedDevices.ReadWrite.All</li>
              <li>Device.ReadWrite.All</li>
              <li>DeviceManagementConfiguration.ReadWrite.All</li>
            </ul>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

