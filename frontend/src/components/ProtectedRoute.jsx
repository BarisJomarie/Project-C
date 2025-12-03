import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  try {
    const decoded = jwtDecode(token);

    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      alert("Session expired. Please log in again.");
      return <Navigate to="/signin" replace />;
    }

    // Check role (if allowedRoles specified)
    if (allowedRoles && !allowedRoles.includes(decoded.role)) {
      return <Navigate to="/unauthorized" replace />;
    }

    return children; // token valid → allow access
  } catch (err) {
    localStorage.removeItem("token"); // invalid token
    return <Navigate to="/signin" replace />;
  }
};

export default ProtectedRoute;
