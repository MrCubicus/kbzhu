export const ACTIVITY = [
  { key: 'min', label: 'Минимальная', hint: 'сидячая работа, без тренировок', k: 1.2 },
  { key: 'low', label: 'Лёгкая', hint: '1–3 тренировки в неделю', k: 1.375 },
  { key: 'mid', label: 'Средняя', hint: '3–5 тренировок в неделю', k: 1.55 },
  { key: 'high', label: 'Высокая', hint: '6–7 тренировок в неделю', k: 1.725 },
  { key: 'ext', label: 'Очень высокая', hint: 'тяжёлый труд или 2 тренировки в день', k: 1.9 },
];

// k — множитель калорий, protein — г белка на кг веса
export const GOALS = [
  { key: 'lose', label: 'Похудеть', k: 0.85, protein: 2.0 },
  { key: 'keep', label: 'Поддерживать вес', k: 1, protein: 1.6 },
  { key: 'gain', label: 'Набрать массу', k: 1.1, protein: 1.8 },
];

export const round = (n, d = 0) => {
  const m = Math.pow(10, d);
  return Math.round((Number(n) || 0) * m) / m;
};

export const num = (s) => {
  const v = parseFloat(String(s ?? '').replace(',', '.'));
  return Number.isFinite(v) ? v : 0;
};

export const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// КБЖУ порции в граммах по продукту (значения на 100 г)
export function per(product, grams) {
  const k = grams / 100;
  return {
    kcal: round(product.kcal * k, 1),
    p: round(product.p * k, 1),
    f: round(product.f * k, 1),
    c: round(product.c * k, 1),
  };
}

export function sumItems(items) {
  const t = items.reduce(
    (a, i) => ({ kcal: a.kcal + i.kcal, p: a.p + i.p, f: a.f + i.f, c: a.c + i.c }),
    { kcal: 0, p: 0, f: 0, c: 0 }
  );
  return { kcal: round(t.kcal, 1), p: round(t.p, 1), f: round(t.f, 1), c: round(t.c, 1) };
}

// Формула Миффлина — Сан-Жеора + коэффициент активности + цель.
export function calcNorm({ sex, age, height, weight, activity, goal }) {
  const bmr = 10 * weight + 6.25 * height - 5 * age + (sex === 'm' ? 5 : -161);
  const act = ACTIVITY.find((a) => a.key === activity) || ACTIVITY[0];
  const g = GOALS.find((x) => x.key === goal) || GOALS[1];
  const kcal = Math.round(bmr * act.k * g.k);
  const p = Math.round(weight * g.protein);
  const f = Math.round((kcal * 0.25) / 9);
  const c = Math.max(0, Math.round((kcal - p * 4 - f * 9) / 4));
  return { kcal, p, f, c };
}

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];
const DAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

export const dateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const todayKey = () => dateKey(new Date());

export function shiftDate(key, delta) {
  const [y, m, d] = key.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d + delta));
}

export function formatDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (key === todayKey()) return `Сегодня, ${d} ${MONTHS[m - 1]}`;
  return `${d} ${MONTHS[m - 1]}, ${DAYS[dt.getDay()]}`;
}
