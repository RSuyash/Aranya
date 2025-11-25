# Architecture & Data Safety Strategy

**Goal**: Ensure data is never lost, works perfectly offline, and can scale to a cloud backend.

## 1. Offline-First Architecture (The Core)

### A. Local Storage (Dexie.js)
*   **Technology**: IndexedDB wrapper (Dexie.js).
*   **Why**: High performance, supports complex queries, works 100% offline.
*   **Database Name**: `ProjectTerraDB_v1`.
*   **Stores**:
    *   `projects`: `id, name, syncStatus`
    *   `modules`: `id, projectId, type`
    *   `plots`: `id, projectId, moduleId, syncStatus`
    *   `treeObservations`: `id, projectId, moduleId, plotId, syncStatus`
    *   `vegetationObservations`: `id, projectId, moduleId, plotId, syncStatus`
    *   `speciesList`: `id, projectId, moduleId, scientificName`
    *   `media`: `id, relatedId, type, thumbnailPath, fullResPath, syncStatus`
    *   `samplingUnits`: `id, projectId, plotId, moduleId`

    **Optimization**: Add composite indexes for efficient sync queries:
    *   `treeObservations`: `[syncStatus+lastModifiedAt]`
    *   `plots`: `[syncStatus+lastModifiedAt]`
    *   // Note: Additional indexes (e.g., `modules: [projectId+type]`) can be added per query needs.

### B. Image Handling (Two-Tier Storage)
To prevent IndexedDB quota issues (~500MB cap):
1.  **Thumbnails (<200KB)**: Stored in IndexedDB (`thumbnailPath` as Blob/Base64) for fast gallery rendering.
2.  **Full Resolution**: Stored via File System Access API (`fullResPath` as handle/URL) for scientific documentation.

### C. Sync Strategy (Future Backend)
*   **Pattern**: "Last Write Wins" (Simple) or "Conflict Resolution" (Advanced).
*   **Metadata**: Every entity has `SyncMeta`:
    ```typescript
    interface SyncMeta {
      syncStatus: 'LOCAL_ONLY' | 'SYNCED' | 'DIRTY' | 'CONFLICT';
      lastModifiedAt: number;
      lastModifiedBy: string; // Device ID
      remoteId?: string; // UUID from server
    }
    ```
*   **Flow**:
    1.  **Push**: Client finds all `DIRTY` records -> POST/PUT to API -> Server confirms -> Client sets `SYNCED`.
    2.  **Pull**: Client requests changes: `GET /sync/pull?projectId=...&since=lastSyncTimestamp`. Server returns delta + new `serverSyncTimestamp`.

### D. Auto-Sync Rules (Background)
*   **Triggers**:
    *   Every 30 minutes (if online).
    *   On Project Open/Close.
    *   On App Minimize.
*   **Behavior**:
    *   Queue uploads (never block UI).
    *   Retry with exponential backoff on failure.

### E. Conflict Resolution
1.  **Auto-Merge**: If modified fields do not overlap, merge automatically.
2.  **User-Assisted**: If fields overlap (e.g., two users edited "GBH"), mark as `CONFLICT` and prompt user to resolve.
3.  **Audit Log**: Track all changes for science traceability.
    ```typescript
    interface AuditLog {
      changedAt: number;
      changedBy: string;
      field: string;
      oldValue: any;
      newValue: any;
    }
    ```

    **Conflict UI Spec**:
    *   "Resolve Conflict":
        *   🔘 Keep Mine (timestamp)
        *   🔘 Use Teammate’s
        *   🔘 Compare Changes (Diff Viewer)

---

## 2. Data Safety (The "Lifeboat")

**Goal**: If the device breaks or the app is uninstalled, data must survive.

### A. Manual Export (The "Zip Package")
*   **Format**: A single `.zip` file containing:
    1.  `project.json`: Full project metadata and hierarchy.
    2.  `plots.csv`: Flat table of all plots.
    3.  `trees.csv`: Flat table of all tree observations.
    4.  `vegetation.csv`: Flat table of subplot data.
    5.  `images/`: Folder containing full-resolution images (renamed by ID).
    *   **Version Tag**: `backupVersion: "terra-export-v1"` (Embedded in JSON for backward compatibility).
*   **Trigger**: User manually clicks "Export Backup" (Recommended daily).
*   **Destination**: Device File System (Downloads folder) or Share Sheet (Google Drive, WhatsApp).

### B. CSV Import (Restoration)
*   **Logic**: The app can parse the "Zip Package" and re-populate the Dexie DB.
*   **Conflict**: If importing into an existing project, prompt: "Overwrite" or "Skip Duplicates".

---

## 3. Future Backend & GIS

### A. API Design (REST/GraphQL)
*   **Endpoints**:
    *   `POST /sync/push`: Batch upload of dirty records.
    *   `GET /sync/pull`: Get delta changes.
    *   `POST /media/upload`: Multipart upload for images.

### B. GIS Integration
*   **Export Formats**:
    *   **KML/KMZ**: For Google Earth. Points for plots, polygons for boundaries.
    *   **GeoJSON**: For QGIS/ArcGIS. Rich attributes included in `properties`.
*   **Spatial Database**: PostGIS (Server-side) to store plot geometries for advanced spatial queries.

---

## 4. Security & Privacy (Enterprise Grade)
*   **Local Encryption**: Encrypt PII (Surveyor Name, Collaborator IDs) at rest.
*   **Auth**: Offline signed JWT with expiration fallback to read-only mode.
    *   *Fallback*: If expired & offline -> Read-Only access (View/Export). Mutating actions blocked until online re-auth.
*   **Media**: End-to-end encryption for sensitive imagery uploads.

### Permissions Model (Future)
*   **Roles**: `OWNER` | `EDITOR` | `VIEWER`
*   **Capabilities**:
    *   `canEditPlots`: EDITOR, OWNER
    *   `canExport`: ALL
    *   `canManageUsers`: OWNER
