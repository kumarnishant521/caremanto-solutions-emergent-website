import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import "@/App.css";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/lib/auth";
import { ConsultationProvider } from "@/lib/useConsultation";
import { useLenis } from "@/lib/useLenis";

import HomePage from "@/pages/HomePage";
import WorksPage from "@/pages/WorksPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import GalleryPage from "@/pages/GalleryPage";
import StudioPage from "@/pages/StudioPage";
import ApproachPage from "@/pages/ApproachPage";
import ContactPage from "@/pages/ContactPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import VideosPage from "@/pages/VideosPage";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }, [pathname]);
  return null;
}

function PublicShell({ children }) {
  return (
    <>
      <Nav />
      {children}
      <Footer />
    </>
  );
}

function SiteRoot() {
  useLenis();
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  return (
    <div className="App">
      <ScrollToTop />
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route
          path="/*"
          element={
            <PublicShell>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/works" element={<WorksPage />} />
                <Route path="/works/:id" element={<ProjectDetailPage />} />
                <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/films" element={<VideosPage />} />
        <Route path="/videos" element={<VideosPage />} />
                <Route path="/studio" element={<StudioPage />} />
                <Route path="/approach" element={<ApproachPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="*" element={<HomePage />} />
              </Routes>
            </PublicShell>
          }
        />
      </Routes>
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "rgba(20,21,26,0.95)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#F4F3ED",
            borderRadius: 0,
            fontFamily: "Outfit, sans-serif",
          },
        }}
      />
      {/* suppress unused-variable warning */}
      <span style={{ display: "none" }}>{isAdmin ? "admin" : "site"}</span>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ConsultationProvider>
            <SiteRoot />
          </ConsultationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
