import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'nb_launch_modal_dismissed_12sep';

export const LaunchAnnouncementModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Проверяем, закрывал ли уже пользователь эту модалку
    const isDismissed = localStorage.getItem(STORAGE_KEY);
    if (!isDismissed) {
      // Плавное открытие через небольшую задержку после монтирования
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleGoToTournaments = () => {
    handleClose();
    navigate('/tournaments');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-modal-fade"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-[#0c1017] p-6 sm:p-8 shadow-2xl shadow-cyan-500/10 text-zinc-100 transition-all transform animate-modal-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Верхняя светящаяся линия */}
        <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

        {/* Кнопка закрытия */}
        <button
          onClick={handleClose}
          type="button"
          aria-label="Закрыть"
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:border-white/20 transition-colors"
        >
          ✕
        </button>

        {/* Бейдж даты */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/15 px-3 py-1 text-xs font-black text-cyan-300 tracking-wide uppercase">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            Старт с 12 сентября
          </span>
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-extrabold text-amber-300">
            18+
          </span>
        </div>

        {/* Заголовок */}
        <h2 className="mt-4 text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-snug">
          Турниры NightByte стартуют{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
            12 сентября
          </span>
          !
        </h2>

        {/* Описание */}
        <p className="mt-2.5 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          Официальное открытие турнирной сетки и первые матчи по{' '}
          <strong className="text-white">CS2, Dota 2, PUBG, Warzone и Fortnite</strong> пройдут уже{' '}
          <strong className="text-cyan-300 font-semibold">12 сентября 2026 года</strong>.
        </p>

        {/* Карточки с ключевыми подробностями */}
        <div className="mt-5 space-y-2.5">
          <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-base text-cyan-400">
              ⚡
            </div>
            <div className="text-xs">
              <p className="font-bold text-white">Ранняя регистрация открыта</p>
              <p className="mt-0.5 text-zinc-400">
                Вы можете забронировать свой слот в сетке турнира заранее. Количество мест в каждом лобби строго ограничено.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-base text-emerald-400">
              💳
            </div>
            <div className="text-xs">
              <p className="font-bold text-white">Моментальная оплата участия</p>
              <p className="mt-0.5 text-zinc-400">
                Оплата орг. услуг и пополнение баланса доступны через СБП и банковские карты РФ (PayAnyWay) без задержек.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-base text-amber-400">
              🔑
            </div>
            <div className="text-xs">
              <p className="font-bold text-white">Комнаты и пароли</p>
              <p className="mt-0.5 text-zinc-400">
                Room ID и пароли для подключения к матчу станут доступны в личном кабинете зарегистрированных участников в день турнира.
              </p>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleGoToTournaments}
            className="btn-primary flex-1 py-3 text-xs sm:text-sm font-bold shadow-lg shadow-cyan-500/20 text-center"
          >
            Выбрать турнир и занять слот
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary py-3 px-5 text-xs sm:text-sm font-semibold text-center"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};
