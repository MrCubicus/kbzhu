import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { shadow } from '../theme';
import { useTheme } from '../ThemeContext';

// Итог дня: калории относительно нормы, статус и доля БЖУ в калориях.
export default function DaySummary({ total, norm, title = 'Итог дня', flat = false }) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const pk = total.p * 4;
  const fk = total.f * 9;
  const ck = total.c * 4;
  const sum = pk + fk + ck;
  const share =
    sum > 0
      ? { p: Math.round((pk / sum) * 100), f: Math.round((fk / sum) * 100), c: Math.round((ck / sum) * 100) }
      : null;

  let status = null;
  if (total.kcal <= 0) {
    status = { text: 'Записей нет', color: colors.muted };
  } else if (norm) {
    const r = total.kcal / norm.kcal;
    const diff = Math.round(total.kcal - norm.kcal);
    const signed = `${diff > 0 ? '+' : ''}${diff} ккал`;
    if (r < 0.9) status = { text: `Недобор · ${signed}`, color: colors.fat };
    else if (r <= 1.1) status = { text: `В пределах нормы · ${signed}`, color: colors.primary };
    else status = { text: `Перебор · ${signed}`, color: colors.danger };
  }

  const rows = [
    ['Белки', total.p, norm?.p],
    ['Жиры', total.f, norm?.f],
    ['Углеводы', total.c, norm?.c],
  ];

  return (
    <View style={flat ? s.flat : [s.card, shadow]}>
      <Text style={s.title}>{title}</Text>
      <View style={s.topRow}>
        <Text style={s.kcal}>{Math.round(total.kcal)} ккал</Text>
        {norm ? <Text style={s.pct}>{Math.round((total.kcal / norm.kcal) * 100)}% нормы</Text> : null}
      </View>
      {status && (
        <View style={[s.pill, { backgroundColor: colors.bg }]}>
          <Text style={[s.pillText, { color: status.color }]}>{status.text}</Text>
        </View>
      )}

      <View style={s.bar}>
        {share ? (
          <>
            <View style={{ flex: Math.max(share.p, 0.01), backgroundColor: colors.protein }} />
            <View style={{ flex: Math.max(share.f, 0.01), backgroundColor: colors.fat }} />
            <View style={{ flex: Math.max(share.c, 0.01), backgroundColor: colors.carb }} />
          </>
        ) : null}
      </View>
      <Text style={s.legend}>
        {share
          ? `Доля калорий: белки ${share.p}% · жиры ${share.f}% · углеводы ${share.c}%`
          : 'Доля калорий появится после первой записи'}
      </Text>

      {rows.map(([label, value, target]) => (
        <View key={label} style={s.line}>
          <Text style={s.lineLabel}>{label}</Text>
          <Text style={s.lineValue}>
            {Math.round(value)}
            {target ? ` из ${target}` : ''} г
          </Text>
        </View>
      ))}
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    flat: { paddingTop: 4 },
    title: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 8 },
    topRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    kcal: { fontSize: 28, fontWeight: '800', color: colors.text },
    pct: { fontSize: 14, color: colors.muted },
    pill: {
      alignSelf: 'flex-start',
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginTop: 6,
    },
    pillText: { fontSize: 13, fontWeight: '700' },
    bar: {
      flexDirection: 'row',
      height: 10,
      borderRadius: 5,
      overflow: 'hidden',
      backgroundColor: colors.border,
      marginTop: 14,
    },
    legend: { fontSize: 12, color: colors.muted, marginTop: 6, marginBottom: 10 },
    line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    lineLabel: { fontSize: 14, color: colors.muted },
    lineValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  });
