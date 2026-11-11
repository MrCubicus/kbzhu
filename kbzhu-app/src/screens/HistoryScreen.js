import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MEALS, shadow } from '../theme';
import { useStore } from '../store';
import { useTheme } from '../ThemeContext';
import DaySummary from '../components/DaySummary';
import { formatDate, shiftDate, sumItems, todayKey } from '../utils/nutrition';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const { entries, norm, addEntry } = useStore();
  const [open, setOpen] = useState(null);

  const days = useMemo(
    () =>
      Object.keys(entries)
        .filter((k) => entries[k].length > 0)
        .sort()
        .reverse(),
    [entries]
  );

  // среднее за последние 7 дней по дням, в которые были записи
  const week = useMemo(() => {
    const today = todayKey();
    const keys = Array.from({ length: 7 }, (_, i) => shiftDate(today, -i)).filter(
      (k) => (entries[k] || []).length > 0
    );
    if (!keys.length) return null;
    const totals = keys.map((k) => sumItems(entries[k]));
    const avg = (f) => Math.round(totals.reduce((a, t) => a + t[f], 0) / totals.length);
    return { days: keys.length, kcal: avg('kcal'), p: avg('p'), f: avg('f'), c: avg('c') };
  }, [entries]);

  const repeat = (e) => {
    addEntry(todayKey(), { meal: e.meal, name: e.name, grams: e.grams, kcal: e.kcal, p: e.p, f: e.f, c: e.c });
    Alert.alert('Добавлено', `«${e.name}» добавлено в сегодняшний дневник.`);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      <Text style={s.h2}>История</Text>

      {week && (
        <View style={[s.card, shadow]}>
          <Text style={s.cardTitle}>В среднем за 7 дней</Text>
          <Text style={s.big}>{week.kcal} ккал в день</Text>
          <Text style={s.sub}>
            Б {week.p} · Ж {week.f} · У {week.c} г · по {week.days} дн. с записями
          </Text>
        </View>
      )}

      {days.length === 0 && (
        <Text style={s.empty}>Пока пусто. Всё, что вы добавите в дневник, появится здесь по дням.</Text>
      )}

      {days.map((key) => {
        const list = entries[key];
        const total = sumItems(list);
        const isOpen = open === key;
        return (
          <View key={key} style={[s.card, shadow]}>
            <TouchableOpacity onPress={() => setOpen(isOpen ? null : key)}>
              <View style={s.row}>
                <Text style={s.date}>{formatDate(key)}</Text>
                <Text style={s.kcal}>{Math.round(total.kcal)} ккал</Text>
              </View>
              <Text style={s.sub}>
                Б {Math.round(total.p)} · Ж {Math.round(total.f)} · У {Math.round(total.c)} г ·{' '}
                {list.length} поз.
              </Text>
            </TouchableOpacity>

            {isOpen && (
              <View style={{ marginTop: 10 }}>
                {MEALS.map((m) => {
                  const items = list.filter((e) => e.meal === m.key);
                  if (!items.length) return null;
                  return (
                    <View key={m.key} style={{ marginBottom: 8 }}>
                      <Text style={s.meal}>{m.label}</Text>
                      {items.map((e) => (
                        <View key={e.id} style={s.entry}>
                          <View style={{ flex: 1 }}>
                            <Text style={s.entryName}>{e.name}</Text>
                            <Text style={s.sub}>
                              {e.grams} г · {Math.round(e.kcal)} ккал
                            </Text>
                          </View>
                          <TouchableOpacity style={s.repeat} onPress={() => repeat(e)} hitSlop={8}>
                            <Text style={s.repeatText}>↻ Сегодня</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  );
                })}
                <DaySummary total={total} norm={norm} title="Итог дня" flat />
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    h2: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 16 },
    card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    cardTitle: { fontSize: 13, color: colors.muted },
    big: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: 2 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    date: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1, marginRight: 8 },
    kcal: { fontSize: 16, fontWeight: '700', color: colors.primary },
    sub: { fontSize: 12, color: colors.muted, marginTop: 2 },
    meal: { fontSize: 13, fontWeight: '700', color: colors.muted, marginBottom: 4, marginTop: 4 },
    entry: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    entryName: { fontSize: 14, color: colors.text },
    repeat: {
      backgroundColor: colors.primaryLight,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginLeft: 8,
    },
    repeatText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
    empty: { textAlign: 'center', color: colors.muted, marginTop: 32, paddingHorizontal: 24 },
  });
