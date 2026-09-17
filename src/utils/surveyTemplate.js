// Allowlist matches the Survey/Question schema; operational data never leaves here.
const surveyStrings = ['name', 'title', 'publishNotificationTitle', 'publishNotificationBody', 'expireNotificationTitle', 'expireNotificationBody'];
const questionStrings = ['id', 'title', 'text', 'type', 'minAnnotation', 'maxAnnotation', 'description'];
function object(value) { return value && typeof value === 'object' && !Array.isArray(value); }
function strings(source, keys, target) {
  keys.forEach(key => {
    if (source[key] !== undefined) {
      if (typeof source[key] !== 'string') throw new Error(`${key} は文字列で指定してください。`);
      target[key] = source[key];
    }
  });
}
export function surveyTemplate(source) {
  if (!object(source)) throw new Error('SurveyのJSONオブジェクトを指定してください。');
  const result = {};
  strings(source, surveyStrings, result);
  if (!result.name || !result.name.trim()) throw new Error('name（管理用の名前）が必要です。');
  if (!Array.isArray(source.questions) || !source.questions.length) throw new Error('questions に設問を指定してください。');
  const indices = new Set();
  result.questions = source.questions.map(q => {
    if (!object(q) || !Number.isInteger(q.index) || q.index < 0 || indices.has(q.index)) throw new Error('設問のindexは重複しない0以上の整数にしてください。');
    indices.add(q.index);
    const item = { index: q.index };
    strings(q, questionStrings, item);
    if (!item.type || !item.type.trim()) throw new Error('各設問にtypeが必要です。');
    if (q.values !== undefined) {
      if (!Array.isArray(q.values) || q.values.some(v => typeof v !== 'string')) throw new Error('valuesは文字列の配列にしてください。');
      item.values = q.values.slice();
    }
    for (const [key, fields] of [['skip', ['ifChosen', 'goto']], ['includeIf', ['ifIndex', 'ifValue']]]) {
      if (q[key] != null && Object.keys(q[key]).length) {
        if (!object(q[key]) || fields.some(f => !Number.isInteger(q[key][f]))) throw new Error(`${key} の条件は整数で指定してください。`);
        item[key] = Object.fromEntries(fields.map(f => [f, q[key][f]]));
      }
    }
    return item;
  });
  for (const q of result.questions) {
    if (q.skip && !indices.has(q.skip.goto)) throw new Error('skipの移動先indexが存在しません。');
    if (q.includeIf && !indices.has(q.includeIf.ifIndex)) throw new Error('includeIfの参照先indexが存在しません。');
  }
  return result;
}
export function parseTemplate(text) {
  let value;
  try { value = JSON.parse(text.replace(/^\uFEFF/, '')); }
  catch (_) { throw new Error('JSONの書式に誤りがあります。括弧・カンマ・引用符を確認してください。'); }
  return surveyTemplate(value);
}
