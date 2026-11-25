# Gatehood — Residential Construction Mobile App

Gatehood solves the broken communication channel in residential construction projects. Instead of cluttered, unread WhatsApp groups, Gatehood provides targeted milestone updates, verification of who has read what, and real-time construction progress for buyers across towers and units.

Built with **React Native**, **Expo (Expo Router)**, and **Firebase Firestore (Modular SDK v9+)** in **pure JavaScript**. Runs seamlessly on Android and iOS through **Expo Go**.

---

## 1. Prerequisites

- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm** or **yarn**
- **Expo Go App**: Installed on your physical Android or iOS device from Google Play Store or Apple App Store (or an Android Emulator / iOS Simulator).
- **Firebase Project**: A Google Firebase project with Firestore and Anonymous Authentication enabled.

---

## 2. Setting Up Firebase

### Step 1: Create Firebase Project
1. Visit the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project**, name it `Gatehood` (or your preferred name), and complete creation.

### Step 2: Enable Anonymous Authentication
1. In the Firebase Console, navigate to **Build > Authentication**.
2. Click **Get Started**, switch to the **Sign-in method** tab.
3. Select **Anonymous**, toggle **Enable**, and click **Save**.

### Step 3: Create Firestore Database
1. In the Firebase Console, navigate to **Build > Firestore Database**.
2. Click **Create database**, choose your preferred location (e.g. `nam5` or `asia-south1`), and start in **Production mode**.

### Step 4: Register Web App
1. Go to **Project Settings** (gear icon) > **General**.
2. Under *Your apps*, click the **Web (`</>`)** icon.
3. Register the app as `Gatehood App` and copy the configuration credentials (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).

---

## 3. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Open `.env` and fill in your Firebase values:
```ini
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:...

# Builder PIN for accessing the project dashboard
EXPO_PUBLIC_BUILDER_PIN=4826

# Active Project Document ID
EXPO_PUBLIC_PROJECT_ID=gatehood-residences
```

> **Security Note**: `.env` and any service account keys are gitignored. Do not commit actual credentials.

---

## 4. Deploying Firestore Rules & Indexes

Install the Firebase CLI if you haven't already:
```bash
npm install -g firebase-tools
firebase login
firebase use your-project-id
```

Deploy the security rules and composite indexes:
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 5. Running the Seed Script

The seed script populates your Firestore database with:
- 1 residential project (`gatehood-residences`) with possession date and progress percentage
- 3 towers (Tower A, B, C) with ~100 units (2BHK / 3BHK)
- Unique buyer invite codes for all units (format `A1204-7KQ`, with 30-day expiration)
- 1 expired test invite code (`A101-EXP`)
- 1 already-used test invite code (`B202-USD`)
- 65+ milestone notices with mixed audiences (Project-wide, Tower-specific, Unit-specific), some pinned, spread across past dates.

Run:
```bash
npm run seed
```

*(Optional: Set `GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json` if running against production Firestore with restricted Admin SDK permissions).*

---

## 6. Running the App with Expo Go

Start the Expo development server:
```bash
npx expo start
```

### On Android or iOS:
1. Open the **Expo Go** app on your phone.
2. Scan the QR code displayed in your terminal (or press `a` for Android Emulator, `i` for iOS Simulator, or `w` for Web).

---

## 7. Test Invite Codes & Credentials

| Role / Test Case | Code / PIN | Target / Expected Behavior |
| :--- | :--- | :--- |
| **Builder Access** | PIN: `4826` | Full builder dashboard: Residents overview, CSV import, invite code list, compose notice, and "not read" viewer. |
| **Valid Buyer (Tower A)** | `A101-2KQ` *(check seed output)* | Unit A-101 (2BHK) dashboard, construction ring, days to possession, and updates feed. |
| **Valid Buyer (Tower B)** | `B1002-8HY` *(check seed output)* | Unit B-1002 (3BHK) dashboard, tower-specific updates, and personal notices. |
| **Valid Buyer (Tower C)** | `C1204-9TR` *(check seed output)* | Unit C-1204 (3BHK) dashboard. |
| **Expired Code** | `A101-EXP` | Shows distinct inline error: *"This invite code has expired. Please contact the project builder for a new code."* |
| **Already Used Code** | `B202-USD` | Shows distinct inline error: *"This invite code has already been redeemed."* |
| **Invalid Code** | `XXXX-999` | Shows distinct inline error: *"Invalid invite code. Please verify and try again."* |

---

## 8. Architecture & Design Highlights

### Two Distinct Design Modes (Light & Dark UI)
Shared components switch theme objects, shapes, fonts, and layouts cleanly via `ThemeProvider` (`src/theme.js`):
- **Light UI (Airy, Rounded)**:
  - Colors: White background (`#ffffff`), surface `#f5f5f5`, line `#e6e6e6`, red `#e11d2e`.
  - Typography: **Sora** (600, 700, 800) for headings/numbers; **DM Sans** (400, 500, 700) for body.
  - Shapes: Large card radius (26px), button radius (30px).
  - Floating pill bottom navigation with red active indicator pill.
  - White Hero card with 2px black border and red SVG progress ring.
- **Dark UI (Sharp, High Contrast)**:
  - Colors: Pure black background (`#000000`), surface `#111111`, line `#2a2a2a`, red `#ff2d3f`.
  - Typography: **Space Grotesk** (500, 700) for headings/numbers; **Inter** (400, 500, 600) for body.
  - Shapes: Crisp card radius (10px), button radius (14px).
  - Flat full-width bottom navigation with 1px top border and 3px red active tab top edge.
  - Solid red Hero card with white text and white SVG progress ring.

### Buyer Flow
1. **Join Screen**: Transactional invite redemption linking anonymous `uid` to unit and tower.
2. **My Unit**: Live construction progress ring, days to possession counter, floor/config stat tiles, and latest pinned update.
3. **Updates Feed**: Filters (`All` / `My tower` / `My unit`), unread dot indicators, read cards dimmed to 70%, live sync via `onSnapshot`, 15-per-page cursor infinite scroll, and automatic read marking upon opening.

### Builder Flow
1. **CSV Import**: Uses `expo-document-picker` and `papaparse` to bulk-import buyer rows (`tower, unit, name, phone`), validate input, skip duplicates, and generate unambiguous invite codes.
2. **Residents Overview**: Joined vs Pending stats, tower completion progress bars, and full drill-down modal.
3. **Codes List & Share**: Modal with all generated codes and 1-tap `expo-sharing` integration.
4. **Compose Notice**: Target everyone, selected towers, or specific units, with pin-to-top toggle.
5. **Notices & "Not Read" Viewer**: Track read counts in real-time (`241 of 287 read`), toggle pin on the fly, and inspect on-demand lists of residents who haven't opened the notice.

### Offline & Resilience
- **Persistent Local Cache**: Firestore indexed offline cache keeps previous feeds accessible without connectivity.
- **Offline Banner**: Detected using `@react-native-community/netinfo`, rendering a top banner: *"Offline, showing saved feed"*.
- **States**: Skeleton pulsing placeholders, custom SVG building illustrations for empty states, and Error Cards with Retry buttons.
