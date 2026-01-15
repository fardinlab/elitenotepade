import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import TeamMembers from "./pages/TeamMembers";
import YearlyTeamMembers from "./pages/YearlyTeamMembers";
import PlusTeamMembers from "./pages/PlusTeamMembers";
import DueMembers from "./pages/DueMembers";
import CurrentMonthMembers from "./pages/CurrentMonthMembers";
import MemberPayDetails from "./pages/MemberPayDetails";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/team/:teamId"
              element={
                <ProtectedRoute>
                  <TeamMembers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/yearly-team/:teamId"
              element={
                <ProtectedRoute>
                  <YearlyTeamMembers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/plus-team/:teamId"
              element={
                <ProtectedRoute>
                  <PlusTeamMembers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/due-members"
              element={
                <ProtectedRoute>
                  <DueMembers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/current-month-members"
              element={
                <ProtectedRoute>
                  <CurrentMonthMembers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/member-pay-details/:memberId"
              element={
                <ProtectedRoute>
                  <MemberPayDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
