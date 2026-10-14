// Public Firebase Web configuration only; never put service-account keys here.
export function parseFirebaseConfig(text, expectedProject) {
  if (!text || !expectedProject) throw new Error('Firebase configuration is required');
  const config = JSON.parse(text);
  if (!config || Array.isArray(config) || typeof config !== 'object') throw new Error('Invalid Firebase configuration');
  if (Object.keys(config).some(key => !['apiKey','authDomain','projectId','storageBucket','databaseURL','messagingSenderId','appId','measurementId'].includes(key))) throw new Error('Unexpected Firebase configuration field');
  for (const key of ['apiKey', 'authDomain', 'projectId', 'appId']) {
    if (typeof config[key] !== 'string' || !config[key].trim()) throw new Error('Missing Firebase field: ' + key);
  }
  if (config.projectId !== expectedProject) throw new Error('Firebase project mismatch');
  return config;
}
export const firebaseConfig = parseFirebaseConfig(process.env.VUE_APP_FIREBASE_CONFIG, process.env.VUE_APP_FIREBASE_PROJECT_ID);
