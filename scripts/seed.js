const fs = require('fs');
const path = require('path');

const hasGoogleCreds = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
const localKeyPath = path.resolve(__dirname, '../serviceAccountKey.json');
const hasLocalKey = fs.existsSync(localKeyPath);

if (hasGoogleCreds || hasLocalKey) {
  runAdminSeed();
} else {
  console.log('No service account key found; running seed via Web Client SDK using .env...');
  require('./seed-client.js');
}

function runAdminSeed() {
  const admin = require('firebase-admin');
  if (hasGoogleCreds) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'gatehood-residences',
    });
  } else {
    const rawKey = fs.readFileSync(localKeyPath, 'utf8');
    const serviceAccount = JSON.parse(rawKey);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const db = admin.firestore();
  console.log('Running seed via Firebase Admin SDK...');
}