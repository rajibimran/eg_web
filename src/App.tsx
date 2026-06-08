import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Services from "./pages/Services.tsx";
import ServiceDetail from "./pages/ServiceDetail.tsx";
import About from "./pages/About.tsx";
import BookAppointment from "./pages/BookAppointment.tsx";
import ReportCheck from "./pages/ReportCheck.tsx";
import ScreeningProcess from "./pages/ScreeningProcess.tsx";
import FitnessPage from "./pages/FitnessPage.tsx";
import EquipmentPage from "./pages/EquipmentPage.tsx";
import Contact from "./pages/Contact.tsx";
import Blog from "./pages/Blog.tsx";
import News from "./pages/News.tsx";
import BlogPost from "./pages/BlogPost.tsx";
import NewsPostPage from "./pages/NewsPost.tsx";
import Privacy from "./pages/Privacy.tsx";
import NotFound from "./pages/NotFound.tsx";
import { StrapiLayoutProvider } from "@/contexts/StrapiLayoutContext";
import { SectionRoute } from "@/components/routing/SectionRoute";
const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <StrapiLayoutProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:slug" element={<ServiceDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/book" element={<BookAppointment />} />
            <Route path="/reports" element={<ReportCheck />} />
            <Route path="/process" element={<ScreeningProcess />} />
            <Route path="/fitness" element={<FitnessPage />} />
            <Route path="/equipment" element={<EquipmentPage />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/blog"
              element={
                <SectionRoute section="blog">
                  <Blog />
                </SectionRoute>
              }
            />
            <Route
              path="/blog/:slug"
              element={
                <SectionRoute section="blog">
                  <BlogPost />
                </SectionRoute>
              }
            />
            <Route
              path="/news"
              element={
                <SectionRoute section="news">
                  <News />
                </SectionRoute>
              }
            />
            <Route
              path="/news/:slug"
              element={
                <SectionRoute section="news">
                  <NewsPostPage />
                </SectionRoute>
              }
            />
            <Route path="/privacy" element={<Privacy />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </StrapiLayoutProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
