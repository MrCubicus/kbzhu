import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { shadow } from '../theme';
import { useTheme } from '../ThemeContext';
import { getApiKey } from '../utils/secureKey';
import { analyzeFoodPhoto } from '../utils/foodVision';
import { num, per, sumItems, uid } from '../utils/nutrition';

// Фото еды → список продуктов с оценкой веса и КБЖУ.
// onDone([{ product, grams }]) — пользователь подтвердил результат.
export default function FoodScanner({ onDone, onClose }) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [perm, requestPerm] = useCameraPermissions();
  const camera = useRef(null);
  const [apiKey, setApiKey] = useState(null); // null — ещё читаем
  const [stage, setStage] = useState('camera'); // camera | analyzing | review
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState([]); // { id, name, kcal, p, f, c (на 100 г), grams (строка) }

  useEffect(() => {
    getApiKey().then(setApiKey);
  }, []);

  const shoot = async () => {
    if (busy || !camera.current) return;
    setBusy(true);
    setError('');
    try {
      const photo = await camera.current.takePictureAsync({
        quality: 0.4,
        base64: true,
        skipProcessing: true,
      });
      setStage('analyzing');
      const found = await analyzeFoodPhoto(photo.base64, apiKey);
      if (!found.length) {
        setError('Еда на фото не найдена. Снимите ближе и при хорошем свете.');
        setStage('camera');
      } else {
        setItems(found.map((f) => ({ ...f, id: uid(), grams: String(f.grams) })));
        setStage('review');
      }
    } catch (e) {
      setError((e && e.message) || 'Не удалось распознать фото.');
      setStage('camera');
    }
    setBusy(false);
  };

  const confirm = () => {
    const ready = items
      .filter((i) => num(i.grams) > 0)
      .map((i) => ({
        product: { id: `ai${i.id}`, name: i.name, kcal: i.kcal, p: i.p, f: i.f, c: i.c },
        grams: num(i.grams),
      }));
    if (ready.length) onDone(ready);
  };

  // --- нет ключа ---
  if (apiKey === null) return <View style={s.root} />;
  if (!apiKey) {
    return (
      <View style={[s.root, s.center]}>
        <Text style={s.title}>Нужен API-ключ</Text>
        <Text style={s.text}>
          Для распознавания еды по фото укажите ключ Anthropic API во вкладке «Профиль», раздел
          «Распознавание еды по фото».
        </Text>
        <TouchableOpacity style={s.link} onPress={onClose}>
          <Text style={s.linkText}>Назад к поиску</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- разрешение камеры ---
  if (!perm) return <View style={s.root} />;
  if (!perm.granted) {
    return (
      <View style={[s.root, s.center]}>
        <Text style={s.title}>Нужен доступ к камере</Text>
        <Text style={s.text}>Камера нужна, чтобы сфотографировать блюдо и посчитать КБЖУ.</Text>
        <TouchableOpacity
          style={s.primary}
          onPress={perm.canAskAgain ? requestPerm : () => Linking.openSettings()}
        >
          <Text style={s.primaryText}>{perm.canAskAgain ? 'Разрешить' : 'Открыть настройки'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.link} onPress={onClose}>
          <Text style={s.linkText}>Назад к поиску</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- распознавание ---
  if (stage === 'analyzing') {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[s.text, { marginTop: 16 }]}>Распознаём еду на фото…</Text>
      </View>
    );
  }

  // --- проверка результата ---
  if (stage === 'review') {
    // portion — КБЖУ порции; сами поля kcal/p/f/c остаются значениями на 100 г
    const rows = items.map((i) => ({ ...i, portion: per(i, num(i.grams)) }));
    const total = sumItems(rows.map((r) => r.portion));
    const count = items.filter((i) => num(i.grams) > 0).length;
    return (
      <View style={[s.root, { backgroundColor: colors.bg }]}>
        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <Text style={s.title}>Нашли на фото</Text>
          <Text style={[s.text, { textAlign: 'left', marginBottom: 12 }]}>
            Вес и КБЖУ определены по фото приблизительно. Поправьте граммовку, если нужно.
          </Text>

          {rows.map((i) => (
            <View key={i.id} style={[s.card, shadow]}>
              <View style={{ flex: 1 }}>
                <Text style={s.itemName}>{i.name}</Text>
                <Text style={s.itemSub}>
                  На 100 г: {Math.round(i.kcal)} ккал · Б {i.p} · Ж {i.f} · У {i.c}
                </Text>
                <Text style={s.itemSub}>Порция: {Math.round(i.portion.kcal)} ккал</Text>
              </View>
              <View style={s.gramsWrap}>
                <TextInput
                  style={s.gramsInput}
                  value={i.grams}
                  onChangeText={(v) =>
                    setItems(items.map((x) => (x.id === i.id ? { ...x, grams: v } : x)))
                  }
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
                <Text style={s.gramsUnit}>г</Text>
              </View>
              <TouchableOpacity
                onPress={() => setItems(items.filter((x) => x.id !== i.id))}
                hitSlop={10}
              >
                <Text style={s.remove}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {rows.length > 0 && (
            <Text style={s.total}>
              Всего: {Math.round(total.kcal)} ккал · Б {Math.round(total.p)} · Ж {Math.round(total.f)} · У{' '}
              {Math.round(total.c)}
            </Text>
          )}

          <View style={s.actions}>
            <TouchableOpacity
              style={s.secondary}
              onPress={() => {
                setItems([]);
                setStage('camera');
              }}
            >
              <Text style={s.secondaryText}>Переснять</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.primary, { flex: 2 }, count === 0 && { opacity: 0.4 }]}
              disabled={count === 0}
              onPress={confirm}
            >
              <Text style={s.primaryText}>Добавить ({count})</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // --- камера ---
  return (
    <View style={s.root}>
      <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" />
      <View style={s.overlay} pointerEvents="box-none">
        <Text style={s.hint}>Положите еду в кадр и сделайте снимок</Text>
        {!!error && <Text style={s.error}>{error}</Text>}
        <View style={s.bottom}>
          <TouchableOpacity style={s.cancel} onPress={onClose}>
            <Text style={s.cancelText}>Назад</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.shutter, busy && { opacity: 0.5 }]} onPress={shoot} disabled={busy}>
            <View style={s.shutterInner} />
          </TouchableOpacity>
          <View style={{ width: 72 }} />
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    center: { alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg },
    title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
    text: { fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 12 },
    primary: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 28,
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
    link: { marginTop: 16 },
    linkText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
    overlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center' },
    hint: {
      color: '#fff',
      marginTop: 24,
      fontSize: 15,
      textShadowColor: '#000',
      textShadowRadius: 6,
    },
    error: {
      color: '#fff',
      backgroundColor: 'rgba(214,69,69,0.9)',
      marginHorizontal: 24,
      padding: 12,
      borderRadius: 10,
      overflow: 'hidden',
      textAlign: 'center',
    },
    bottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      alignSelf: 'stretch',
      paddingHorizontal: 24,
      paddingBottom: 32,
    },
    cancel: {
      width: 72,
      backgroundColor: 'rgba(0,0,0,0.6)',
      borderRadius: 20,
      paddingVertical: 10,
      alignItems: 'center',
    },
    cancelText: { color: '#fff', fontWeight: '600' },
    shutter: {
      width: 76,
      height: 76,
      borderRadius: 38,
      borderWidth: 4,
      borderColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
    },
    itemName: { fontSize: 15, fontWeight: '600', color: colors.text },
    itemSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
    gramsWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg,
      borderRadius: 10,
      paddingHorizontal: 10,
      marginLeft: 8,
    },
    gramsInput: { width: 54, paddingVertical: 8, fontSize: 16, fontWeight: '600', color: colors.text },
    gramsUnit: { color: colors.muted, marginLeft: 2 },
    remove: { fontSize: 16, color: colors.muted, paddingHorizontal: 10 },
    total: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 4 },
    actions: { flexDirection: 'row', marginTop: 20 },
  });
