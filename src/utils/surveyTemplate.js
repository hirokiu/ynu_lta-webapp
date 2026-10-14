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
  const result = surveyTemplate(value);
  const errors = surveyStructureErrors(result);
  if (errors.length) throw new Error(errors.join("\n"));
  return result;
}

// Validate the navigation contract shared by the currently deployed mobile apps.
// Never repair/reindex automatically: that could change branching semantics.
export function surveyStructureErrors(survey) {
  const errors = [];
  const questions = survey && survey.questions;
  if (!Array.isArray(questions) || !questions.length) return ['questions に設問を指定してください。'];
  if (questions.some(q => !object(q))) return ['設問はJSONオブジェクトで指定してください。'];
  const types = ['header', 'footer', 'open', 'single', 'multi', 'likert', 'blanks', 'duration', 'slider'];
  if (questions[0].type !== 'header' || questions.filter(q => q.type === 'header').length !== 1)
    errors.push('先頭に開始画面（type: header）を1つ配置してください。');
  if (questions[questions.length - 1].type !== 'footer' || questions.filter(q => q.type === 'footer').length !== 1)
    errors.push('末尾に回答確認・送信画面（type: footer）を1つ配置してください。');
  if (!questions.some(q => types.includes(q.type) && !['header', 'footer'].includes(q.type)))
    errors.push('回答する設問を1つ以上配置してください。');
  questions.forEach((q, position) => {
    const label = `questions[${position}]（index: ${q.index}）`;
    if (q.index !== position) errors.push(`${label}: indexは配列順に0から始まる連番にしてください。`);
    if (!types.includes(q.type)) errors.push(`${label}: 未対応のtype「${q.type}」です。`);
    if (['single', 'multi'].includes(q.type) && (!Array.isArray(q.values) || !q.values.length || q.values.some(v => typeof v !== 'string' || !v.trim())))
      errors.push(`${label}: 空でない選択肢（values）が必要です。`);
    if (q.skip && (!Number.isInteger(q.skip.goto) || q.skip.goto <= q.index || !questions.some(t => t.index === q.skip.goto)))
      errors.push(`${label}: skip.gotoは後方の存在する設問または送信画面を指定してください（自己参照・逆戻りは不可）。`);
    if (q.includeIf) {
      const target = questions.find(t => t.index === q.includeIf.ifIndex);
      if (!target || target.index >= q.index || !['single', 'multi', 'likert', 'blanks'].includes(target.type))
        errors.push(`${label}: includeIf.ifIndexは手前の選択式設問を指定してください。`);
    }
    if (['header', 'footer'].includes(q.type) && (q.skip || q.includeIf))
      errors.push(`${label}: 開始・送信画面には分岐条件を設定できません。`);
  });
  return errors;
}
