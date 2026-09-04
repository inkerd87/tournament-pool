/**
 * Утилиты валидации и форматирования полей ввода
 */

/**
 * Очистка и красивое форматирование номера телефона в реальном времени.
 * Запрещает ввод букв и любых посторонних символов.
 */
export function formatPhoneNumber(val: string): string {
  // Разрешаем только цифры
  const digits = val.replace(/\D/g, '');
  if (!digits) return '';

  // Если номер РФ/Казахстан (начинается с 7 или 8)
  if (digits.startsWith('7') || digits.startsWith('8')) {
    const main = digits.slice(1);
    let formatted = '+7';
    if (main.length > 0) {
      formatted += ' (' + main.slice(0, 3);
    }
    if (main.length >= 3) {
      formatted += ') ' + main.slice(3, 6);
    }
    if (main.length >= 6) {
      formatted += '-' + main.slice(6, 8);
    }
    if (main.length >= 8) {
      formatted += '-' + main.slice(8, 10);
    }
    return formatted;
  }

  // Для других стран: плюс и до 15 цифр
  return '+' + digits.slice(0, 15);
}

/**
 * Проверка валидности номера телефона (минимум 10 цифр)
 */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Проверка формата Email
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
