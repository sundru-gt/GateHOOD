export const MOCK_PROJECT = {
  name: 'Gatehood Sky Residences',
  possessionDate: new Date(Date.now() + 142 * 24 * 60 * 60 * 1000).toISOString(),
  progressPct: 74,
};

export const MOCK_TOWERS = ['A', 'B', 'C'];

export function generateMockUnits() {
  const units = [];
  MOCK_TOWERS.forEach((tower) => {
    for (let u = 1; u <= 34; u++) {
      const floor = Math.floor((u - 1) / 4) + 1;
      const unitInFloor = ((u - 1) % 4) + 1;
      const unitNum = `${floor}${unitInFloor < 10 ? '0' : ''}${unitInFloor}`;
      const unitId = `${tower}-${unitNum}`;
      const config = unitInFloor % 2 === 0 ? '3BHK' : '2BHK';
      const isJoined = (tower === 'A' && u <= 18) || (tower === 'B' && u <= 14) || (tower === 'C' && u <= 10);

      units.push({
        id: unitId,
        tower,
        unit: unitNum,
        config,
        buyerName: isJoined ? `Resident ${tower}-${unitNum}` : 'Pending Buyer',
        phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
        joined: isJoined,
        uid: isJoined ? `uid-${unitId}` : null,
      });
    }
  });
  return units;
}

export const MOCK_SAMPLE_NOTICES = [
  {
    id: 'notice-1',
    title: 'Tower A 14th Slab Pouring Completed Successfully',
    body: 'We are pleased to inform all residents that the 14th floor structural slab pouring for Tower A was completed today following structural QA signoff.',
    audience: { type: 'towers', towers: ['A'], units: [] },
    audienceKeys: ['tower:A', 'all'],
    pinned: true,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    readCount: 28,
    targetCount: 34,
  },
  {
    id: 'notice-2',
    title: 'Clubhouse & Swimming Pool Structural Framework Initiated',
    body: 'Excavation and foundation pile testing for the central clubhouse and infinity lap pool have commenced. Anticipated completion by Q3.',
    audience: { type: 'all', towers: [], units: [] },
    audienceKeys: ['all'],
    pinned: true,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    readCount: 78,
    targetCount: 102,
  },
  {
    id: 'notice-3',
    title: 'Tower B & C Internal Plastering Schedule Announced',
    body: 'Internal plastering and electrical conduit laying will progress between floors 4 through 9 starting next Monday.',
    audience: { type: 'towers', towers: ['B', 'C'], units: [] },
    audienceKeys: ['tower:B', 'tower:C'],
    pinned: false,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    readCount: 42,
    targetCount: 68,
  },
  {
    id: 'notice-4',
    title: 'High-Speed Schindler Elevator Installation Kickoff',
    body: 'Shaft preparatory works and bracket installation for the passenger and stretcher elevators have begun in all three towers.',
    audience: { type: 'all', towers: [], units: [] },
    audienceKeys: ['all'],
    pinned: true,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    readCount: 65,
    targetCount: 102,
  },
  {
    id: 'notice-5',
    title: 'Plumbing & Pressure Testing: Tower A Floors 1 to 5',
    body: 'Hydrostatic pressure testing of CPVC water lines will occur this Wednesday. Buyers with custom fitting approvals please review specs.',
    audience: { type: 'towers', towers: ['A'], units: [] },
    audienceKeys: ['tower:A'],
    pinned: false,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    readCount: 19,
    targetCount: 34,
  },
  {
    id: 'notice-6',
    title: 'Unit Finishing & Tile Sample Selection Notification',
    body: 'Sample master bath Italian marble and vitrified floor tiles are ready for physical inspection at the site experience center.',
    audience: { type: 'units', towers: [], units: ['A-1204', 'B-1002'] },
    audienceKeys: ['unit:A-1204', 'unit:B-1002'],
    pinned: false,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    readCount: 1,
    targetCount: 2,
  },
  {
    id: 'notice-7',
    title: 'Fire Suppression Pipeline Grid Inspection Completed',
    body: 'The municipal fire department inspection committee reviewed the basement level sprinklers and riser mains with zero non-compliances.',
    audience: { type: 'all', towers: [], units: [] },
    audienceKeys: ['all'],
    pinned: false,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    readCount: 54,
    targetCount: 102,
  },
  {
    id: 'notice-8',
    title: 'Double-Glazed UPVC Window Fitting Commencing',
    body: 'Acoustic thermal soundproof double glazed sliding windows will be installed across all east-facing apartments this month.',
    audience: { type: 'all', towers: [], units: [] },
    audienceKeys: ['all'],
    pinned: false,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    readCount: 49,
    targetCount: 102,
  },
];