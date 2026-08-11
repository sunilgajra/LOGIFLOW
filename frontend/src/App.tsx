import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Couriers from './pages/Couriers';
import Shipments from './pages/Shipments';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Protected ERP Dashboard */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="shipments" element={<Shipments />} />
          <Route path="import" element={<div className="p-4">Import Engine Coming Soon</div>} />
          <Route path="clients" element={<Clients />} />
          <Route path="couriers" element={<Couriers />} />
          <Route path="settings" element={<div className="p-4">Settings Page Coming Soon</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
