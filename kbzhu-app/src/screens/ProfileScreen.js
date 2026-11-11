import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { shadow } from '../theme';
import { useStore } from '../store';
import { ACTIVITY, GOALS, calcNorm, num } from '../utils/nutrition';
import { useTheme } from '../ThemeContext';
import { getApiKey, saveApiKey } from '../utils/secureKey';

function Chips({ options, value, onChange }) {
  const { colors } = useTheme();
  const s = React.useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={s.chips}>
      {options.map((o) => (
        <TouchableOpacity
          key={o.key}
          style={[s.chip, value === o.key && s.chipActive]}
          onPress={() => onChange(o.key)}
        >
          <Text style={[s.chipText, value === o.key && s.chipTextActive]}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function Num({ label, value, onChangeText, suffix }) {
  const { colors } = useTheme();
  const s = React.useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={{ flex: 1, marginRight: 8 }}>
      <Text style={s.label}>{label}</Text>
      <View style={s.inputWrap}>
        <TextInput
          style={s.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
        />
        <Text style={s.suffix}>{suffix}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const s = React.useMemo(() => makeStyles(colors), [colors]);
  const { profile, norm, saveProfile, themeMode, setThemeMode } = useStore();
  const [sex, setSex] = useState(profile?.sex || 'f');
  const [age, setAge] = useState(profile ? String(profile.age) : '');
  const [height, setHeight] = useState(profile ? String(profile.height) : '');
  const [weight, setWeight] = useState(profile ? String(profile.weight) : '');
  const [activity, setActivity] = useState(profile?.activity || 'low');
  const [goal, setGoal] = useState(profile?.goal || 'keep');
  const [apiKey, setApiKey] = useState('');
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    getApiKey().then((k) => {
      setApiKey(k);
      setKeySaved(!!k);
    });
  }, []);

  const saveKey = async () => {
    try {
      await saveApiKey(apiKey);
      setKeySaved(!!apiKey.trim());
      Alert.alert(apiKey.trim() ? 'Ключ сохранён' : 'Ключ удалён');
    } catch (e) {
      Alert.alert('Не удалось сохранить ключ');
    }
  };

  const values = { sex, age: num(age), height: num(height), weight: num(weight), activity, goal };
  const valid = values.age > 0 && values.height > 0 && values.weight > 0;
  const preview = useMemo(() => (valid ? calcNorm(values) : null), [
    sex, age, height, weight, activity, goal,
  ]);

  const save = () => {
    if (!valid) return Alert.alert('Заполните возраст, рост и вес');
    saveProfile(values, preview);
    Alert.alert('Готово', 'Норма сохранена и появится в дневнике.');
  };

  const actHint = ACTIVITY.find((a) => a.key === activity)?.hint;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.h2}>Профиль и норма</Text>

      <Text style={s.label}>Пол</Text>
      <Chips
        options={[
          { key: 'f', label: 'Женский' },
          { key: 'm', label: 'Мужской' },
        ]}
        value={sex}
        onChange={setSex}
      />

      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <Num label="Возраст" value={age} onChangeText={setAge} suffix="лет" />
        <Num label="Рост" value={height} onChangeText={setHeight} suffix="см" />
        <Num label="Вес" value={weight} onChangeText={setWeight} suffix="кг" />
      </View>

      <Text style={[s.label, { marginTop: 16 }]}>Активность</Text>
      <Chips options={ACTIVITY} value={activity} onChange={setActivity} />
      <Text style={s.hint}>{actHint}</Text>

      <Text style={[s.label, { marginTop: 8 }]}>Цель</Text>
      <Chips options={GOALS} value={goal} onChange={setGoal} />

      <Text style={[s.label, { marginTop: 8 }]}>Тема оформления</Text>
      <Chips
        options={[
          { key: 'auto', label: 'Авто' },
          { key: 'light', label: 'Светлая' },
          { key: 'dark', label: 'Тёмная' },
        ]}
        value={themeMode}
        onChange={setThemeMode}
      />
      <Text style={s.hint}>Авто: тёмная тема включается ровно в 20:00 и выключается в 07:00.</Text>

      <View style={[s.card, shadow]}>
        <Text style={s.cardTitle}>Ваша суточная норма</Text>
        {preview ? (
          <>
            <Text style={s.big}>{preview.kcal} ккал</Text>
            <View style={s.macroRow}>
              <Text style={s.macro}>Белки {preview.p} г</Text>
              <Text style={s.macro}>Жиры {preview.f} г</Text>
              <Text style={s.macro}>Углеводы {preview.c} г</Text>
            </View>
          </>
        ) : (
          <Text style={s.hint}>Введите возраст, рост и вес — норма рассчитается автоматически.</Text>
        )}
      </View>

      <TouchableOpacity style={[s.save, !valid && { opacity: 0.4 }]} onPress={save}>
        <Text style={s.saveText}>{norm ? 'Обновить норму' : 'Сохранить норму'}</Text>
      </TouchableOpacity>

      <View style={[s.card, shadow]}>
        <Text style={s.cardTitle}>Распознавание еды по фото</Text>
        <Text style={[s.hint, { marginTop: 8 }]}>
          Для этого нужен ключ Anthropic API (console.anthropic.com). Ключ хранится только на этом
          устройстве в защищённом хранилище. Каждое распознавание — платный запрос, он списывается с
          вашего аккаунта Anthropic.
        </Text>
        <TextInput
          style={s.keyInput}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="sk-ant-…"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
        <TouchableOpacity style={s.keyBtn} onPress={saveKey}>
          <Text style={s.keyBtnText}>{keySaved ? 'Обновить ключ' : 'Сохранить ключ'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.note}>
        Расчёт по формуле Миффлина — Сан-Жеора. Белок — от 1,6 до 2 г на кг веса в зависимости от цели,
        жиры — 25% калорий, остальное — углеводы. Это ориентир, а не медицинская рекомендация.
      </Text>
    </ScrollView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  h2: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 16 },
  label: { fontSize: 13, color: colors.muted, marginBottom: 6 },
  hint: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: colors.text },
  suffix: { color: colors.muted, fontSize: 13, marginLeft: 4 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  cardTitle: { fontSize: 13, color: colors.muted },
  big: { fontSize: 34, fontWeight: '800', color: colors.text, marginVertical: 4 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  macro: { fontSize: 14, fontWeight: '600', color: colors.text },
  save: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  note: { fontSize: 12, color: colors.muted, marginTop: 16, lineHeight: 17 },
  keyInput: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    marginTop: 4,
  },
  keyBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
  },
  keyBtnText: { color: colors.primary, fontWeight: '700' },
});
