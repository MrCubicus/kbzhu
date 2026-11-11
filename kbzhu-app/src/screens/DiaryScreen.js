import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MEALS, shadow } from '../theme';
import { useStore } from '../store';
import MacroBar from '../components/MacroBar';
import AddFoodModal from '../components/AddFoodModal';
import DaySummary from '../components/DaySummary';
import { formatDate, per, shiftDate, sumItems, todayKey } from '../utils/nutrition';
import { useTheme } from '../ThemeContext';

export default function DiaryScreen() {
  const { colors } = useTheme();
  const s = React.useMemo(() => makeStyles(colors), [colors]);
  const { entries, norm, addEntry, removeEntry } = useStore();
  const [date, setDate] = useState(todayKey());
  const [meal, setMeal] = useState(null);

  const list = entries[date] || [];
  const total = sumItems(list);
  const left = norm ? norm.kcal - Math.round(total.kcal) : null;

  const handleAdd = (product, grams) => {
    addEntry(date, {
      meal,
      name: product.name,
      grams,
      ...per(product, grams),
    });
  };

  return (
    <View style={s.root}>
      <View style={s.nav}>
        <TouchableOpacity onPress={() => setDate(shiftDate(date, -1))} hitSlop={12}>
          <Text style={s.arrow}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDate(todayKey())}>
          <Text style={s.date}>{formatDate(date)}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDate(shiftDate(date, 1))} hitSlop={12}>
          <Text style={s.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View style={[s.card, shadow]}>
          <Text style={s.kcal}>
            {Math.round(total.kcal)}
            <Text style={s.kcalUnit}> {norm ? `/ ${norm.kcal} ккал` : 'ккал'}</Text>
          </Text>
          {norm ? (
            <Text style={[s.left, left < 0 && { color: colors.danger }]}>
              {left >= 0 ? `Осталось ${left} ккал` : `Превышение на ${-left} ккал`}
            </Text>
          ) : (
            <Text style={s.left}>Задайте параметры в профиле, чтобы увидеть свою норму</Text>
          )}
          <View style={s.macros}>
            <MacroBar label="Белки" value={total.p} target={norm?.p} color={colors.protein} />
            <View style={{ width: 12 }} />
            <MacroBar label="Жиры" value={total.f} target={norm?.f} color={colors.fat} />
            <View style={{ width: 12 }} />
            <MacroBar label="Углеводы" value={total.c} target={norm?.c} color={colors.carb} />
          </View>
        </View>

        {MEALS.map((m) => {
          const items = list.filter((e) => e.meal === m.key);
          const sum = sumItems(items);
          return (
            <View key={m.key} style={[s.card, shadow]}>
              <View style={s.mealHead}>
                <Text style={s.mealTitle}>{m.label}</Text>
                <Text style={s.mealKcal}>{Math.round(sum.kcal)} ккал</Text>
              </View>

              {items.map((e) => (
                <View key={e.id} style={s.entry}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.entryName}>{e.name}</Text>
                    <Text style={s.entrySub}>
                      {e.grams} г · {Math.round(e.kcal)} ккал · Б {Math.round(e.p)} · Ж{' '}
                      {Math.round(e.f)} · У {Math.round(e.c)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeEntry(date, e.id)} hitSlop={10}>
                    <Text style={s.remove}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={s.add} onPress={() => setMeal(m.key)}>
                <Text style={s.addText}>+ Добавить</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <DaySummary total={total} norm={norm} title="Итог дня" />
      </ScrollView>

      <AddFoodModal
        visible={!!meal}
        onClose={() => setMeal(null)}
        onAdd={handleAdd}
        title={`Добавить: ${MEALS.find((m) => m.key === meal)?.label.toLowerCase() || ''}`}
      />
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  arrow: { fontSize: 32, color: colors.primary, paddingHorizontal: 8, lineHeight: 34 },
  date: { fontSize: 17, fontWeight: '700', color: colors.text },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  kcal: { fontSize: 34, fontWeight: '800', color: colors.text },
  kcalUnit: { fontSize: 16, fontWeight: '500', color: colors.muted },
  left: { fontSize: 14, color: colors.muted, marginTop: 2, marginBottom: 16 },
  macros: { flexDirection: 'row' },
  mealHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  mealTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  mealKcal: { fontSize: 14, color: colors.muted },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  entryName: { fontSize: 15, color: colors.text },
  entrySub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  remove: { fontSize: 16, color: colors.muted, paddingHorizontal: 8 },
  add: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
  },
  addText: { color: colors.primary, fontWeight: '700' },
});
