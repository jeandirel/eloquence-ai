# 📘 OmniSense AI - Documentation Technique

**Version:** 2.0.0
**Date:** Janvier 2026
**Auteur:** OmniSense Team

---

## 1. Introduction

**OmniSense AI** est une plateforme d'interaction multimodale temps-réel conçue pour démontrer le futur des Interfaces Homme-Machine (HCI). Elle fusionne trois modalités principales pour créer une expérience empathique et naturelle :
1.  **Vision (Gestes & Regard):** Contrôle sans contact.
2.  **Affective Computing (Emotions):** Adaptation de l'interface à l'état émotionnel.
3.  **Vocal (Audio):** Analyse de l'intention et de la tonalité (en cours).

L'architecture repose sur des micro-services asynchrones orchestrés par un hub central.

---

## 2. Architecture Système

Le système suit une architecture **Micro-services Event-Driven**.

### Diagramme de Flux (Data Pipeline)

```mermaid
graph TD
    Client[🖥️ Frontend (Next.js)] <-->|WebSocket Binary/JSON| Orch[🧠 Orchestrator (FastAPI)]
    
    subgraph "Backend Services"
        Orch -->|HTTP POST (Frame)| MP[🖐️ MediaPipe Service]
        Orch -->|HTTP POST (Frame)| DF[😊 DeepFace Service]
        Orch -->|HTTP POST (Audio)| AU[🎤 Audio Service]
        
        MP -->|Landmarks + Gesture| Orch
        DF -->|Emotion + Confidence| Orch
        AU -->|Transcript + Intent| Orch
    end
    
    Orch -->|Fusion Logic| State[Session Manager]
    State -->|Unified Feedback| Orch
    Orch -->|UI Commands| Client
```

### Description des Composants

| Service | Port | Rôle | Technologies Clés |
|---------|------|------|-------------------|
| **Orchestrator** | `8000` | Hub WebSocket, Fusion des données, Gestion de Session. | FastAPI, Uvicorn, Asyncio |
| **MediaPipe** | `8002` | Détection squelettique (Mains + Visage). | MediaPipe Solutions, OpenCV |
| **DeepFace** | `8003` | Analyse émotionnelle faciale. | DeepFace (VGG-Face), TensorFlow |
| **Audio** | `8001` | Transcription & Analyse tonale. | Wav2Vec2, Torch, Librosa |
| **Frontend** | `3000` | Interface Utilisateur & Capture. | Next.js, React, Tailwind, Canvas |

---

## 3. Stack Technique Détaillée

### 🧠 Backend (Python 3.12+)

#### Orchestrator
*   `fastapi`: Framework API haute performance.
*   `websockets`: Gestion des connexions temps-réel.
*   `httpx`: Requêtes asynchrones vers les micro-services.

#### Vision Services (MediaPipe & DeepFace)
*   `mediapipe>=0.10.14`: Tracking biométrique.
*   `deepface`: Framework de reconnaissance faciale.
*   `opencv-python`: Traitement d'image (redimensionnement, conversion).
*   `numpy`: Calculs matriciels.

#### Audio Service
*   `transformers`: Modèles Hugging Face (Wav2Vec2).
*   `torch`: PyTorch pour l'inférence audio.
*   `librosa`: Traitement du signal audio (chargement, resampling).
*   `scikit-learn`: Classification d'intentions simples (Logistic Regression).

### 🖥️ Frontend (Node.js 18+)
*   **Framework:** `Next.js 16` (App Router).
*   **Langage:** `TypeScript`.
*   **Styling:** `Tailwind CSS 4`.
*   **Animation:** `Framer Motion` (Transitions UI fluides).
*   **Data Viz:** `Recharts` (Graphiques Radar pour les émotions).
*   **Icônes:** `Lucide React`.

---

## 4. Guide d'Installation

### Prérequis
*   Python 3.12 ou supérieur.
*   Node.js 18 ou supérieur.
*   Git.

### Installation Automatisée (Windows)

1.  **Cloner le dépôt :**
    ```bash
    git clone https://github.com/jeandirel/eloquence-ai.git
    cd eloquence-ai
    ```

2.  **Lancer le script de démarrage :**
    ```bash
    .\start_gesture_lab.bat
    ```
    *Ce script va automatiquement :*
    *   Créer les environnements virtuels Python si nécessaire.
    *   Installer les dépendances (`pip install -r requirements.txt`).
    *   Installer les modules Node (`npm install`).
    *   Lancer les 3 terminaux (Backend Services, Orchestrator, Frontend).

---

## 5. Guide d'Utilisation

### 🖐️ Gesture Lab (`/gestures`)
Module de reconnaissance gestuelle et de tracking.

*   **Fonctionnalités :**
    *   Visualisation des landmarks (Mains + Visage).
    *   Feedback visuel des gestes détectés.
*   **Gestes Supportés :**
    *   ✊ **FIST** (Poing fermé)
    *   ✋ **OPEN_PALM** (Main ouverte)
    *   ☝️ **POINTING** (Index levé)
    *   ✌️ **PEACE** (V de la victoire)
    *   👍 **THUMBS_UP** (Pouce en l'air)
    *   👌 **OK** (Pouce et index joints)
    *   👋 **TCHAO** (Signe de la main)

### 😊 Emotion AI (`/emotion`)
Module d'analyse affective.

*   **Radar Chart :** Visualisation en temps réel de la confiance pour 7 émotions.
*   **Adaptive UI :**
    *   *Calm Mode* (Bleu fondu) si Tristesse détectée.
    *   *Dynamic Mode* (Vibrant) si Joie/Surprise.
    *   *Simplified Mode* (Sombre) si Colère/Peur (réduction de la charge cognitive).

### 📊 Session Reporting (Nouveau)
Disponible sur les pages Gesture et Emotion.

1.  Cliquez sur **"Start Session"** (Bouton Vert).
2.  Interagissez avec l'application.
3.  Cliquez sur **"Stop Session"** (Bouton Rouge).
4.  L'application génère un **Rapport PDF-like** incluant :
    *   Durée de la session.
    *   Émotion dominante.
    *   Timeline des gestes effectués.

---

## 6. Référence API (WebSocket)

**Endpoint:** `ws://localhost:8000/ws`

### Protocole Client → Serveur

Le client envoie des **Frames Binaires** pour la performance. Le premier octet définit le type.

*   **Vidéo :** `[0x00] + [JPEG Blob]`
*   **Audio :** `[0x01] + [PCM 16-bit Blob]`
*   **Contrôle :** `[0x02] + [JSON String]`

**Exemple Contrôle (Start Session):**
```json
{
  "type": "SESSION_CONTROL",
  "action": "START"
}
```

### Protocole Serveur → Client

Le serveur répond toujours en **JSON Texte**.

**Commande UI (Geste):**
```json
{
  "type": "UI_COMMAND",
  "source": "GESTURE",
  "command": "APPROVE",
  "gesture": "THUMBS_UP",
  "hand_landmarks": [...] // Array of {x, y, z}
}
```

**Adaptation UI (Emotion):**
```json
{
  "type": "UI_ADAPTATION",
  "emotion": "happy",
  "confidence": 0.98,
  "mode": "DYNAMIC"
}
```

**Rapport de Session:**
```json
{
  "type": "SESSION_REPORT",
  "report": {
    "duration_seconds": 45.2,
    "emotion_stats": {"happy": 120, "neutral": 50},
    "gesture_stats": {"OK": 2, "THUMBS_UP": 1}
  }
}
```

---

## 7. Troubleshooting

*   **Erreur "Camera access denied" :** Vérifiez que votre navigateur a la permission d'accéder à la webcam et qu'aucune autre application (Zoom, Teams) ne l'utilise.
*   **Latence élevée :** L'analyse faciale (DeepFace) est lourde. Si vous n'avez pas de GPU NVIDIA, la latence peut atteindre 200-300ms.
*   **Gestes non reconnus :** Assurez-vous d'avoir un bon éclairage et que votre main est visible en entier dans le cadre.

---

**© 2026 OmniSense AI Project**
