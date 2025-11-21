import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = devices.filter(
        (device) =>
          device.deviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          device.userPrincipalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          device.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          device.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDevices(filtered);
    } else {
      setFilteredDevices(devices);
    }
  }, [searchTerm, devices]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, devicesResponse] = await Promise.all([
        axios.get('/api/dashboard/stats'),
        axios.get('/api/devices'),
      ]);

      setStats(statsResponse.data);
      setDevices(devicesResponse.data);
      setFilteredDevices(devicesResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getComplianceColor = (state) => {
    switch (state) {
      case 'Compliant':
        return 'success';
      case 'NonCompliant':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!stats) {
    return (
      <Container>
        <Typography>Error loading dashboard data</Typography>
      </Container>
    );
  }

  const platformData = Object.entries(stats.byPlatform || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const complianceData = Object.entries(stats.byCompliance || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const topOsData = Object.entries(stats.topOsVersions || {})
    .map(([name, value]) => ({ name, value }))
    .slice(0, 10);

  const topManufacturersData = Object.entries(stats.topManufacturers || {})
    .map(([name, value]) => ({ name, value }))
    .slice(0, 10);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Intune Device Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Key Metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Devices
              </Typography>
              <Typography variant="h4">{stats.totalDevices}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Compliant Devices
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.compliantDevices}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Non-Compliant Devices
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.nonCompliantDevices}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Inactive Devices (30+ days)
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.inactiveDevices}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Devices by Platform
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Compliance Status
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top 10 OS Versions
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topOsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top 10 Manufacturers
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topManufacturersData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Device Inventory Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Device Inventory</Typography>
              <TextField
                size="small"
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 300 }}
              />
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Device Name</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>OS Version</TableCell>
                    <TableCell>Manufacturer</TableCell>
                    <TableCell>Compliance</TableCell>
                    <TableCell>Last Sync</TableCell>
                    <TableCell>Enrollment Date</TableCell>
                    <TableCell>Serial Number</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDevices.slice(0, 100).map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>{device.deviceName || 'N/A'}</TableCell>
                      <TableCell>{device.userPrincipalName || 'N/A'}</TableCell>
                      <TableCell>{device.osVersion || 'N/A'}</TableCell>
                      <TableCell>{device.manufacturer || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={device.complianceState || 'Unknown'}
                          color={getComplianceColor(device.complianceState)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {device.lastSyncDateTime
                          ? new Date(device.lastSyncDateTime).toLocaleDateString()
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {device.enrolledDateTime
                          ? new Date(device.enrolledDateTime).toLocaleDateString()
                          : 'N/A'}
                      </TableCell>
                      <TableCell>{device.serialNumber || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {filteredDevices.length > 100 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Showing first 100 of {filteredDevices.length} devices
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

