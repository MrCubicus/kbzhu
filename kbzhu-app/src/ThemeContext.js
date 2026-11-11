import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { light, dark } from './theme';
import { useStore } from './store';
import { isNight, msToNextSwitch } from './utils/nightTime';

const Ctx = createContext({ colors: light, isDark: false });

export function ThemeProvider({ children }) {
  const { themeMode } = useStore();
  const [night, setNight] = useState(() => isNight(new Date()));

  useEffect(() => {
    let timer;
    const tick = () => {
      clearTimeout(timer);
      const now = new Date();
      setNight(isNight(now));
      // небольшой запас, чтобы таймер гарантированно сработал уже после границы
      timer = setTimeout(tick, msToNextSwitch(now) + 200);
    };
    tick();
    // в фоне таймеры могут не срабатывать — пересчитываем при возврате в приложение
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') tick();
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, []);

  const isDark = themeMode === 'dark' || (themeMode !== 'light' && night);
  const value = useMemo(() => ({ colors: isDark ? dark : light, isDark }), [isDark]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
