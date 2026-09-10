import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import MessagesPage from "./pages/MessagesPage";
import FilesPage from "./pages/FilesPage";
import FeedbackPage from "./pages/FeedbackPage";

function protect(element: ReactNode) {
  return <ProtectedRoute>{element}</ProtectedRoute>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={protect(<DashboardPage />)} />
          <Route path="/messages" element={protect(<MessagesPage />)} />
          <Route path="/files" element={protect(<FilesPage />)} />
          <Route path="/feedback" element={protect(<FeedbackPage />)} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
