import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import Papa from 'papaparse';
import { db, DEFAULT_PROJECT_ID } from '../firebase';
import { generateRandomCodeSuffix } from '../utils/codeGenerator';
import { MOCK_PROJECT, generateMockUnits } from './mockData';

let cachedLocalUnits = null;

export async function fetchProjectDetails(pid = DEFAULT_PROJECT_ID) {
  if (db) {
    try {
      const projRef = doc(db, 'projects', pid);
      const snap = await getDoc(projRef);
      if (snap.exists()) {
        return snap.data();
      }
    } catch {
    }
  }

  return {
    ...MOCK_PROJECT,
    possessionDate: Timestamp.fromDate(new Date(MOCK_PROJECT.possessionDate)),
  };
}

export async function fetchBuyerUnitDetails(pid = DEFAULT_PROJECT_ID, unitId) {
  if (!unitId) return null;
  if (db) {
    try {
      const unitRef = doc(db, 'projects', pid, 'units', unitId);
      const snap = await getDoc(unitRef);
      if (snap.exists()) {
        return snap.data();
      }
    } catch {
    }
  }

  const [tower, unit] = unitId.split('-');
  return {
    tower: tower || 'A',
    unit: unit || '1204',
    config: '3BHK',
    buyerName: 'Resident ' + unitId,
    phone: '+91 9812345678',
    joined: true,
  };
}

export function calculateDaysToPossession(possessionDate) {
  if (!possessionDate) return 142;
  try {
    const target = possessionDate.toDate ? possessionDate.toDate() : new Date(possessionDate);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  } catch {
    return 142;
  }
}

export async function fetchResidentsOverview(pid = DEFAULT_PROJECT_ID) {
  let units = [];
  if (db) {
    try {
      const unitsCol = collection(db, 'projects', pid, 'units');
      const q = query(unitsCol, orderBy('unit', 'asc'));
      const snap = await getDocs(q);
      units = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch {
    }
  }

  if (units.length === 0) {
    if (!cachedLocalUnits) {
      cachedLocalUnits = generateMockUnits();
    }
    units = cachedLocalUnits;
  }

  const byTower = {};
  let totalJoined = 0;
  let totalPending = 0;

  units.forEach((u) => {
    const t = u.tower || 'A';
    if (!byTower[t]) {
      byTower[t] = {
        tower: t,
        total: 0,
        joined: 0,
        pending: 0,
        units: [],
      };
    }
    byTower[t].total += 1;
    if (u.joined) {
      byTower[t].joined += 1;
      totalJoined += 1;
    } else {
      byTower[t].pending += 1;
      totalPending += 1;
    }
    byTower[t].units.push(u);
  });

  return {
    totalUnits: units.length,
    totalJoined,
    totalPending,
    towers: Object.values(byTower).sort((a, b) => a.tower.localeCompare(b.tower)),
    allUnits: units,
  };
}

export async function fetchAllInviteCodes(pid = DEFAULT_PROJECT_ID) {
  if (db) {
    try {
      const invitesCol = collection(db, 'invites');
      const snap = await getDocs(invitesCol);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ code: d.id, ...d.data() }));
      }
    } catch {
    }
  }

  return [
    { code: 'A1204-7KQ', unitId: 'A-1204', tower: 'A', unit: '1204', usedBy: null },
    { code: 'A101-2KQ', unitId: 'A-101', tower: 'A', unit: '101', usedBy: null },
    { code: 'B1002-8HY', unitId: 'B-1002', tower: 'B', unit: '1002', usedBy: null },
    { code: 'C1204-9TR', unitId: 'C-1204', tower: 'C', unit: '1204', usedBy: null },
    { code: 'B202-USD', unitId: 'B-202', tower: 'B', unit: '202', usedBy: 'uid-test' },
    { code: 'A101-EXP', unitId: 'A-101', tower: 'A', unit: '101', usedBy: null },
  ];
}

export async function importBuyersFromCSV(csvString, pid = DEFAULT_PROJECT_ID) {
  return new Promise((resolve, reject) => {
    Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data;
          const errors = [];
          const validRows = [];
          const seenInCsv = new Set();

          const existingUnitKeys = new Set();
          if (db) {
            try {
              const unitsCol = collection(db, 'projects', pid, 'units');
              const existingSnap = await getDocs(unitsCol);
              existingSnap.docs.forEach((d) => existingUnitKeys.add(d.id));
            } catch {
            }
          }

          rows.forEach((row, index) => {
            const rowNum = index + 2;
            const tower = String(row.tower || row.Tower || '').trim().toUpperCase();
            const unit = String(row.unit || row.Unit || '').trim();
            const name = String(row.name || row.Name || row.buyerName || '').trim();
            const phone = String(row.phone || row.Phone || '').trim();

            if (!tower || !['A', 'B', 'C', 'D', 'E'].includes(tower)) {
              errors.push(`Row ${rowNum}: Invalid or missing Tower "${tower}". Must be A, B, C, etc.`);
              return;
            }
            if (!unit) {
              errors.push(`Row ${rowNum}: Missing Unit number.`);
              return;
            }
            if (!name) {
              errors.push(`Row ${rowNum}: Missing Buyer Name.`);
              return;
            }

            const unitKey = `${tower}-${unit}`;
            if (seenInCsv.has(unitKey)) {
              errors.push(`Row ${rowNum}: Duplicate unit ${unitKey} in CSV. Skipped.`);
              return;
            }
            if (existingUnitKeys.has(unitKey)) {
              errors.push(`Row ${rowNum}: Unit ${unitKey} already exists in project. Skipped.`);
              return;
            }

            seenInCsv.add(unitKey);
            validRows.push({
              tower,
              unit,
              name,
              phone: phone || 'N/A',
              unitId: unitKey,
            });
          });

          const createdInvites = [];
          if (validRows.length > 0) {
            if (db) {
              try {
                const batch = writeBatch(db);
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 30);

                validRows.forEach((item) => {
                  const unitRef = doc(db, 'projects', pid, 'units', item.unitId);
                  batch.set(unitRef, {
                    tower: item.tower,
                    unit: item.unit,
                    config: item.unit.endsWith('2') || item.unit.endsWith('4') ? '3BHK' : '2BHK',
                    buyerName: item.name,
                    phone: item.phone,
                    joined: false,
                    uid: null,
                  });

                  const code = `${item.tower}${item.unit}-${generateRandomCodeSuffix(3)}`;
                  const inviteRef = doc(db, 'invites', code);
                  batch.set(inviteRef, {
                    pid,
                    unitId: item.unitId,
                    tower: item.tower,
                    unit: item.unit,
                    usedBy: null,
                    usedAt: null,
                    expiresAt: Timestamp.fromDate(expiresAt),
                  });

                  createdInvites.push({
                    code,
                    unitId: item.unitId,
                    buyerName: item.name,
                    phone: item.phone,
                  });
                });

                await batch.commit();
              } catch {
                validRows.forEach((item) => {
                  const code = `${item.tower}${item.unit}-${generateRandomCodeSuffix(3)}`;
                  createdInvites.push({
                    code,
                    unitId: item.unitId,
                    buyerName: item.name,
                    phone: item.phone,
                  });
                });
              }
            } else {
              validRows.forEach((item) => {
                const code = `${item.tower}${item.unit}-${generateRandomCodeSuffix(3)}`;
                createdInvites.push({
                  code,
                  unitId: item.unitId,
                  buyerName: item.name,
                  phone: item.phone,
                });
              });
            }
          }

          resolve({
            totalRows: rows.length,
            importedCount: validRows.length,
            errors,
            createdInvites,
          });
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err),
    });
  });
}
