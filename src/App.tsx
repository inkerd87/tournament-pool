import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HomePage } from "@/pages/HomePage";
import { TournamentsPage } from "@/pages/TournamentsPage";
import { TournamentDetailPage } from "@/pages/TournamentDetailPage";
import { AccountPage } from "@/pages/AccountPage";
import { AdminPage } from "@/pages/AdminPage";
import { HowItWorksPage } from "@/pages/HowItWorksPage";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { OfferPage } from "@/pages/OfferPage";
import { LoginPage } from "@/pages/LoginPage";
import { PaymentReturnPage } from "@/pages/PaymentReturnPage";
import { AuthModal } from "@/components/AuthModal";

export const App: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Отправка хита в Яндекс.Метрику при смене страницы внутри SPA
    if (typeof (window as any).ym === "function") {
      (window as any).ym(112434134, "hit", window.location.href);
    }
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-[#07090d] text-zinc-100 selection:bg-cyan-500/30 selection:text-white">
      {/* Атмосферный задний фон киберспортивной арены */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-85 scale-100 transform-gpu"
          style={{ backgroundImage: "url('/bg-esports.jpg?v=3')" }}
        />
        {/* Мягкие затемняющие градиенты: сохраняют картинку сочной и лазеры яркими, при этом текст 100% читается */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#07090d]/30 via-[#07090d]/50 to-[#07090d]/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(2, 2, 2, 0.75)_95%)]" />
      </div>
      <div className="relative z-10 flex flex-col min-h-screen w-full max-w-full overflow-x-hidden">
        <Header />
        <main className="flex-1 w-full max-w-full overflow-x-hidden">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/tournaments" element={<TournamentsPage />} />
            <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/offer" element={<OfferPage />} />
            <Route path="/terms" element={<OfferPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/payments/return" element={<PaymentReturnPage />} />
            <Route path="/payment/return" element={<PaymentReturnPage />} />
            <Route path="/payment/success" element={<PaymentReturnPage />} />
            <Route path="/payments/success" element={<PaymentReturnPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>
        <Footer />
        <AuthModal />
      </div>
    </div>
  );
};
