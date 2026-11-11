// Распознавание еды по фото через Claude (Messages API, vision).
// Модель определяет продукты на фото, оценивает вес порции и КБЖУ на 100 г.

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-5-5';

const PROMPT = `Ты нутрициолог. На фото еда. Определи каждый отдельный продукт или блюдо на фото и оцени:
- вес порции в граммах так, как она выглядит на фото (в приготовленном виде);
- КБЖУ на 100 г для этого продукта в том виде, в каком он на фото (например, варёная курица, а не сырая).

Ответь ТОЛЬКО JSON без пояснений и без markdown:
{"items":[{"name":"название по-русски","grams":число,"kcal":число,"protein":число,"fat":число,"carbs":число}]}

Правила: значения kcal, protein, fat, carbs — на 100 г. Если блюдо составное (например, борщ), указывай его одной позицией. Если на фото нет еды, верни {"items":[]}.`;

const r1 = (n) => Math.round(n * 10) / 10;
const toNum = (x) => {
  const v = Number(x);
  return Number.isFinite(v) && v >= 0 ? v : null;
};

// Разбирает текст ответа модели в список позиций:
// [{ name, grams, kcal, p, f, c }] — КБЖУ на 100 г, grams — оценка веса порции.
export function parseVisionResponse(text) {
  if (typeof text !== 'string') throw new Error('Пустой ответ. Попробуйте ещё раз.');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('Не удалось разобрать ответ. Попробуйте ещё раз.');

  let data;
  try {
    data = JSON.parse(text.slice(start, end + 1));
  } catch (e) {
    throw new Error('Не удалось разобрать ответ. Попробуйте ещё раз.');
  }

  const arr = Array.isArray(data.items) ? data.items : [];
  return arr
    .map((it) => {
      const grams = toNum(it.grams);
      if (!it.name || !grams || grams <= 0) return null;
      const kcal = toNum(it.kcal);
      const p = toNum(it.protein);
      const f = toNum(it.fat);
      const c = toNum(it.carbs);
      if (kcal === null && p === null && f === null && c === null) return null;
      const P = p ?? 0;
      const F = f ?? 0;
      const C = c ?? 0;
      const K = kcal ?? P * 4 + F * 9 + C * 4;
      return {
        name: String(it.name).trim().slice(0, 80),
        grams: Math.min(Math.round(grams), 3000),
        kcal: r1(K),
        p: r1(P),
        f: r1(F),
        c: r1(C),
      };
    })
    .filter(Boolean);
}

export async function analyzeFoodPhoto(base64, apiKey) {
  const data = String(base64 || '').replace(/^data:.*?;base64,/, '');
  if (!data) throw new Error('Не удалось получить снимок. Попробуйте ещё раз.');

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000);
  let res;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } },
              { type: 'text', text: PROMPT },
            ],
          },
        ],
      }),
    });
  } catch (e) {
    throw new Error(
      e && e.name === 'AbortError'
        ? 'Сервер слишком долго отвечает. Попробуйте ещё раз.'
        : 'Нет связи с сервером. Проверьте интернет.'
    );
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401 || res.status === 403) {
    throw new Error('API-ключ не подошёл. Проверьте его во вкладке «Профиль».');
  }
  if (res.status === 429) throw new Error('Слишком много запросов. Подождите немного и повторите.');
  if (!res.ok) throw new Error(`Ошибка сервера (${res.status}). Попробуйте позже.`);

  const json = await res.json();
  const text = (json.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
  return parseVisionResponse(text);
}
