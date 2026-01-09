# 📱 Guide de Partage - Eloquence AI

Ce guide vous explique comment **partager Eloquence AI** avec vos amis via un lien public et un QR code.

---

## 🚀 Étape 1 : Installer ngrok

### Windows

1. **Téléchargez ngrok** : https://ngrok.com/download
2. **Extrayez** le fichier ZIP
3. **Déplacez** `ngrok.exe` dans `C:\Windows\System32\` (pour l'utiliser partout)

### Vérifier l'installation
```bash
ngrok version
```

---

## 🔗 Étape 2 : Créer un tunnel public

### Méthode 1 : Script automatique (Recommandé)

Double-cliquez sur **`start_with_sharing.bat`**

Le script va :
1. ✅ Démarrer tous les services (MediaPipe, Orchestrator, Frontend)
2. ✅ Créer un tunnel ngrok automatiquement
3. ✅ Vous donner l'URL publique

### Méthode 2 : Manuel

```bash
# Terminal 1 : Démarrer les services
.\start_gesture_lab.bat

# Terminal 2 : Créer le tunnel
ngrok http 3000
```

---

## 📋 Étape 3 : Copier l'URL ngrok

Dans la fenêtre **ngrok Tunnel**, cherchez la ligne :

```
Forwarding    https://xxxx-xx-xx-xxx-xxx.ngrok.io -> http://localhost:3000
```

**Copiez** l'URL qui commence par `https://` (par exemple : `https://1234-56-78-901-234.ngrok.io`)

---

## 🎨 Étape 4 : Générer le QR Code

1. **Ouvrez** : http://localhost:3000/qr
2. **Collez** votre URL ngrok dans le champ
3. **Ajoutez** `/gestures` à la fin  
   Exemple : `https://1234-56-78-901-234.ngrok.io/gestures`
4. Cliquez sur **"Générer QR Code"**
5. **Téléchargez** l'image PNG du QR code

---

## 📤 Étape 5 : Partager

### Option A : Partager le lien
Envoyez le lien `https://xxxx.ngrok.io/gestures` par :
- 📧 Email
- 💬 WhatsApp / Telegram
- 📱 SMS

### Option B : Partager le QR Code
1. Imprimez ou affichez le QR code
2. Vos amis scannent avec leur téléphone
3. Ils accèdent directement à **Gesture Lab** !

---

## ⚙️ URLs disponibles

Une fois ngrok actif, remplacez `https://VOTRE-URL.ngrok.io` par votre URL :

| Page | URL |
|------|-----|
| **Gesture Lab** | `https://VOTRE-URL.ngrok.io/gestures` |
| **Emotion Recognition** | `https://VOTRE-URL.ngrok.io/emotion` |
| **QR Generator** | `https://VOTRE-URL.ngrok.io/qr` |
| **Home** | `https://VOTRE-URL.ngrok.io` |

---

## ⚠️ Limitations de la version gratuite

### ngrok Free Tier
- ✅ **Illimité** en durée
- ✅ **Illimité** en bande passante
- ⚠️ **URL change** à chaque redémarrage de ngrok
- ⚠️ **1 tunnel** simultané maximum

### Pour avoir une URL fixe
Créez un compte gratuit ngrok :
1. Allez sur https://dashboard.ngrok.com/signup
2. Obtenez votre **authtoken**
3. Configurez : `ngrok config add-authtoken VOTRE_TOKEN`
4. Utilisez : `ngrok http --domain=votre-domaine.ngrok.io 3000`

---

## 🔒 Sécurité

### Authentification (optionnel)
Ajoutez un mot de passe à votre tunnel :
```bash
ngrok http 3000 --basic-auth="user:password"
```

### Autoriser seulement certaines IPs
```bash
ngrok http 3000 --cidr-allow="192.168.1.0/24"
```

---

## 🐛 Dépannage

### "ngrok n'est pas reconnu"
- Vérifiez que `ngrok.exe` est dans le PATH
- Ou utilisez le chemin complet : `C:\chemin\vers\ngrok.exe http 3000`

### "Connection refused"
- Vérifiez que le frontend tourne sur `http://localhost:3000`
- Lancez `npm run dev` dans `frontend/`

### "ERR_NGROK_3200"
- Vous avez dépassé la limite gratuite de ngrok
- Attendez 1 minute ou créez un compte gratuit

### Le QR code ne fonctionne pas
- Vérifiez que l'URL contient bien `https://` au début
- Vérifiez que vous avez ajouté `/gestures` à la fin
- Certains réseaux bloquent ngrok (utilisez 4G/5G)

---

## 📱 Test du QR Code

1. **Scannez** le QR code avec votre téléphone
2. **Autorisez** l'accès à la caméra
3. **Testez** les gestes devant la caméra !

---

## 🎯 Exemple complet

```bash
# 1. Démarrer tout
.\start_with_sharing.bat

# 2. Copier l'URL ngrok
# Exemple: https://1234-56-78-901-234.ngrok.io

# 3. Créer le lien complet
https://1234-56-78-901-234.ngrok.io/gestures

# 4. Générer QR sur
http://localhost:3000/qr

# 5. Partager !
```

---

## 💡 Astuces

### Garder la même URL
```bash
# Avec compte ngrok gratuit
ngrok http 3000 --domain=mon-app.ngrok.io
```

### Voir les statistiques
Ouvrez : http://localhost:4040 (interface ngrok)

### Logs en temps réel
Dans l'interface ngrok, vous voyez toutes les requêtes HTTP en direct !

---

## 🆘 Besoin d'aide ?

- **Documentation ngrok** : https://ngrok.com/docs
- **Support** : jedirkab70@gmail.com
- **Issues GitHub** : https://github.com/jeandirel/eloquence-ai/issues

---

**Profitez du partage ! 🎉**
