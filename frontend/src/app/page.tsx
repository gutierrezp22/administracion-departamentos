"use client"; // This is a client component
import { useEffect } from 'react';
import { Route, Routes, HashRouter as Router } from 'react-router-dom';
import LoginPage from '@/pages/login';
import DashboardMenu from '@/pages/dashboard';

const AppWrapper = () => {
  return (
    <Router>
      <Page />
    </Router>
  );
};

const Page = () => {
  return (
    
      <Routes>
        <Route path="/*" element={<LoginPage />} />
        <Route path="dashboard/*" element={<DashboardMenu />} />
      </Routes>
    
  );
};

export default AppWrapper;

