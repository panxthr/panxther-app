import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useParams, Navigate } from "react-router-dom";
import Config from "./Config";
import ProfilePage from "./ProfilePage";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Dashboard routes */}
        <Route path="/config" element={<Config />} />
        {/* <Route path="/admin" element={<Dashboard />} /> */}
        
        {/* Root redirect to dashboard */}
        <Route path="/" element={<Navigate to="/config" replace />} />
        
        {/* Dynamic user profile routes - catch all other routes */}
        <Route path="/:userId" element={<ProfilePage />} />
      </Routes>
    </Router>
  );
}