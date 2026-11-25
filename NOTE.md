# Gatehood Architecture Note

### Data Model
- `projects/{pid}`: Global milestones, possession date, completion percentage.
- `projects/{pid}/units/{unitId}`: Tower, unit, config (`2BHK`/`3BHK`), buyer details, join status, claimed `uid`.
- `invites/{code}`: Unique invite code (`A1204-7KQ`), expiration timestamp, unit link, `usedBy`.
- `projects/{pid}/notices/{nid}`: Milestone update, pinned flag, audience, `audienceKeys`, `readCount`, `targetCount`.
- `projects/{pid}/notices/{nid}/reads/{uid}`: Idempotent reader receipt with `readAt`.
- `users/{uid}`: Profile binding role (`builder` | `buyer`), project ID, unit.

### Feed Query
Uses `array-contains-any` on `audienceKeys` matching `['all', 'tower:X', 'unit:X-NNNN']`, filtered by All/My tower/My unit. To overcome Firestore index limits with cursor pagination, two queries run concurrently: one for all pinned notices, and one paginated (15/batch) unpinned query ordered by `createdAt desc`. Results merge client-side with pinned items on top.

### Read Counts at Scale
Clients never increment shared document counters directly to avoid Firestore's 1 write/sec limit. Instead, buyers write an idempotent receipt to `reads/{uid}`. A Cloud Function (or distributed 10-shard counter) increments `readCount`. The unread list is dynamically computed by querying targeted units and subtracting readers on demand.

### Security Rules
- Buyers only read notices matching their assigned `audienceKeys`.
- Buyers can only create their own `reads/{uid}` document once.
- Invites redeem only if unused and unexpired in a transaction.
- Builders have exclusive write access to notices, units, and invites.

### Trade-offs
Dual-query feed merging increases client roundtrips slightly but guarantees pinned-first ordering alongside cursor pagination without heavy fan-out feeds.
