import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import Index from "./pages/Index";
import LeadsCompradores from "./pages/LeadsCompradores";
import LeadsVendedores from "./pages/LeadsVendedores";
import Recrutamento from "./pages/Recrutamento";
import Processos from "./pages/Processos";
import Objetivos from "./pages/Objetivos";
import Origens from "./pages/Origens";
import Administracao from "./pages/Administracao";
import ComingSoon from "./pages/ComingSoon";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/leads-compradores" element={<ProtectedRoute><LeadsCompradores /></ProtectedRoute>} />
            <Route path="/leads-vendedores" element={<ProtectedRoute><LeadsVendedores /></ProtectedRoute>} />
            <Route path="/recrutamento" element={<ProtectedRoute><Recrutamento /></ProtectedRoute>} />
            <Route path="/processos" element={<ProtectedRoute><Processos /></ProtectedRoute>} />
            <Route path="/atividades" element={<ProtectedRoute><ComingSoon title="Mapa de Atividades" /></ProtectedRoute>} />
            <Route path="/contas" element={<ProtectedRoute><ComingSoon title="Contas Correntes" /></ProtectedRoute>} />
            <Route path="/objetivos" element={<ProtectedRoute><Objetivos /></ProtectedRoute>} />
            <Route path="/origens" element={<ProtectedRoute><Origens /></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute><ComingSoon title="Agenda" /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Administracao /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
