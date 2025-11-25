## 1. Versioning & Backwards Compatibility (for *everything*, not just blueprints)

Right now you’ve thought about versioning for PlotBlueprints (in the engine doc), but not for:

* Project protocols
* Observation forms
* Validation rules

### Why this matters long-term

* In Year 3, someone will change the “Tree > 30 cm GBH” rule to 20 cm.
* Or they’ll add new required fields.
* You’ll want to know which plots/observations used which **protocol version**.

### Minimal long-term addition

Add a **protocolVersion** on Plot and (optionally) Observations:

```ts
interface Project {
  ...
  protocolVersion?: number; // increments when rules/validation change
}

interface Plot {
  ...
  protocolVersion?: number; // the version in effect when this plot was created
}
```

If you ever change `strataRules`, `validationSettings`, or “what’s required in forms”, bump `protocolVersion`.

This lets future-you say: “Plots created under version 1 had GBH threshold 30cm, version 2 uses 20cm”, and adjust analysis accordingly.

---

## 2. Data Provenance & Audit Trail

Right now you have `createdAt`, `updatedAt`, and `surveyorId` on TreeObservation. That’s good, but long-term:

* You might need to know **who edited what, when**.
* For sensitive datasets or big collaborations, you’ll want a minimal audit log.

### Long-term pattern: lightweight change log

Optional new table:

```ts
interface ChangeLogEntry {
  id: string;           // UUID
  entityType: 'PLOT' | 'TREE_OBSERVATION' | 'VEG_OBSERVATION' | 'PROJECT';
  entityId: string;
  projectId: string;

  // Simple “what happened”
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT';
  changedBy?: string;   // userId or surveyorId
  changedAt: number;    // epochMillis

  // Optional: minimal diff blob, highly compressed / partial
  diff?: any;
}
```

You don’t have to store full diffs forever, but at least:

* who touched an entity
* when
* what type of action

This is gold later for debugging, QA, and trust.

---

## 3. Permission Model & Multi-User Reality

Right now `Project` has:

```ts
ownerId: string;
collaborators: { id: string; name: string }[];
```

That’s enough for single-team friendly use. Long-term you might need:

* “Some collaborators can edit, some can only view.”
* Temporary field assistants with restricted permissions.

### Extension idea

Not urgent, but future-friendly:

```ts
type Role = 'OWNER' | 'EDITOR' | 'VIEWER';

interface ProjectMember {
  id: string;    // user ID
  name: string;
  role: Role;
}

interface Project {
  ...
  ownerId: string;
  ownerName: string;
  collaborators: ProjectMember[];
}
```

You can *still* treat this as simple in the UI now (everyone is EDITOR), but the schema doesn’t block you later.

---

## 4. Taxonomy Evolution & Name Changes

Your `predefinedSpeciesList` + `speciesListId` + denormalized `speciesName` is a good balance.

Long-term issues:

* Names change (synonyms, splits, lumps).
* You may want to map to global IDs (e.g., GBIF, iNat, local floras).

### Possible long-term addition to `predefinedSpeciesList` entries

```ts
predefinedSpeciesList?: {
  id: string;
  scientificName: string;
  commonName: string;
  family?: string;
  type: 'TREE' | 'SHRUB' | 'HERB' | 'ALL';
  externalIds?: {
    gbifId?: string;
    iNaturalistId?: string;
    localFloraCode?: string;
  };
  // Optional status: to deprecate with replacement
  status?: 'ACTIVE' | 'DEPRECATED';
  replacedById?: string; // points to another speciesList entry
}[];
```

This gives you a **long-term path** to:

* Keep old observations unchanged.
* Migrate or map to updated names during analysis.

---

## 5. Units, Locales, and Internationalization

Right now everything is implicitly:

* cm for GBH
* m for height
* metric for coordinates
* English labels

That’s fine for you, but long-term:

* You may collaborate with teams using inches, feet, etc.
* Or need multilingual UIs while data stays numeric.

### Long-term config home

You could extend `Project` with:

```ts
interface Project {
  ...
  measurementSystem?: 'METRIC' | 'IMPERIAL';
  locale?: string; // e.g. "en-IN", "fr-FR"
}
```

The data model can always stay metric internally (strongly recommended), but this gives you a **place to encode user expectations** for the UI and exports.

---

## 6. Stronger Typing for `customAttributes` (when mature)

You already left a note:

```ts
customAttributes: Record<string, any>; 
// Note: Can be tightened later.
```

When Project Terra gets older and more “productionized”, I’d tighten it to:

```ts
type CustomValue = string | number | boolean | null;

customAttributes: Record<string, CustomValue>;
```

and augment `customPlotAttributes` to include:

```ts
customPlotAttributes: {
  key: string;
  label: string;
  inputType: 'text' | 'number' | 'select' | 'boolean';
  options?: string[];
  required?: boolean;
}[];
```

This lets you:

* Validate custom attributes more reliably.
* Prevent people from stuffing entire objects into a “custom” field.

Not mandatory now, but a great long-term direction.

---

## 7. Sync & Conflict Resolution (beyond SyncMeta)

You already planned:

```ts
type SyncStatus = 'LOCAL_ONLY' | 'SYNCED' | 'DIRTY';
interface SyncMeta {
  syncStatus: SyncStatus;
  remoteId?: string;
  lastSyncedAt?: number;
}
```

Long-term, offline + multi-device implies **conflicts**:

* Same TreeObservation edited on two devices before sync.

At the schema level, you might eventually want a **device identifier**:

```ts
interface SyncMeta {
  syncStatus: SyncStatus;
  remoteId?: string;
  lastSyncedAt?: number;
  lastChangedByDeviceId?: string; // helps debugging conflicts
}
```

The actual conflict resolution logic is business logic, not schema, but this is a nice trace.

---

## 8. Analysis Layer vs Raw Layer

Right now your schema is entirely **raw field data**. That’s good.

Long-term, to keep things clean, I’d consider:

* Keeping this “Data Model Blueprint” as the **raw layer** (immutable except corrections).
* Having a separate **analysis / derived data layer** (e.g., `PlotSummary`, `SpeciesDiversityMetrics`, etc.).

Example:

```ts
interface PlotSummary {
  id: string;
  projectId: string;
  plotId: string;
  totalTrees: number;
  totalSpecies: number;
  shannonIndex?: number;
  basalAreaM2PerHa?: number;
  computedAt: number;
}
```

These are *derived* and can always be recomputed, so you don’t pollute your core schema with analysis-specific fields later.

---

## 9. “Soft Deletion” for Safety

At some point someone will delete a plot or an observation **by mistake**.

You might eventually want:

```ts
interface BaseEntity {
  isDeleted?: boolean;
  deletedAt?: number;
}
```

and apply that pattern logically rather than actually removing rows.

Not urgent, but a very common long-term hardening step.

---

## So… do you *need* more changes right now?

No.

Your current schema is:

* Internally consistent
* Extensible
* Tied cleanly to your Plot Engine and field workflows
* Already thinking about sync & future constraints

The things above are **long-term evolution hooks**, not “you did it wrong”.

If you want a practical next step, I’d suggest:

* Keep this doc as your **“Core Data Model – Raw Layer”**.
* Add a **separate doc** called “Future Extensions & Governance” where you paste things like:

  * Protocol versioning
  * Permissions
  * Taxonomy external IDs
  * Soft-deletion
  * Analysis-layer entities

So the current model can be **implemented now**, and the long-term brain keeps living next to it, not inside it.
