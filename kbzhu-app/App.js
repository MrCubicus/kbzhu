import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from './src/store';
import { ThemeProvider, useTheme } from './src/ThemeContext';
import DiaryScreen from './src/screens/DiaryScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const TABS = [
  { key: 'diary', label: 'Дневник', icon: '📒', Screen: DiaryScreen },
  { key: 'history', label: 'История', icon: '🕘', Screen: HistoryScreen },
  { key: 'products', label: 'Продукты', icon: '🥕', Screen: ProductsScreen },
  { key: 'profile', label: 'Профиль', icon: '👤', Screen: ProfileScreen },
];

function Shell() {
  const { ready } = useStore();
  const { colors, isDark } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [tab, setTab] = useState('diary');
  const Active = TABS.find((t) => t.key === tab).Screen;

  if (!ready) {
    return (
      <View style={s.loader}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ flex: 1 }}>
        <Active />
      </View>
      <View style={s.tabbar}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.key} style={s.tab} onPress={() => setTab(t.key)}>
            <Text style={[s.icon, tab !== t.key && { opacity: 0.45 }]}>{t.icon}</Text>
            <Text style={[s.tabLabel, tab === t.key && s.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <ThemeProvider>
          <Shell />
        </ThemeProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
    tabbar: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
    icon: { fontSize: 20 },
    tabLabel: { fontSize: 11, color: colors.muted, marginTop: 2 },
    tabLabelActive: { color: colors.primary, fontWeight: '700' },
  });
