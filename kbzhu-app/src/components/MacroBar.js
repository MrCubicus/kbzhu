import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeContext';

export default function MacroBar({ label, value, target, color }) {
  const { colors } = useTheme();
  const s = React.useMemo(() => makeStyles(colors), [colors]);
  const pct = target ? Math.min(value / target, 1) * 100 : 0;
  const over = target && value > target;
  return (
    <View style={s.wrap}>
      <View style={s.row}>
        <Text style={s.label}>{label}</Text>
        <Text style={[s.value, over && { color: colors.danger }]}>
          {Math.round(value)}
          {target ? ` / ${target}` : ''} г
        </Text>
      </View>
      {target ? (
        <View style={s.track}>
          <View style={[s.fill, { width: `${pct}%`, backgroundColor: over ? colors.danger : color }]} />
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: { flex: 1 },
  row: { flexDirection: 'column', marginBottom: 6 },
  label: { fontSize: 12, color: colors.muted, marginBottom: 2 },
  value: { fontSize: 14, fontWeight: '600', color: colors.text },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});
