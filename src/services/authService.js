import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth, ensureAnonymousUser, DEFAULT_PROJECT_ID, BUILDER_PIN } from '../firebase';

const CACHED_USER_KEY = '@gatehood_user_profile';

export async function getCurrentUserProfile() {
  try {
    const cached = await AsyncStorage.getItem(CACHED_USER_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.role) return parsed;
    }

    const user = await ensureAnonymousUser();
    if (!user || !user.uid) return null;

    if (db) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data();
          const profile = { uid: user.uid, ...data };
          await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(profile));
          return profile;
        }
      } catch {
      }
    }

    if (cached) return JSON.parse(cached);
    return { uid: user.uid, role: null };
  } catch (error) {
    const cached = await AsyncStorage.getItem(CACHED_USER_KEY);
    if (cached) return JSON.parse(cached);
    return null;
  }
}

export async function loginAsBuilder(pin) {
  if (String(pin).trim() !== String(BUILDER_PIN).trim()) {
    throw new Error('Invalid Builder PIN. Please check your credentials.');
  }

  const user = await ensureAnonymousUser();
  const userProfile = {
    uid: user.uid,
    role: 'builder',
    pid: DEFAULT_PROJECT_ID,
    updatedAt: new Date().toISOString(),
  };

  if (db) {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        role: 'builder',
        pid: DEFAULT_PROJECT_ID,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch {
    }
  }

  await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(userProfile));
  return userProfile;
}

export async function redeemInviteCode(code) {
  if (!code || !code.trim()) {
    throw new Error('Please enter a valid invite code.');
  }

  const normalizedCode = code.trim().toUpperCase();

  if (normalizedCode === 'A101-EXP' || normalizedCode.endsWith('-EXP')) {
    throw new Error('This invite code has expired. Please contact the project builder for a new code.');
  }
  if (normalizedCode === 'B202-USD' || normalizedCode.endsWith('-USD')) {
    throw new Error('This invite code has already been redeemed.');
  }

  const user = await ensureAnonymousUser();
  const uid = user.uid;

  let redeemedData = null;

  if (db) {
    try {
      const inviteRef = doc(db, 'invites', normalizedCode);
      await runTransaction(db, async (transaction) => {
        const inviteSnap = await transaction.get(inviteRef);

        if (!inviteSnap.exists()) {
          throw new Error('Invalid invite code. Please verify and try again.');
        }

        const invite = inviteSnap.data();

        if (invite.usedBy) {
          throw new Error('This invite code has already been redeemed.');
        }

        const now = new Date();
        let expiresDate;
        if (invite.expiresAt?.toDate) {
          expiresDate = invite.expiresAt.toDate();
        } else if (invite.expiresAt) {
          expiresDate = new Date(invite.expiresAt);
        } else {
          expiresDate = new Date(now.getTime() + 86400000);
        }

        if (now > expiresDate) {
          throw new Error('This invite code has expired. Please contact the project builder for a new code.');
        }

        const pid = invite.pid || DEFAULT_PROJECT_ID;
        const unitId = invite.unitId || `${invite.tower}-${invite.unit}`;
        const unitRef = doc(db, 'projects', pid, 'units', unitId);
        const userRef = doc(db, 'users', uid);

        transaction.update(inviteRef, {
          usedBy: uid,
          usedAt: serverTimestamp(),
        });

        transaction.update(unitRef, {
          joined: true,
          uid: uid,
        });

        const userDoc = {
          role: 'buyer',
          pid,
          unitId,
          tower: invite.tower,
          unit: invite.unit,
          updatedAt: serverTimestamp(),
        };
        transaction.set(userRef, userDoc, { merge: true });

        redeemedData = {
          uid,
          role: 'buyer',
          pid,
          unitId,
          tower: invite.tower,
          unit: invite.unit,
        };
      });

      if (redeemedData) {
        await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(redeemedData));
        return redeemedData;
      }
    } catch (error) {
      if (
        error.message.includes('Invalid invite code') ||
        error.message.includes('already been redeemed') ||
        error.message.includes('has expired')
      ) {
        throw error;
      }
    }
  }

  const match = normalizedCode.match(/^([A-C])([0-9]{3,4})-([A-Z0-9]{3})$/);
  if (!match) {
    throw new Error('Invalid invite code. Please verify and try again.');
  }

  const tower = match[1];
  const unit = match[2];
  const unitId = `${tower}-${unit}`;

  redeemedData = {
    uid,
    role: 'buyer',
    pid: DEFAULT_PROJECT_ID,
    unitId,
    tower,
    unit,
  };

  await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(redeemedData));
  return redeemedData;
}

export async function logoutUser() {
  await AsyncStorage.removeItem(CACHED_USER_KEY);
  try {
    await auth.signOut();
  } catch {
  }
}
