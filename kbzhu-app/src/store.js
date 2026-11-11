import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uid } from './utils/nutrition';

const KEY = 'kbzhu:v1';

const initial = {
  profile: null, // { sex, age, height, weight, activity, goal }
  norm: null, // { kcal, p, f, c }
  customProducts: [], // свои продукты и рецепты (значения на 100 г)
  entries: {}, // { 'YYYY-MM-DD': [{ id, meal, name, grams, kcal, p, f, c }] }
  themeMode: 'auto', // auto (тёмная 20:00–07:00) | light | dark
};

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, setState] = useState(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) setState({ ...initial, ...JSON.parse(raw) });
      } catch (e) {
        // повреждённые данные — начинаем с чистого листа
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const api = useMemo(
    () => ({
      saveProfile: (profile, norm) => setState((s) => ({ ...s, profile, norm })),
      setThemeMode: (themeMode) => setState((s) => ({ ...s, themeMode })),
      addEntry: (date, entry) =>
        setState((s) => ({
          ...s,
          entries: {
            ...s.entries,
            [date]: [...(s.entries[date] || []), { ...entry, id: uid() }],
          },
        })),
      removeEntry: (date, id) =>
        setState((s) => ({
          ...s,
          entries: { ...s.entries, [date]: (s.entries[date] || []).filter((e) => e.id !== id) },
        })),
      addProduct: (product) =>
        setState((s) => ({
          ...s,
          customProducts: [{ ...product, id: product.id || uid() }, ...s.customProducts],
        })),
      removeProduct: (id) =>
        setState((s) => ({ ...s, customProducts: s.customProducts.filter((p) => p.id !== id) })),
    }),
    []
  );

  return <Ctx.Provider value={{ ...state, ready, ...api }}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
