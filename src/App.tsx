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
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-[#06070a] text-zinc-100 selection:bg-[#ff1e44]/40 selection:text-white">
      {/* Атмосферный тёмный киберспортивный фон в стиле Nexus */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 scale-105"
          style={{ backgroundImage: "url('/bg-esports.jpg?v=5')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#06070a]/70 via-[#06070a]/90 to-[#06070a]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,#06070a_85%)]" />
        {/* Двойная неоновая подсветка Nexus (Красный + Циан) */}
        <div className="absolute -top-40 right-1/4 h-[550px] w-[550px] rounded-full bg-[#ff1e44]/12 blur-[160px]" />
        <div className="absolute top-1/4 -left-20 h-[500px] w-[500px] rounded-full bg-[#00f0ff]/10 blur-[160px]" />
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
