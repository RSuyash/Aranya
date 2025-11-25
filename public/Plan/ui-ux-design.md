# UI/UX Design Specification: Project Terra

**Philosophy**: "Scientific Premium". The interface should feel like a high-end scientific instrument—precise, dark-mode first, and distraction-free. It must be usable in bright sunlight (high contrast) and low light (dark mode).

## 1. Visual Language

### A. Color Palette (Dark Mode Default)
*   **Backgrounds**:
    *   `--bg-app`: `#050814` (Deep Space Blue/Black) - Main background.
    *   `--bg-panel`: `#0b1020` (Dark Navy) - Cards and panels.
    *   `--bg-panel-soft`: `#11182b` - Hover states / secondary panels.
*   **Accents**:
    *   `--primary`: `#56ccf2` (Cyan) - Primary actions, active states.
    *   `--success`: `#52d273` (Neon Green) - "Completed", "Verified".
    *   `--warning`: `#f2c94c` (Amber) - "Soft Warning", "Missing Photo".
    *   `--danger`: `#ff7e67` (Coral Red) - "Delete", "Critical Error".
*   **Text**:
    *   `--text-main`: `#f5f7ff` (Off-white) - High legibility.
    *   `--text-muted`: `#9ba2c0` (Blue-grey) - Labels, secondary info.
*   **Borders/Separators**:
    *   `--border`: `#1d2440` (Subtle blue-grey).

### B. Typography
*   **Font Family**: `Inter` or `system-ui`. Clean, sans-serif, tabular figures for data.
*   **Hierarchy**:
    *   `H1`: 24px, Uppercase, Tracking +1px (Page Titles).
    *   `H2`: 18px, Semibold (Section Headers).
    *   `Body`: 14px/16px (Readability focus).
    *   `Data`: 13px, Monospace (Coordinates, IDs).

### C. Components (Glassmorphism & Depth)
*   **Cards**: Subtle border (`1px solid rgba(255,255,255,0.08)`), slight backdrop blur if overlaying map.
*   **Inputs**: Large touch targets (>44px height). High contrast borders.
*   **Feedback**: Micro-interactions on tap (ripple or scale).

### D. Status Badges (Standardized)
*   **PLANNED**: Grey (Neutral).
*   **IN PROGRESS**: Blue (Pulsing dot).
*   **COMPLETED**: Green (Solid).
*   **VALIDATION REQUIRED**: Amber (Outlined).
*   **ERROR / CONFLICT**: Red (Solid/Icon).

### E. System Feedback
*   **Confirmation**: Toast (Bottom-Left, auto-dismiss).
*   **Validation Warning**: Inline text (Amber) or Input Border.
*   **Critical Alert**: Modal (Center, requires action).
*   **Offline State**: Persistent Banner (Top, "Working Offline").

---

## 2. Wireframes: Key Screens

### A. Project Dashboard (The Hub)
**Goal**: Overview of all scientific modules and their status.

*   **Header**: Project Name, "Sync Status" (Green Dot), "Settings" Gear.
*   **Grid Layout**:
    *   **Module Card (Vegetation)**:
        *   Icon: 🌳 (Tree/Leaf).
        *   Title: "Vegetation Plots".
        *   Stats: "12/40 Plots Done".
        *   Progress Bar: 30% filled.
        *   Action: "Open Module".
    *   **Module Card (Birds)**:
        *   Icon: 🐦 (Bird).
        *   Title: "Bird Surveys" (Planned).
        *   Status: "Coming Soon" (Greyed out).
*   **FAB (Floating Action Button)**: "+" (Add Module / Add Plot - Context sensitive).

### B. Plot Visualizer (The Grid)
**Goal**: Spatial orientation and rapid navigation.

*   **Top Bar**: Plot Code ("P-101"), GPS Accuracy ("3m"), "Back" arrow.
*   **Main Canvas (The Game Board)**:
    *   Renders the `PlotNodeInstance` tree.
    *   **Quadrants**: Large squares (NW, NE, SE, SW).
        *   *Color Coding*: Grey (Empty), Blue (In Progress), Green (Done).
        *   *Content*: "Q1 (NW)" label in center.
    *   **Subplots**: Smaller nested shapes.
    *   **Interactions**:
        *   Tap Quadrant -> Opens "Quadrant Details" (Bottom Sheet or Slide-over).
        *   Pinch -> Zoom.
*   **Bottom Bar**:
    *   Tabs: "Map" | "List View" | "Gallery".

### C. Data Entry (Field Optimized)
**Goal**: Speed and accuracy. Minimize typing.

*   **Tree Form (Stepper)**:
    1.  **Step 1: ID**:
        *   Input: "Tag Number" (Numeric keypad).
        *   Input: "Species" (Searchable Dropdown with "Recent" list).
        *   Toggle: "Unknown?" (If checked, prompts for photo).
    2.  **Step 2: Metrics**:
        *   Input: "GBH (cm)" (Numeric).
        *   Button: "+ Add Stem" (For multi-stem).
        *   Input: "Height (m)" (Slider or Numeric).
    3.  **Step 3: Photos**:
        *   Large Buttons: "[Camera Icon] Bark", "[Camera Icon] Leaf".
        *   Thumbnail preview after capture.
    4.  **Step 4: Save**:
        *   Big "Save Tree" button.
        *   Auto-advances to next tree entry or returns to list.

    *   **Photo Capture Rule**:
        *   Flow: Tap Camera -> Capture -> Auto-resize -> Auto-tag -> Return.
        *   *Optional AI*: "Detected: Terminalia arjuna (Low confidence)".

*   **Soft Warnings (Modal)**:
    *   If "Save" clicked without Photo:
    *   *Modal*: "Leaf Photo Missing. This is required for validation."
    *   *Actions*: "Take Photo" (Primary) | "Save Anyway" (Secondary, Red text).

---

## 3. Interaction & Gestures (Field UX)
**Goal**: Reduce taps and improve speed.

*   **Pinch**: Zoom Map.
*   **Long Press (Quadrant)**: Quick Tree Entry (Bypasses list).
*   **Swipe Left (Tree Item)**: Delete / Archive.
*   **Double Tap (Map)**: Center on GPS Location.

---

## 4. Responsive Behavior
*   **Mobile (Field)**: Stacked layouts, bottom navigation, full-screen forms.
*   **Desktop (Lab - QA/QC)**:
    *   **Split-View Mode**:
        *   *Left*: Spatial Map / Photo Gallery.
        *   *Right*: Data Table (Editable) / Attribute Form.
    *   Perfect for rapid validation of incoming field data.
