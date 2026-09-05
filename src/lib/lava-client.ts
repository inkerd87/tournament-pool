/**
 * Конфигурация и интеграция с Lava.top
 */

// Ссылка на продукт в Lava.top (Организационный сбор 100 ₽)
export const LAVA_PRODUCT_URL = 'https://app.lava.top/products/eed8e575-0404-4463-be18-b44ae43d9170';

export function getLavaCheckoutUrl(): string {
  return LAVA_PRODUCT_URL;
}
