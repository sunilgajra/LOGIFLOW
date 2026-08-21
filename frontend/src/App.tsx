import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetails from './pages/ClientDetails';
import Couriers from './pages/Couriers';
import Shipments from './pages/Shipments';
import ImportEngine from './pages/ImportEngine';
import DeliveryMode from './pages/DeliveryMode';
import TrackingPage from './pages/TrackingPage';
import Settings from './pages/Settings';
import Rates from './pages/Rates';
import Zones from './pages/Zones';
import NDRManagement from './pages/NDRManagement';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Appointments from './pages/Appointments';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/track" element={<TrackingPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected ERP Dashboard */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="shipments" element={<Shipments />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="ndr" element={<NDRManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="users" element={<Users />} />
          <Route path="import" element={<ImportEngine />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:id" element={<ClientDetails />} />
          <Route path="couriers" element={<Couriers />} />
          <Route path="delivery" element={<DeliveryMode />} />
          <Route path="settings" element={<Settings />} />
          <Route path="rates" element={<Rates />} />
          <Route path="zones" element={<Zones />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

