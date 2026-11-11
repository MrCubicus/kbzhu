import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PRODUCTS } from '../data/products';
import { useStore } from '../store';
import { useTheme } from '../ThemeContext';
import { num, per } from '../utils/nutrition';
import FoodScanner from './FoodScanner';

const QUICK = [50, 100, 150, 200, 300];

// Окно добавления еды: поиск по базе или фото блюда → ввод граммовки.
// onAdd(product, grams) вызывается для каждой добавляемой позиции.
export default function AddFoodModal({ visible, onClose, onAdd, title = 'Выберите продукт' }) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const { customProducts } = useStore();
  const [mode, setMode] = useState('list'); // list | scan
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [grams, setGrams] = useState('100');

  useEffect(() => {
    if (!visible) {
      setMode('list');
      setQuery('');
      setSelected(null);
      setGrams('100');
    }
  }, [visible]);

  const list = useMemo(() => {
    const all = [...customProducts, ...PRODUCTS];
    const q = query.trim().toLowerCase();
    return q ? all.filter((p) => p.name.toLowerCase().includes(q)) : all;
  }, [query, customProducts]);

  const g = num(grams);
  const preview = selected ? per(selected, g) : null;

  const headerTitle = mode === 'scan' ? 'Фото еды' : selected ? selected.name : title;

  let body;
  if (mode === 'scan') {
    body = (
      <FoodScanner
        onClose={() => setMode('list')}
        onDone={(found) => {
          found.forEach(({ product, grams: gr }) => onAdd(product, gr));
          onClose();
        }}
      />
    );
  } else if (selected) {
    body = (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.body}>
          <Text style={s.sub}>
            На 100 г: {selected.kcal} ккал · Б {selected.p} · Ж {selected.f} · У {selected.c}
          </Text>

          <Text style={s.fieldLabel}>Вес, г</Text>
          <TextInput
            style={s.input}
            value={grams}
            onChangeText={setGrams}
            keyboardType="decimal-pad"
            autoFocus
            selectTextOnFocus
          />
          <View style={s.chips}>
            {QUICK.map((q) => (
              <TouchableOpacity key={q} style={s.chip} onPress={() => setGrams(String(q))}>
                <Text style={s.chipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.preview}>
            <Text style={s.previewKcal}>{Math.round(preview.kcal)} ккал</Text>
            <Text style={s.previewMacros}>
              Б {Math.round(preview.p)} · Ж {Math.round(preview.f)} · У {Math.round(preview.c)} г
            </Text>
          </View>

          <View style={s.actions}>
            <TouchableOpacity style={s.secondary} onPress={() => setSelected(null)}>
              <Text style={s.secondaryText}>Назад</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.primary, g <= 0 && { opacity: 0.4 }]}
              disabled={g <= 0}
              onPress={() => {
                onAdd(selected, g);
                onClose();
              }}
            >
              <Text style={s.primaryText}>Добавить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  } else {
    body = (
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={s.photoBtn} onPress={() => setMode('scan')}>
          <Text style={s.photoIcon}>📷</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.photoTitle}>Сфотографировать еду</Text>
            <Text style={s.photoSub}>Распознаем блюдо, вес и КБЖУ по фото</Text>
          </View>
        </TouchableOpacity>
        <TextInput
          style={s.search}
          placeholder="Поиск продукта"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        <FlatList
          data={list}
          keyExtractor={(p) => p.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <Text style={s.empty}>
              Ничего не найдено. Сфотографируйте блюдо 📷 или добавьте продукт на вкладке «Продукты».
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={s.item} onPress={() => setSelected(item)}>
              <View style={{ flex: 1 }}>
                <Text style={s.itemName}>{item.name}</Text>
                <Text style={s.itemSub}>
                  {item.kcal} ккал · Б {item.p} · Ж {item.f} · У {item.c} на 100 г
                </Text>
              </View>
              {!item.builtin && <Text style={s.badge}>{item.isRecipe ? 'рецепт' : 'мой'}</Text>}
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.root}>
        <View style={s.header}>
          <Text style={s.title} numberOfLines={1}>
            {headerTitle}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Text style={s.close}>Закрыть</Text>
          </TouchableOpacity>
        </View>
        {body}
      </SafeAreaView>
    </Modal>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    title: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text, marginRight: 12 },
    close: { color: colors.primary, fontSize: 15, fontWeight: '600' },
    photoBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 10,
      padding: 14,
      borderRadius: 14,
      backgroundColor: colors.primaryLight,
    },
    photoIcon: { fontSize: 28, marginRight: 12 },
    photoTitle: { fontSize: 16, fontWeight: '700', color: colors.primary },
    photoSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
    search: {
      marginHorizontal: 16,
      marginBottom: 8,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    itemName: { fontSize: 16, color: colors.text },
    itemSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
    badge: {
      fontSize: 11,
      color: colors.primary,
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      overflow: 'hidden',
      marginLeft: 8,
    },
    empty: { textAlign: 'center', color: colors.muted, marginTop: 32, paddingHorizontal: 32 },
    body: { padding: 16 },
    sub: { color: colors.muted, fontSize: 13, marginBottom: 20, marginTop: 8 },
    fieldLabel: { fontSize: 13, color: colors.muted, marginBottom: 6 },
    input: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 14,
      fontSize: 22,
      fontWeight: '600',
      color: colors.text,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
    chip: {
      backgroundColor: colors.primaryLight,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginRight: 8,
      marginBottom: 8,
    },
    chipText: { color: colors.primary, fontWeight: '600' },
    preview: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      marginTop: 12,
      alignItems: 'center',
    },
    previewKcal: { fontSize: 28, fontWeight: '700', color: colors.text },
    previewMacros: { fontSize: 14, color: colors.muted, marginTop: 4 },
    actions: { flexDirection: 'row', marginTop: 20 },
    primary: {
      flex: 2,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    secondary: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginRight: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    secondaryText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  });
