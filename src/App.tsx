import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import LeadsCompradores from "./pages/LeadsCompradores";
import LeadsVendedores from "./pages/LeadsVendedores";
import Recrutamento from "./pages/Recrutamento";
import Processos from "./pages/Processos";
import Objetivos from "./pages/Objetivos";
import Origens from "./pages/Origens";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/leads-compradores" element={<LeadsCompradores />} />
          <Route path="/leads-vendedores" element={<LeadsVendedores />} />
          <Route path="/recrutamento" element={<Recrutamento />} />
          <Route path="/processos" element={<Processos />} />
          <Route
            path="/atividades"
            element={<ComingSoon title="Mapa de Atividades" />}
          />
          <Route
            path="/contas"
            element={<ComingSoon title="Contas Correntes" />}
          />
          <Route path="/objetivos" element={<Objetivos />} />
          <Route path="/origens" element={<Origens />} />
          <Route
            path="/agenda"
            element={<ComingSoon title="Agenda" />}
          />
          <Route
            path="/admin"
            element={<ComingSoon title="Administração" />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
