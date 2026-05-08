# Formulaire Novi Finance - Polaris Leads

## 📋 Description

Formulaire de capture dynamique en HTML/JavaScript avec :
- ✅ 4 étapes + 8 questions (+ questions conditionnelles)
- ✅ Validation SMS OTP via Twilio
- ✅ Intégration GoHighLevel (GHL)
- ✅ Exclusions silencieuses automatiques
- ✅ Tags dynamiques
- ✅ Design responsive et moderne

## 🚀 Installation

### 1. Installer les dépendances
```bash
npm install
```

### 2. Lancer le serveur
```bash
npm start
# ou en développement
npm run dev
```

### 3. Accéder au formulaire
```
http://localhost:3000
```

## 🔑 Configuration

### Variables d'environnement
Les clés API sont configurées via des variables d'environnement dans `server.js` :

- **Twilio Account SID**: Voir `.env.example`
- **Twilio Auth Token**: Voir `.env.example`
- **Twilio Phone**: Voir `.env.example`
- **GHL API Key**: Voir `.env.example`

⚠️ **Configuration**: Copier `.env.example` en `.env` et remplir avec vos vraies clés API

## 📱 Flux du formulaire

### Étape 1: Votre projet
- Q1: Quel est votre principal projet ? (4 options)

### Étape 2: Votre situation
- Q2: Situation professionnelle (7 options)
  - **Conditionnelle Q2b** si "Sans activité": Patrimoine à valoriser?
- Q3: Situation familiale (6 options)

### Étape 3: Votre profil
- Q4: Revenu mensuel net (5 tranches)
  - **Conditionnelle Q4b** si "< 2000 EUR": Patrimoine à valoriser?
- Q5: Tranche d'âge (5 tranches)

### Étape 4: Vos coordonnées
- Q6: Prénom + Nom
- Q7: Email
- Q8: Téléphone + **Validation SMS OTP**

## 🔐 Validation SMS OTP

1. L'utilisateur entre son numéro de téléphone
2. Clique sur "Envoyer un code"
3. Reçoit un SMS avec un code 6 chiffres
4. Entre le code et vérifie
5. Le lead est créé après vérification ✓

### Timeout: 10 minutes

## 🚫 Exclusions silencieuses

Deux cas déclenchent une **page d'exclusion silencieuse** (pas de création de lead dans GHL) :

1. **Q2 = "Sans activité" ET Q2b < 10 000 EUR**
2. **Q4 = "< 2 000 EUR" ET Q4b < 10 000 EUR**

## 🏷️ Tags automatiques

Les leads reçoivent des tags selon leurs réponses :
- `Sans activité — patrimoine existant` (si Q2b > 10k)
- `Revenu faible — patrimoine existant` (si Q4b > 10k)

## 📊 Données transmises à GHL

```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean.dupont@email.com",
  "phone": "+33757594907",
  "source": "Polaris Leads - Formulaire Web",
  "tags": ["Sans activité — patrimoine existant"],
  "customFields": {
    "q1_project": "retraite",
    "q2_profession": "sans_activite",
    "q3_family": "marie",
    "q4_revenu": "7k_15k",
    "q5_age": "50_60"
  }
}
```

## 🎨 Personnalisation

### Couleurs
Éditer les variables CSS dans `styles.css` :
```css
#667eea /* Primary purple */
#764ba2 /* Secondary purple */
```

### Messages
Tous les textes sont dans `index.html` et facilement modifiables

### Timeout OTP
Changer dans `script.js` :
```javascript
OTP_TIMEOUT: 10 * 60 * 1000, // Millisecondes
```

## 📞 Support Twilio

### Tester localement
Le serveur retourne le code OTP en réponse (développement uniquement) :
```json
{
  "success": true,
  "otpCode": "123456"
}
```

⚠️ **À SUPPRIMER en production!**

### Numéros de test Twilio
- Comptes de test: utiliser des numéros formatés (+33...)

## 🔗 Endpoint API GHL

Vérifier l'endpoint exact pour votre location GoHighLevel :
```
https://rest.gohighlevel.com/v1/contacts/
```

Certaines locations utilisent des sous-domaines différents.

## 📝 Notes de sécurité

- ✅ Validation côté serveur (Node.js)
- ✅ Validation côté client (HTML5)
- ✅ Clés API non exposées au client
- ⚠️ Ne pas commiter le code OTP en production
- ⚠️ Utiliser HTTPS en production

## 🐛 Debugging

### Console navigateur
```javascript
// Voir les données du formulaire
console.log(formData);

// Voir le code OTP (développement)
console.log(otpCode);
```

### Logs serveur
```
✅ SMS envoyé à +33757594907 - SID: SM...
Erreur GHL: ...
```

## 📦 Fichiers

- `index.html` - Structure du formulaire
- `styles.css` - Styles et responsive design
- `script.js` - Logique client (navigation, validation, OTP)
- `server.js` - Serveur Express (Twilio, GHL API)
- `package.json` - Dépendances npm

---

**Version**: 1.0.0  
**Créé**: 2026-04-23  
**Destinataire**: Novi Finance - Polaris Leads
