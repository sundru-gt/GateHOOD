const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
const {
  getFirestore,
  doc,
  collection,
  writeBatch,
  Timestamp,
  serverTimestamp,
} = require('firebase/firestore');

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [k, ...v] = trimmed.split('=');
        if (k && v) {
          process.env[k.trim()] = v.join('=').trim();
        }
      }
    });
  }
}

loadEnv();

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const pid = process.env.EXPO_PUBLIC_PROJECT_ID || 'gatehood-residences';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const UNAMBIGUOUS_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateRandomCodeSuffix(length = 3) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += UNAMBIGUOUS_CHARS.charAt(Math.floor(Math.random() * UNAMBIGUOUS_CHARS.length));
  }
  return result;
}

const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Ananya', 'Arjun', 'Dev', 'Diya', 'Ishaan', 'Kavya',
  'Manish', 'Neha', 'Pooja', 'Rahul', 'Rohan', 'Sneha', 'Tanvi', 'Vikram',
  'Priya', 'Amit', 'Sunita', 'Sanjay', 'Rajesh', 'Deepa', 'Suresh', 'Anita',
  'Kiran', 'Meera', 'Naveen', 'Ritu', 'Sameer', 'Shweta', 'Varun', 'Geeta'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Mehta', 'Nair', 'Kapoor', 'Gupta',
  'Bhatia', 'Iyer', 'Deshmukh', 'Chopra', 'Malhotra', 'Joshi', 'Menon', 'Rao'
];

function getRandomName() {
  const f = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const l = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${f} ${l}`;
}

function getRandomPhone() {
  return `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`;
}

async function seed() {
  console.log(`Connecting to Firebase project: ${firebaseConfig.projectId}...`);
  let uid = 'builder-seed-admin';
  try {
    const cred = await signInAnonymously(auth);
    uid = cred.user.uid;
    console.log(`Authenticated anonymously as UID: ${uid}`);
  } catch (err) {
    console.log(`Anonymous auth not active in Firebase console (${err.code}). Using local builder UID.`);
  }

  const userRef = doc(db, 'users', uid);
  let batch = writeBatch(db);
  batch.set(userRef, {
    role: 'builder',
    pid,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();

  const possessionDate = new Date();
  possessionDate.setDate(possessionDate.getDate() + 142);

  batch = writeBatch(db);
  const projectRef = doc(db, 'projects', pid);
  batch.set(projectRef, {
    name: 'Gatehood Sky Residences',
    possessionDate: Timestamp.fromDate(possessionDate),
    progressPct: 74,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
  console.log(`Created Project: ${pid}`);

  const towers = ['A', 'B', 'C'];
  const unitsPerTower = 34;
  const allUnits = [];
  const inviteCodes = [];

  batch = writeBatch(db);
  let opCount = 0;

  for (const tower of towers) {
    for (let u = 1; u <= unitsPerTower; u++) {
      const floor = Math.floor((u - 1) / 4) + 1;
      const unitInFloor = ((u - 1) % 4) + 1;
      const unitNum = `${floor}${unitInFloor < 10 ? '0' : ''}${unitInFloor}`;
      const unitId = `${tower}-${unitNum}`;
      const config = unitInFloor % 2 === 0 ? '3BHK' : '2BHK';
      const buyerName = getRandomName();
      const phone = getRandomPhone();

      const unitDocRef = doc(db, 'projects', pid, 'units', unitId);
      const unitData = {
        tower,
        unit: unitNum,
        config,
        buyerName,
        phone,
        joined: false,
        uid: null,
      };

      allUnits.push({ id: unitId, ...unitData });
      batch.set(unitDocRef, unitData);
      opCount++;

      const code = `${tower}${unitNum}-${generateRandomCodeSuffix(3)}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const inviteRef = doc(db, 'invites', code);
      const inviteData = {
        pid,
        unitId,
        tower,
        unit: unitNum,
        usedBy: null,
        usedAt: null,
        expiresAt: Timestamp.fromDate(expiresAt),
      };

      inviteCodes.push({ code, ...inviteData });
      batch.set(inviteRef, inviteData);
      opCount++;

      if (opCount >= 300) {
        await batch.commit();
        batch = writeBatch(db);
        opCount = 0;
      }
    }
  }

  const expiredCode = 'A101-EXP';
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 10);
  batch.set(doc(db, 'invites', expiredCode), {
    pid,
    unitId: 'A-101',
    tower: 'A',
    unit: '101',
    usedBy: null,
    usedAt: null,
    expiresAt: Timestamp.fromDate(pastDate),
  });

  const usedCode = 'B202-USD';
  const usedExpires = new Date();
  usedExpires.setDate(usedExpires.getDate() + 20);
  batch.set(doc(db, 'invites', usedCode), {
    pid,
    unitId: 'B-202',
    tower: 'B',
    unit: '202',
    usedBy: 'test-user-buyer-uid-123',
    usedAt: Timestamp.fromDate(new Date()),
    expiresAt: Timestamp.fromDate(usedExpires),
  });

  batch.update(doc(db, 'projects', pid, 'units', 'B-202'), {
    joined: true,
    uid: 'test-user-buyer-uid-123',
  });

  await batch.commit();
  console.log(`Created ${allUnits.length} units and ${inviteCodes.length + 2} invite codes.`);

  const sampleNotices = [
    {
      title: 'Tower A 14th Slab Pouring Completed Successfully',
      body: 'We are pleased to inform all residents that the 14th floor structural slab pouring for Tower A was completed today following structural QA signoff.',
      audience: { type: 'towers', towers: ['A'], units: [] },
      audienceKeys: ['tower:A'],
      pinned: true,
    },
    {
      title: 'Clubhouse & Swimming Pool Structural Framework Initiated',
      body: 'Excavation and foundation pile testing for the central clubhouse and infinity lap pool have commenced. Anticipated completion by Q3.',
      audience: { type: 'all', towers: [], units: [] },
      audienceKeys: ['all'],
      pinned: true,
    },
    {
      title: 'Tower B & C Internal Plastering Schedule Announced',
      body: 'Internal plastering and electrical conduit laying will progress between floors 4 through 9 starting next Monday.',
      audience: { type: 'towers', towers: ['B', 'C'], units: [] },
      audienceKeys: ['tower:B', 'tower:C'],
      pinned: false,
    },
    {
      title: 'High-Speed Schindler Elevator Installation Kickoff',
      body: 'Shaft preparatory works and bracket installation for the passenger and stretcher elevators have begun in all three towers.',
      audience: { type: 'all', towers: [], units: [] },
      audienceKeys: ['all'],
      pinned: true,
    },
    {
      title: 'Plumbing & Pressure Testing: Tower A Floors 1 to 5',
      body: 'Hydrostatic pressure testing of CPVC water lines will occur this Wednesday. Buyers with custom fitting approvals please review specs.',
      audience: { type: 'towers', towers: ['A'], units: [] },
      audienceKeys: ['tower:A'],
      pinned: false,
    },
    {
      title: 'Unit Finishing & Tile Sample Selection Notification',
      body: 'Sample master bath Italian marble and vitrified floor tiles are ready for physical inspection at the site experience center.',
      audience: { type: 'units', towers: [], units: ['A-1204', 'B-1002'] },
      audienceKeys: ['unit:A-1204', 'unit:B-1002'],
      pinned: false,
    },
    {
      title: 'Fire Suppression Pipeline Grid Inspection Completed',
      body: 'The municipal fire department inspection committee reviewed the basement level sprinklers and riser mains with zero non-compliances.',
      audience: { type: 'all', towers: [], units: [] },
      audienceKeys: ['all'],
      pinned: false,
    },
    {
      title: 'Double-Glazed UPVC Window Fitting Commencing',
      body: 'Acoustic thermal soundproof double glazed sliding windows will be installed across all east-facing apartments this month.',
      audience: { type: 'all', towers: [], units: [] },
      audienceKeys: ['all'],
      pinned: false,
    },
  ];

  batch = writeBatch(db);
  opCount = 0;
  const totalNoticesToCreate = 65;

  for (let i = 0; i < totalNoticesToCreate; i++) {
    const template = sampleNotices[i % sampleNotices.length];
    const daysAgo = Math.floor((i * 55) / totalNoticesToCreate);
    const noticeDate = new Date();
    noticeDate.setDate(noticeDate.getDate() - daysAgo);
    noticeDate.setHours(noticeDate.getHours() - (i % 12));

    const nid = `notice-${i + 1}`;
    const noticeRef = doc(db, 'projects', pid, 'notices', nid);

    let targetCount = allUnits.length;
    if (template.audience.type === 'towers') {
      targetCount = template.audience.towers.length * unitsPerTower;
    } else if (template.audience.type === 'units') {
      targetCount = template.audience.units.length;
    }
    const readCount = Math.floor(targetCount * (0.35 + Math.random() * 0.55));

    const noticeData = {
      title: `${template.title} #${i + 1}`,
      body: `${template.body} This notice was issued on milestone cycle ${i + 1}.`,
      createdAt: Timestamp.fromDate(noticeDate),
      pinned: i < 5 ? true : (i % 14 === 0),
      audience: template.audience,
      audienceKeys: template.audienceKeys,
      readCount,
      targetCount,
    };

    batch.set(noticeRef, noticeData);
    opCount++;

    if (opCount >= 300) {
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
    }
  }

  await batch.commit();
  console.log(`Created ${totalNoticesToCreate} notices spread over past 60 days.`);

  console.log('\n======================================================');
  console.log('SEED COMPLETED SUCCESSFULLY IN LIVE FIRESTORE');
  console.log('======================================================');
  console.log('TEST INVITE CODES:');
  console.log('------------------------------------------------------');
  console.log(`1. VALID (Tower A):   ${inviteCodes[0]?.code} (Unit ${inviteCodes[0]?.unitId})`);
  console.log(`2. VALID (Tower B):   ${inviteCodes[35]?.code} (Unit ${inviteCodes[35]?.unitId})`);
  console.log(`3. VALID (Tower C):   ${inviteCodes[70]?.code} (Unit ${inviteCodes[70]?.unitId})`);
  console.log(`4. EXPIRED CODE:      ${expiredCode} (Should show "expired" error)`);
  console.log(`5. ALREADY USED CODE: ${usedCode} (Should show "already used" error)`);
  console.log('======================================================\n');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error during client seed:', err);
    process.exit(1);
  });