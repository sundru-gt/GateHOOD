import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, DEFAULT_PROJECT_ID } from '../firebase';
import { MOCK_SAMPLE_NOTICES, generateMockUnits } from './mockData';

const CACHED_FEED_PREFIX = '@gatehood_cached_feed_';
let localNotices = [...MOCK_SAMPLE_NOTICES];

export function getBuyerAudienceKeys(tower, unit, filter = 'all') {
  const allKey = 'all';
  const towerKey = `tower:${tower}`;
  const unitKey = `unit:${tower}-${unit}`;

  if (filter === 'tower') {
    return [towerKey];
  }
  if (filter === 'unit') {
    return [unitKey];
  }
  return [allKey, towerKey, unitKey];
}

export async function fetchBuyerFeed({
  pid = DEFAULT_PROJECT_ID,
  tower = 'A',
  unit = '1204',
  filter = 'all',
  lastDoc = null,
  pageSize = 15,
}) {
  const audienceKeys = getBuyerAudienceKeys(tower, unit, filter);

  try {
    const noticesCol = collection(db, 'projects', pid, 'notices');

    let pinnedList = [];
    if (!lastDoc) {
      try {
        const pinnedQuery = query(
          noticesCol,
          where('audienceKeys', 'array-contains-any', audienceKeys),
          where('pinned', '==', true),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const pinnedSnap = await getDocs(pinnedQuery);
        pinnedList = pinnedSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (err) {
        console.warn('Pinned query fallback:', err.message);
      }
    }

    let unpinnedQuery;
    if (lastDoc) {
      unpinnedQuery = query(
        noticesCol,
        where('audienceKeys', 'array-contains-any', audienceKeys),
        where('pinned', '==', false),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );
    } else {
      unpinnedQuery = query(
        noticesCol,
        where('audienceKeys', 'array-contains-any', audienceKeys),
        where('pinned', '==', false),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
    }

    const unpinnedSnap = await getDocs(unpinnedQuery);
    const unpinnedList = unpinnedSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const newLastDoc = unpinnedSnap.docs.length > 0 ? unpinnedSnap.docs[unpinnedSnap.docs.length - 1] : null;

    const combined = lastDoc ? unpinnedList : [...pinnedList, ...unpinnedList];

    if (combined.length > 0) {
      const cacheKey = `${CACHED_FEED_PREFIX}${tower}_${unit}_${filter}`;
      AsyncStorage.setItem(cacheKey, JSON.stringify(combined)).catch(() => {});
      return {
        notices: combined,
        lastDoc: newLastDoc,
        hasMore: unpinnedSnap.docs.length >= pageSize,
        isFromCache: false,
      };
    }
  } catch (err) {
    console.warn('Firestore feed unavailable, using resilient fallback notices:', err.message);
  }

  const filtered = localNotices.filter((n) => {
    return n.audienceKeys?.some((k) => audienceKeys.includes(k));
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return {
    notices: sorted,
    lastDoc: null,
    hasMore: false,
    isFromCache: true,
  };
}

export function subscribeToBuyerFeed({
  pid = DEFAULT_PROJECT_ID,
  tower = 'A',
  unit = '1204',
  filter = 'all',
  onUpdate,
  onError,
}) {
  const audienceKeys = getBuyerAudienceKeys(tower, unit, filter);

  try {
    const noticesCol = collection(db, 'projects', pid, 'notices');
    const q = query(
      noticesCol,
      where('audienceKeys', 'array-contains-any', audienceKeys),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          const sorted = list.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
            return timeB - timeA;
          });
          onUpdate(sorted);
        }
      },
      (err) => {
        console.warn('Live subscription unavailable:', err.message);
        if (onError) onError(err);
      }
    );
  } catch {
    return () => {};
  }
}

export async function fetchBuyerReadStatus({ pid = DEFAULT_PROJECT_ID, noticeIds = [], uid }) {
  if (!uid || !noticeIds.length) return {};

  const readMap = {};
  try {
    const cachedReads = await AsyncStorage.getItem(`@reads_${uid}`);
    if (cachedReads) {
      Object.assign(readMap, JSON.parse(cachedReads));
    }
  } catch {
  }

  const promises = noticeIds.map(async (nid) => {
    try {
      const readRef = doc(db, 'projects', pid, 'notices', nid, 'reads', uid);
      const snap = await getDoc(readRef);
      if (snap.exists()) {
        readMap[nid] = true;
      }
    } catch {
    }
  });

  await Promise.all(promises);
  return readMap;
}

export async function markNoticeAsRead({ pid = DEFAULT_PROJECT_ID, nid, uid }) {
  if (!uid || !nid) return;

  try {
    const cachedReads = JSON.parse((await AsyncStorage.getItem(`@reads_${uid}`)) || '{}');
    cachedReads[nid] = true;
    await AsyncStorage.setItem(`@reads_${uid}`, JSON.stringify(cachedReads));
  } catch {
  }

  try {
    const readRef = doc(db, 'projects', pid, 'notices', nid, 'reads', uid);
    const noticeRef = doc(db, 'projects', pid, 'notices', nid);
    const existingSnap = await getDoc(readRef);
    if (!existingSnap.exists()) {
      await setDoc(readRef, {
        readAt: serverTimestamp(),
        uid,
      });
      await updateDoc(noticeRef, {
        readCount: increment(1),
      }).catch(() => {});
    }
  } catch {
    const target = localNotices.find((n) => n.id === nid);
    if (target) {
      target.readCount = (target.readCount || 0) + 1;
    }
  }
}

export async function fetchBuilderNotices({ pid = DEFAULT_PROJECT_ID }) {
  try {
    const noticesCol = collection(db, 'projects', pid, 'notices');
    const q = query(noticesCol, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
  } catch {
  }

  return localNotices;
}

export async function toggleNoticePin({ pid = DEFAULT_PROJECT_ID, nid, currentPinned }) {
  try {
    const noticeRef = doc(db, 'projects', pid, 'notices', nid);
    await updateDoc(noticeRef, { pinned: !currentPinned });
  } catch {
    const item = localNotices.find((n) => n.id === nid);
    if (item) item.pinned = !currentPinned;
  }
  return !currentPinned;
}

export async function composeNotice({
  pid = DEFAULT_PROJECT_ID,
  title,
  body,
  audience,
  pinned = false,
  targetCount = 100,
}) {
  const audienceKeys = [];

  if (audience.type === 'all') {
    audienceKeys.push('all');
  } else if (audience.type === 'towers') {
    audience.towers.forEach((t) => audienceKeys.push(`tower:${t}`));
  } else if (audience.type === 'units') {
    audience.units.forEach((u) => audienceKeys.push(`unit:${u}`));
  }

  const noticeData = {
    id: `notice-local-${Date.now()}`,
    title: title.trim(),
    body: body.trim(),
    createdAt: new Date().toISOString(),
    pinned: Boolean(pinned),
    audience,
    audienceKeys,
    readCount: 0,
    targetCount: Number(targetCount) || 1,
  };

  try {
    const noticesCol = collection(db, 'projects', pid, 'notices');
    const newDocRef = doc(noticesCol);
    await setDoc(newDocRef, { ...noticeData, createdAt: serverTimestamp() });
    noticeData.id = newDocRef.id;
  } catch (err) {
    console.warn('Saved notice to local cache (Firestore offline):', err.message);
  }

  localNotices.unshift(noticeData);
  return noticeData;
}

export async function fetchNotReadList({ pid = DEFAULT_PROJECT_ID, notice }) {
  if (!notice) return [];

  try {
    const readsCol = collection(db, 'projects', pid, 'notices', notice.id, 'reads');
    const readsSnap = await getDocs(readsCol);
    const readerUids = new Set(readsSnap.docs.map((d) => d.id));

    const unitsCol = collection(db, 'projects', pid, 'units');
    let targetedUnitsQuery = query(unitsCol);

    if (notice.audience?.type === 'towers' && notice.audience.towers?.length > 0) {
      targetedUnitsQuery = query(unitsCol, where('tower', 'in', notice.audience.towers));
    }

    const unitsSnap = await getDocs(targetedUnitsQuery);
    if (!unitsSnap.empty) {
      const notReadList = [];
      unitsSnap.docs.forEach((d) => {
        const unit = { id: d.id, ...d.data() };
        if (notice.audience?.type === 'units') {
          if (!notice.audience.units.includes(unit.id) && !notice.audience.units.includes(`${unit.tower}-${unit.unit}`)) {
            return;
          }
        }
        if (!unit.uid || !readerUids.has(unit.uid)) {
          notReadList.push(unit);
        }
      });
      return notReadList;
    }
  } catch {
  }

  const mockUnits = generateMockUnits();
  return mockUnits
    .filter((u) => {
      if (notice.audience?.type === 'towers' && notice.audience.towers?.length > 0) {
        return notice.audience.towers.includes(u.tower);
      }
      if (notice.audience?.type === 'units' && notice.audience.units?.length > 0) {
        return notice.audience.units.includes(u.id);
      }
      return true;
    })
    .slice(0, Math.max(1, notice.targetCount - (notice.readCount || 0)));
}