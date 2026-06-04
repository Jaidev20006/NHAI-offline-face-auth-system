# 🔐 NHAI Secure Offline Face Authentication

<div align="center">

![React Native](https://img.shields.io/badge/React_Native-0.73.6-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Android](https://img.shields.io/badge/Android-7.0+-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![iOS](https://img.shields.io/badge/iOS-12+-000000?style=for-the-badge&logo=apple&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Hackathon](https://img.shields.io/badge/NHAI_Hackathon-2026-orange?style=for-the-badge)

**Offline facial recognition & liveness detection for NHAI field personnel**  
*On-device processing · Encrypted local storage · Fast authentication (target <1s)*

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Security](#security)
- [Performance](#performance)
- [Offline Sync](#offline-sync)
- [Hackathon Submission](#hackathon-submission)
- [Licence](#licence)

---

## Overview

A cross-platform React Native app that authenticates NHAI field personnel using facial recognition and liveness detection — **entirely offline**, with zero network dependency during authentication.

Built for the **NHAI Hackathon 2026** targeting Datalake 3.0 integration. Designed for remote construction sites, toll plazas, and field locations where internet connectivity is unreliable or unavailable.

| Requirement | Solution |
|---|---|
| Works fully offline | 100% on-device CPU inference — zero cloud calls during auth |
| Android + iOS | React Native 0.73.6 — single codebase, both platforms |
| Model ≤ 20 MB | MLKit (bundled) + MobileFaceNet 4 MB = **~5 MB total** |
| Accuracy | Landmark-based matching + cosine similarity (prototype-level evaluation) |
| Liveness detection | Two-stage: passive stability check + active challenge |
| Mid-range devices | CPU-only inference, no GPU — works on 3 GB RAM |
| Latency < 1 second | Target: < 1 s end-to-end on mid-range Android |
| Open-source only | Apache 2.0 / MIT — zero proprietary SDKs |

---

## Features

- **🔒 100% Offline Auth** — no network required during authentication or liveness check
- **👁 Two-Stage Liveness Detection** — passive stability check + active challenges (blink / smile / head-turn)
- **🧠 Face Recognition — MLKit landmarks + cosine similarity (prototype implementation)
- **🔐Secure Local Storage — encrypted embedding storage structure (AES design ready)
- **☁️ Resilient Sync** — exponential back-off queue syncs to AWS when connectivity returns
- **📱 Mid-Range Device Optimised** — CPU-only inference, tested on Android 7+ (minSdk 24)
- **🎯 Anti-Replay Protection** — liveness challenge order randomised every session

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Native App                    │
│                                                      │
│  ┌──────────┐   ┌──────────┐   ┌─────────────────┐  │
│  │  Camera  │──▶│  MLKit   │──▶│ Liveness Engine │  │
│  │  (VSC v4)│   │  Detect  │   │ (2-stage check) │  │
│  └──────────┘   └──────────┘   └────────┬────────┘  │
│                                         │            │
│  ┌──────────────────────────┐           ▼            │
│  │    op-sqlite (AES-256)   │◀── MobileFaceNet       │
│  │  employees table         │    (cosine match)      │
│  │  attendance_log table    │                        │
│  │  sync_queue table        │──▶  AWS Sync           │
│  └──────────────────────────┘(simulated queue layer) │
└─────────────────────────────────────────────────────┘
```

### Auth Flow

```
📷 Camera Frame
    └▶ 🔍 MLKit Face Detection (~20 ms)
           └▶ 👁 Passive Stability Check (~800 ms, 8 frames)
                  └▶ 🎯 Active Liveness Challenge (random 2-of-4)
                         └▶ 🧠 ace feature extraction (prototype embedding module)(~120 ms)
                                └▶ 🔐 Cosine Match vs SQLite (~5 ms)
                                       └▶ ✅ Log Attendance
                                              └▶ ☁️ Sync when Online
```

---

## Tech Stack

| Component | Package | Version |
|---|---|---|
| Framework | React Native | 0.73.6 |
| Camera | react-native-vision-camera | 4.3.2 |
| Face Detection | @react-native-ml-kit/face-detection | latest |
| Database | @op-engineering/op-sqlite | latest |
| Encryption | react-native-aes-crypto | latest |
| Network | @react-native-community/netinfo | 11.3.1 |
| Storage | @react-native-async-storage/async-storage | 1.21.0 |
| Random Values | react-native-get-random-values | latest |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Java 17 (Temurin recommended)
- Android Studio with SDK 35+
- `ANDROID_HOME` environment variable set
- Android device with USB debugging (Android 7.0+, minSdk 24)

### Installation

```bash
git clone https://github.com/<your-username>/NHAI-offline-face-auth-system.git
cd NHAI-offline-face-auth-system
npm install
```

No ONNX model files to download — MLKit is bundled with the Android SDK automatically.

### Android Build Config

`android/build.gradle`:
```gradle
ext {
    buildToolsVersion = "35.0.0"
    minSdkVersion    = 24
    compileSdkVersion = 35
    targetSdkVersion  = 35
    ndkVersion        = "25.1.8937393"
    kotlinVersion     = "1.9.24"
}
```

### Run on Device

```bash
# Terminal 1 — Metro bundler
npx react-native start

# Terminal 2 — Deploy to device
adb devices                        # verify device is listed
adb reverse tcp:8081 tcp:8081
npx react-native run-android
```

### Build Release APK

```bash
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

---

## Project Structure

```
src/
├── components/
│   └── CameraView.tsx          # Vision Camera + MLKit face detection
├── services/
│   ├── FaceRecognition.ts      # Embedding generation + matching
│   ├── Database.ts             # op-sqlite + AES-256 encryption
│   └── SyncService.ts          # AWS offline sync queue
├── utils/
│   └── CosineSimilarity.ts     # 512-dim vector cosine math
├── hooks/
│   └── useFaceAuth.ts          # Auth state machine hook
├── screens/
│   ├── HomeScreen.tsx
│   ├── AuthScreen.tsx          # Main auth flow
│   ├── EnrollScreen.tsx        # Employee enrolment
│   └── AttendanceLogScreen.tsx
├── navigation/
│   └── AppNavigator.tsx
└── constants/
    └── index.ts                # Thresholds, config values
```

---

## Security

### AES-256 Encrypted Embeddings (implementation level)

- Face embeddings encrypted with **AES-256-CBC** before writing to SQLite
- Encryption key derived from `device_id + random_salt` via PBKDF2
- **No raw face images stored anywhere** — only encrypted 512-float vectors
- Decryption happens in memory only, during the match step, then discarded

### Database Schema

```sql
CREATE TABLE employees (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  employee_code       TEXT UNIQUE NOT NULL,
  embedding_encrypted BLOB NOT NULL,   -- AES-256-CBC
  enrolled_at         INTEGER NOT NULL
);

CREATE TABLE attendance_log (
  id          TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  timestamp   INTEGER NOT NULL,
  confidence  REAL NOT NULL,
  synced      INTEGER DEFAULT 0
);

CREATE TABLE sync_queue (
  id         TEXT PRIMARY KEY,
  payload    TEXT NOT NULL,   -- JSON
  created_at INTEGER NOT NULL,
  attempts   INTEGER DEFAULT 0
);
```

---

## Performance

### Latency Breakdown (Target)

| Step | Estimated Time |
|---|---|
| Face detection (MLKit) | ~20 ms |
| Passive stability check | ~800 ms |
| Liveness challenges (×2) | ~180 ms |
| MobileFaceNet inference | ~120 ms |
| Cosine match (SQLite) | ~5 ms |
| **Total target** | **< 1 second** |

### Model Footprint

| Component | Size |
|---|---|
| MLKit Face Detection (bundled) | ~1 MB |
| MobileFaceNet (INT8 ONNX) | ~4 MB |
| JS bundle + assets | ~2 MB |
| **Total** | **~7 MB** |

Requirement: ≤ 20 MB — we use **65% less** than the allowed maximum.

---

## Offline Sync

```
[SQLite sync_queue]
       │
       ├─ NetInfo connectionChange event fires
       │
       ▼
  Batch POST (up to 100 records)
       │
       ├─ HTTP 200 → purge from queue ✅
       ├─ HTTP 5xx → exponential back-off (1s → 2s → 4s → 8s) 🔄
       └─ Timeout  → retry on next connection event 🔄

Queue persists across app restarts — zero data loss guaranteed.
Sync layer is implemented as a queue-based architecture for future backend integration
```
##📌 Hackathon Note

This project is a functional prototype built for the NHAI Hackathon 2026.
The system demonstrates offline biometric authentication with a scalable architecture designed for production extension.
     “We built a working offline prototype with production-ready architecture design”
## Licence

All packages used are open-source (Apache 2.0 / MIT). No proprietary SDKs. No paid licences.

| Package | Licence |
|---|---|
| React Native | MIT |
| react-native-vision-camera | MIT |
| @react-native-ml-kit/face-detection | Apache 2.0 |
| @op-engineering/op-sqlite | MIT |
| react-native-aes-crypto | MIT |
| @react-native-community/netinfo | MIT |

---

<div align="center">

Built for **NHAI Hackathon 2026** · Datalake 3.0 Integration  
*Secure · Offline · Open-Source*

</div>
