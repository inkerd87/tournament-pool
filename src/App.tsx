import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { HomePage } from '@/pages/HomePage';
import { TournamentsPage } from '@/pages/TournamentsPage';
import { TournamentDetailPage } from '@/pages/TournamentDetailPage';
import { AccountPage } from '@/pages/AccountPage';
import { AdminPage } from '@/pages/AdminPage';
import { HowItWorksPage } from '@/pages/HowItWorksPage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { LoginPage } from '@/pages/LoginPage';
import { PaymentReturnPage } from '@/pages/PaymentReturnPage';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#07090d] text-zinc-100 selection:bg-cyan-500/30 selection:text-white">
      <div className="fixed inset-0 pointer-events-none page-grid z-0" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/tournaments" element={<TournamentsPage />} />
            <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/payments/return" element={<PaymentReturnPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </div>
  );
};
