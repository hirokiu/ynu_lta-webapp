// The legacy path is only for accounts not yet migrated. Server/network failures
// must never silently switch authentication methods.
async function passwordLogin({loginId, password, base, auth, request = fetch}) {
  const name = loginId.trim();
  if (!name || !password) throw new Error('ログインIDとパスワードを入力してください。');
  const legacy = () => auth.signInWithEmailAndPassword(name.includes('@') ? name : name + '@humlablu.com', password);
  if (name.includes('@')) return legacy();
  const options = await request(base + '/auth/options', {cache: 'no-store'});
  if (options.status === 404) return legacy(); // Known older API, before capabilities existed.
  if (!options.ok) throw new Error('ログイン設定を確認できません。時間をおいて再試行してください。');
  const policy = await options.json();
  if (!policy || typeof policy.usernameLogin !== 'boolean') throw new Error('ログイン設定を確認できません。');
  if (!policy.usernameLogin) return legacy();
  const response = await request(base + '/auth/username-login', {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username: name, password})
  });
  if (response.status === 401) return legacy();
  if (!response.ok) throw new Error(response.status === 429
    ? '試行回数が多いため、10分後に再試行してください。'
    : 'ログインを処理できません。時間をおいて再試行してください。');
  const data = await response.json();
  if (!data || typeof data.customToken !== 'string' || !data.customToken) throw new Error('ログインを処理できません。');
  return auth.signInWithCustomToken(data.customToken);
}
module.exports = {passwordLogin};
