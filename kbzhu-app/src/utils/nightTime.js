// Тёмная тема в авто-режиме: с 20:00 до 07:00.
export const NIGHT_START = 20;
export const NIGHT_END = 7;

export const isNight = (d) => {
  const h = d.getHours();
  return h >= NIGHT_START || h < NIGHT_END;
};

// Сколько миллисекунд до ближайшего переключения (07:00 или 20:00).
export function msToNextSwitch(now) {
  const at = (h, addDays = 0) =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + addDays, h, 0, 0, 0);
  const next = [at(NIGHT_END), at(NIGHT_START), at(NIGHT_END, 1)].find((d) => d > now);
  return next.getTime() - now.getTime();
}
