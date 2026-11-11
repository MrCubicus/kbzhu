import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { shadow } from '../theme';
import { useStore } from '../store';
import AddFoodModal from '../components/AddFoodModal';
import { num, per, round, sumItems } from '../utils/nutrition';
import { useTheme } from '../ThemeContext';

function Field({ label, value, onChangeText, keyboardType = 'decimal-pad', placeholder }) {
  const { colors } = useTheme();
  const s = React.useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

function ProductForm({ onCancel, onSave }) {
  const { colors } = useTheme();
  const s = React.useMemo(() => makeStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [p, setP] = useState('');
  const [f, setF] = useState('');
  const [c, setC] = useState('');

  const submit = () => {
    const P = num(p);
    const F = num(f);
    const C = num(c);
    // если калории не указаны — считаем по БЖУ (4/9/4 ккал на 1 г)
    const K = kcal.trim() ? num(kcal) : round(P * 4 + F * 9 + C * 4, 1);
    if (!name.trim()) return Alert.alert('Укажите название');
    if (K <= 0 && P + F + C <= 0) return Alert.alert('Укажите калории или БЖУ');
    onSave({ name: name.trim(), kcal: K, p: P, f: F, c: C });
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Text style={s.h2}>Новый продукт</Text>
      <Text style={s.hint}>Значения укажите на 100 г — как на упаковке.</Text>
      <Field label="Название" value={name} onChangeText={setName} keyboardType="default" />
      <Field label="Калории, ккал" value={kcal} onChangeText={setKcal} placeholder="посчитаются по БЖУ, если пусто" />
      <Field label="Белки, г" value={p} onChangeText={setP} />
      <Field label="Жиры, г" value={f} onChangeText={setF} />
      <Field label="Углеводы, г" value={c} onChangeText={setC} />
      <View style={s.row}>
        <TouchableOpacity style={[s.secondary, { flex: 1, marginRight: 10 }]} onPress={onCancel}>
          <Text style={s.secondaryText}>Отмена</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.primary, { flex: 2 }]} onPress={submit}>
          <Text style={s.primaryText}>Сохранить</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function RecipeForm({ onCancel, onSave }) {
  const { colors } = useTheme();
  const s = React.useMemo(() => makeStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [items, setItems] = useState([]); // { product, grams, ...nutrition }
  const [weight, setWeight] = useState('');
  const [picker, setPicker] = useState(false);

  const total = sumItems(items);
  const rawWeight = items.reduce((a, i) => a + i.grams, 0);
  const finalWeight = num(weight) > 0 ? num(weight) : rawWeight;
  const k = finalWeight > 0 ? 100 / finalWeight : 0;

  const submit = () => {
    if (!name.trim()) return Alert.alert('Укажите название рецепта');
    if (!items.length) return Alert.alert('Добавьте хотя бы один ингредиент');
    onSave({
      name: name.trim(),
      kcal: round(total.kcal * k, 1),
      p: round(total.p * k, 1),
      f: round(total.f * k, 1),
      c: round(total.c * k, 1),
      isRecipe: true,
      ingredients: items.map((i) => ({ name: i.product.name, grams: i.grams })),
      weight: round(finalWeight),
    });
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Text style={s.h2}>Новый рецепт</Text>
      <Field label="Название" value={name} onChangeText={setName} keyboardType="default" />

      <Text style={s.fieldLabel}>Ингредиенты</Text>
      {items.map((i, idx) => (
        <View key={idx} style={s.ingredient}>
          <View style={{ flex: 1 }}>
            <Text style={s.itemName}>{i.product.name}</Text>
            <Text style={s.itemSub}>
              {i.grams} г · {Math.round(i.kcal)} ккал
            </Text>
          </View>
          <TouchableOpacity onPress={() => setItems(items.filter((_, n) => n !== idx))} hitSlop={10}>
            <Text style={s.remove}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={s.addBtn} onPress={() => setPicker(true)}>
        <Text style={s.addBtnText}>+ Добавить ингредиент</Text>
      </TouchableOpacity>

      <View style={{ height: 16 }} />
      <Field
        label="Вес готового блюда, г (необязательно)"
        value={weight}
        onChangeText={setWeight}
        placeholder={rawWeight ? `по умолчанию ${round(rawWeight)} (сумма ингредиентов)` : ''}
      />
      <Text style={s.hint}>
        Если блюдо при готовке потеряло или набрало воду, взвесьте его и введите вес — так КБЖУ на
        100 г будет точнее.
      </Text>

      {items.length > 0 && (
        <View style={[s.card, shadow]}>
          <Text style={s.itemName}>Всего: {Math.round(total.kcal)} ккал</Text>
          <Text style={s.itemSub}>
            Б {Math.round(total.p)} · Ж {Math.round(total.f)} · У {Math.round(total.c)} г
          </Text>
          <Text style={[s.itemName, { marginTop: 8 }]}>
            На 100 г: {Math.round(total.kcal * k)} ккал
          </Text>
          <Text style={s.itemSub}>
            Б {round(total.p * k, 1)} · Ж {round(total.f * k, 1)} · У {round(total.c * k, 1)}
          </Text>
        </View>
      )}

      <View style={s.row}>
        <TouchableOpacity style={[s.secondary, { flex: 1, marginRight: 10 }]} onPress={onCancel}>
          <Text style={s.secondaryText}>Отмена</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.primary, { flex: 2 }]} onPress={submit}>
          <Text style={s.primaryText}>Сохранить</Text>
        </TouchableOpacity>
      </View>

      <AddFoodModal
        visible={picker}
        onClose={() => setPicker(false)}
        title="Ингредиент"
        onAdd={(product, grams) =>
          setItems((prev) => [...prev, { product, grams, ...per(product, grams) }])
        }
      />
    </ScrollView>
  );
}

export default function ProductsScreen() {
  const { colors } = useTheme();
  const s = React.useMemo(() => makeStyles(colors), [colors]);
  const { customProducts, addProduct, removeProduct } = useStore();
  const [tab, setTab] = useState('products'); // products | recipes
  const [mode, setMode] = useState('list'); // list | form

  const confirmRemove = (p) =>
    Alert.alert(`Удалить «${p.name}»?`, 'Записи в дневнике сохранятся.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => removeProduct(p.id) },
    ]);

  if (mode === 'form') {
    const close = () => setMode('list');
    const save = (p) => {
      addProduct(p);
      close();
    };
    return (
      <View style={s.root}>
        {tab === 'products' ? (
          <ProductForm onCancel={close} onSave={save} />
        ) : (
          <RecipeForm onCancel={close} onSave={save} />
        )}
      </View>
    );
  }

  const isRecipes = tab === 'recipes';
  const data = customProducts.filter((p) => !!p.isRecipe === isRecipes);

  return (
    <View style={s.root}>
      <View style={s.segment}>
        {[
          ['products', 'Мои продукты'],
          ['recipes', 'Рецепты'],
        ].map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[s.segBtn, tab === key && s.segBtnActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[s.segText, tab === key && s.segTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <TouchableOpacity style={[s.primary, { marginBottom: 16 }]} onPress={() => setMode('form')}>
          <Text style={s.primaryText}>{isRecipes ? '+ Новый рецепт' : '+ Новый продукт'}</Text>
        </TouchableOpacity>

        {data.length === 0 && (
          <Text style={s.empty}>
            {isRecipes
              ? 'Рецептов пока нет. Соберите блюдо из ингредиентов — приложение посчитает КБЖУ на 100 г.'
              : 'Своих продуктов пока нет. Добавьте то, чего нет во встроенной базе.'}
          </Text>
        )}

        {data.map((p) => (
          <View key={p.id} style={[s.card, shadow]}>
            <View style={{ flex: 1 }}>
              <Text style={s.itemName}>{p.name}</Text>
              <Text style={s.itemSub}>
                {Math.round(p.kcal)} ккал · Б {p.p} · Ж {p.f} · У {p.c} на 100 г
              </Text>
              {p.isRecipe && p.ingredients?.length > 0 && (
                <Text style={s.itemSub} numberOfLines={2}>
                  {p.ingredients.map((i) => `${i.name} ${i.grams} г`).join(', ')}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => confirmRemove(p)} hitSlop={10}>
              <Text style={s.remove}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  segment: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 0,
    backgroundColor: colors.border,
    borderRadius: 12,
    padding: 3,
  },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  segBtnActive: { backgroundColor: colors.card },
  segText: { color: colors.muted, fontWeight: '600' },
  segTextActive: { color: colors.text },
  h2: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 6 },
  hint: { fontSize: 13, color: colors.muted, marginBottom: 16 },
  fieldLabel: { fontSize: 13, color: colors.muted, marginBottom: 6 },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  row: { flexDirection: 'row', marginTop: 16 },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondary: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  secondaryText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  ingredient: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  itemName: { fontSize: 15, fontWeight: '600', color: colors.text },
  itemSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  remove: { fontSize: 16, color: colors.muted, paddingHorizontal: 8 },
  addBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
  },
  addBtnText: { color: colors.primary, fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 24, paddingHorizontal: 24 },
});
