import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useAuth } from "./hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Payment from "./pages/Payment";
import Settings from "./pages/Settings";
import SystemStatus from "./pages/SystemStatus";
import Transcript from "./pages/Transcript";
import StudyHelper from "./components/StudyHelper";
import AppController from "./components/AppController";
import ScreenAutomation from "./components/ScreenAutomation";
import { FaceRecognition } from "./components/FaceRecognition";
import LanguageSelector from "./components/LanguageSelector";
import JarvisSettingsPage from "./pages/JarvisSettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

const AppContent = () => {
  const { user, loading } = useAuth();
  const [language, setLanguage] = useState<'english' | 'hinglish' | null>(null);
  
  useEffect(() => {
    const savedLanguage = localStorage.getItem('jarvis-language') as 'english' | 'hinglish' | null;
    setLanguage(savedLanguage);
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-2xl">Loading...</div>
      </div>
    );
  }

  if (user && !language) {
    return <LanguageSelector onLanguageSelect={setLanguage} />;
  }

  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      } />
      <Route path="/transcript" element={
        <ProtectedRoute>
          <Transcript />
        </ProtectedRoute>
      } />
      <Route path="/system" element={
        <ProtectedRoute>
          <SystemStatus />
        </ProtectedRoute>
      } />
      <Route path="/payment" element={
        <ProtectedRoute>
          <Payment />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/jarvis-settings" element={
        <ProtectedRoute>
          <JarvisSettingsPage />
        </ProtectedRoute>
      } />
      <Route path="/study" element={
        <ProtectedRoute>
          <StudyHelper />
        </ProtectedRoute>
      } />
      <Route path="/apps" element={
        <ProtectedRoute>
          <AppController />
        </ProtectedRoute>
      } />
      <Route path="/automation" element={
        <ProtectedRoute>
          <ScreenAutomation />
        </ProtectedRoute>
      } />
      <Route path="/face" element={
        <ProtectedRoute>
          <FaceRecognition isActive={false} />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
