import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AccountSetup from "./pages/AccountSetup";
import PersonalInfoSetup from "./pages/PersonalInfoSetup";
import CreateOrganization from "./pages/CreateOrganization";
import JoinOrganization from "./pages/JoinOrganization";
import OrganizationAdmin from "./pages/OrganizationAdmin";
import Dashboard from "./pages/Dashboard";
import MeetingRoom from "./pages/MeetingRoom";
import JoinMeeting from "./pages/JoinMeeting";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return (
      <QueryClientProvider client={queryClient}>
        <SplashScreen onComplete={() => setShowSplash(false)} />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/account-setup" element={<AccountSetup />} />
              <Route path="/personal-info-setup" element={<PersonalInfoSetup />} />
              <Route path="/create-organization" element={<CreateOrganization />} />
              <Route path="/join-organization" element={<JoinOrganization />} />
              <Route path="/organization" element={<OrganizationAdmin />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/meeting/:meetingId" element={<MeetingRoom />} />
              <Route path="/join" element={<JoinMeeting />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
