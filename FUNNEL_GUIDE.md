# 🎯 Novi Finance Funnel - Guide Complet

## Vue d'ensemble

La nouvelle funnel Novi Finance est un questionnaire Typeform-style en 7 questions avec :
- ✨ Animations fluides entre les questions
- 🔀 Logique conditionnelle (2 points d'exclusion)
- 📱 Vérification OTP pour le téléphone
- 📊 Intégration GHL complète
- 📈 Suivi Meta Pixel (standard + CAPI)
- 🧪 Support A/B testing via paramètre URL

---

## 📋 Structure des 7 Questions

### Q1: Objectif Principal
**Type**: Sélection simple
**Options**:
- Préparer ma retraite
- Réduire mes impôts
- Épargner et faire fructifier mon argent
- Investir dans l'immobilier

### Q2: Situation Professionnelle
**Type**: Sélection simple
**Options**:
- Salarié
- Indépendant / TNS
- Cadre ou dirigeant
- Sans activité professionnelle

**Logique conditionnelle**: Si "Sans activité" → affiche Q2b

### Q2b: Patrimoine (Conditionnel)
**Affiché si**: Q2 = "Sans activité"
**Type**: Sélection simple
**Options**:
- Moins de 50 000€
- Entre 50 000€ et 200 000€
- Entre 200 000€ et 500 000€
- Plus de 500 000€

**⚠️ EXCLUSION POINT 1**: Si réponse = "Moins de 50 000€" → Exclusion

### Q3: Revenu Mensuel Net
**Type**: Sélection simple
**Options**:
- Moins de 2 000€
- Entre 2 000€ et 4 000€
- Entre 4 000€ et 6 000€
- Plus de 6 000€

**Logique conditionnelle**: Si "Moins de 2 000€" → affiche Q3b

### Q3b: Patrimoine à Optimiser (Conditionnel)
**Affiché si**: Q3 = "Moins de 2 000€"
**Type**: Sélection simple
**Options**:
- Moins de 100 000€
- Entre 100 000€ et 300 000€
- Plus de 300 000€

**⚠️ EXCLUSION POINT 2**: Si réponse = "Moins de 100 000€" → Exclusion

### Q4: Situation Familiale
**Type**: Sélection simple
**Options**:
- Célibataire
- En couple
- Famille avec enfants
- Autre situation

### Q5: Tranche d'âge
**Type**: Sélection simple
**Options**:
- 30 - 40 ans
- 40 - 50 ans
- 50 - 60 ans
- 60 ans et plus

### Q6: Informations de Contact
**Type**: Formulaire multi-champs
**Champs**:
- Prénom (q6_prenom)
- Nom (q6_nom)
- Email (q6_email)

### Q7: Téléphone + Vérification OTP
**Type**: Entrée téléphone + bloc OTP
**Champ**: q7_phone
**Flux**:
1. Utilisateur entre son numéro
2. Clique "Envoyer le code"
3. SMS reçu avec code OTP
4. Entre le code automatiquement vérifié
5. Contact créé/mis à jour dans GHL
6. Automation déclenchée

---

## 🔧 Configuration Requise

### Variables d'Environnement (Vercel)

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_secret_key

# Twilio (pour SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+33123456789

# GHL
GHL_API_KEY=pit-xxx-xxx-xxx
GHL_LOCATION_ID=your_location_id
GHL_AUTOMATION_ID=workflow_id (optionnel)

# Meta Pixel
META_PIXEL_ID=1234567890
META_CAPI_TOKEN=your_capi_token

# SMS Template
OTP_EXPIRY_MINUTES=10
```

### Endpoints API Requis

Tous les endpoints doivent être dans `/api/` :

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/send-otp` | POST | Envoie un code OTP par SMS |
| `/api/verify-otp` | POST | Vérifie le code OTP et crée le contact GHL |
| `/api/trigger-ghl-automation` | POST | Déclenche l'automation GHL |
| `/api/track-meta-event` | POST | Envoie les événements à Meta CAPI |

---

## 📊 Flux de Données Complet

```
1. USER VISITS
   ↓
2. PAGE LOADS → Meta Pixel: PageView (variant: a/b)
   ↓
3. ANSWERS Q1-Q5 → Meta Pixel: ViewContent (pour chaque question)
   ↓
4. ENTERS PHONE
   ↓
5. CLICKS "ENVOYER CODE"
   ↓
6. TWILIO SENDS SMS ← OTP Code
   ↓
7. USER ENTERS OTP
   ↓
8. VERIFY-OTP API CALLED
   ├─ Supabase: Récupère le code OTP
   ├─ Valide le code
   ├─ GHL API: Crée/met à jour le contact
   ├─ Supabase: Supprime le code OTP
   └─ Meta Pixel: OTPVerified
   ↓
9. SUBMIT FORM BUTTON ENABLED
   ↓
10. USER CLICKS "ENVOYER"
    ↓
11. CHECK EXCLUSIONS
    ├─ Si exclusion → Affiche exclusion page
    └─ Si OK → Continue
    ↓
12. TRIGGER-GHL-AUTOMATION API
    ├─ Cherche le contact dans GHL
    ├─ Met à jour les custom fields et tags
    └─ Déclenche le workflow/automation GHL
    ↓
13. TRACK-META-EVENT API → FormSubmitted
    ↓
14. SHOW THANK YOU PAGE
```

---

## 🎨 Animations Typeform-style

### Transitions
- **Entre les questions**: Fade in/out (300ms)
- **Sélection d'option**: Scale + slide (600ms avant passage à la question suivante)
- **Page de remerciement**: Bounce animation sur l'icône

### Interactive
- **Option cards**: Hover effect avec border color change
- **Progress bar**: Smooth width animation
- **OTP input**: Focus effect avec box-shadow

---

## 🧪 A/B Testing

### Comment ça fonctionne
L'URL utilise un paramètre `v` pour la variante:
```
https://novifinance.fr/form?v=a  (Variante A)
https://novifinance.fr/form?v=b  (Variante B)
```

### Qu'est-ce qui change?
Actuellement, seule la variante est tracée dans les événements Meta Pixel et les tags GHL.

Exemples de modifications futures:
- **Couleurs**: Différent color scheme par variante
- **Texte**: Questions/options légèrement différentes
- **Ordre**: Questions dans un ordre différent
- **CTAs**: Texte des boutons différent

### Tracking
Chaque événement Meta Pixel inclut: `variant: "a"` ou `"b"`

Chaque contact GHL a un tag: `source:novi-finance-funnel` et `variant:a`/`variant:b`

---

## 📱 Vérification OTP

### Processus
1. **Send OTP**: Utilisateur clique "Envoyer le code"
   - `/api/send-otp` génère un code aléatoire 6 chiffres
   - Code stocké dans Supabase avec expiration (10 minutes)
   - SMS envoyé via Twilio

2. **Input**: Utilisateur saisit le code
   - Validation client en temps réel (6 chiffres)
   - Activation automatique de la vérification à 6 chiffres

3. **Verify**: Code vérifié
   - `/api/verify-otp` récupère le code depuis Supabase
   - Compare avec le code entré
   - Crée/met à jour le contact dans GHL
   - **Attention**: Utilise le numéro de téléphone normalisé (+33xxx)
   - Supprime le code de Supabase après vérification
   - Contact dupliqué? Cherche et met à jour automatiquement

### Gestion des Erreurs
- Code expiré: Affiche "Le code a expiré. Envoyez un nouveau code."
- Code incorrect: "Code incorrect"
- Format téléphone invalide: "Numéro de téléphone invalide"

---

## 🛡️ Exclusions

### Logique
Deux points d'exclusion éliminent les profils non éligibles:

**EXCLUSION 1**: Sans activité + Patrimoine < 50k
- Affiche exclusion page
- Link vers novifinance.fr

**EXCLUSION 2**: Revenu < 2k + Patrimoine < 100k
- Même exclusion page

Les utilisateurs exclus ne sont PAS créés dans GHL ni suivis dans Meta.

---

## 🔗 Intégration GHL

### Contact Creation Flow
1. **OTP Verification** (`verify-otp.js`):
   - Cherche contact par email
   - Si trouvé → Met à jour
   - Si non trouvé → Crée nouveau contact
   - Gère les doublons (recherche par téléphone, puis email)
   - Tags automatiques: `lead-novi-finance`, `source-web-form`

2. **Automation Trigger** (`trigger-ghl-automation.js`):
   - Appelé après submission du formulaire
   - Met à jour le contact avec les custom fields
   - Ajoute les tags: `source:novi-finance-funnel`, `variant:a/b`
   - Déclenche le workflow GHL (si GHL_AUTOMATION_ID configuré)

### Custom Fields Mapping
Les réponses du formulaire sont stockées dans les custom fields GHL:
```javascript
{
  q1_objectif: "preparer_retraite",
  q2_situation_pro: "salarie",
  q3_revenu: "4k_6k",
  q4_famille: "famille",
  q5_age: "40_50",
  variant: "a"
}
```

### GHL Automation
Pour activer l'automation:
1. Créer un workflow dans GHL
2. Copier son ID
3. Définir `GHL_AUTOMATION_ID` dans Vercel
4. L'automation se déclenche automatiquement à la completion

---

## 📊 Suivi Meta Pixel

### Events Trackés

| Event | Quand | Custom Data |
|-------|-------|------------|
| `PageView` | Page load | `variant` |
| `ViewContent` | Question answered | `question`, `answer`, `variant` |
| `OTPSent` | OTP envoyé | `phone`, `variant` |
| `OTPVerified` | OTP validé | `phone`, `variant` |
| `FormSubmitted` | Form submit | `email`, `variant` |

### Conversions API (CAPI)
Tous les events sont aussi envoyés à Meta CAPI pour:
- ✅ Server-side tracking
- ✅ Meilleure attribution
- ✅ Cross-device tracking
- ✅ Matching utilisateurs amélioré

---

## 🚀 Déploiement

### À Vercel
```bash
git add .
git commit -m "Deploy Novi Finance funnel v2"
git push origin main
```

### Vérification
1. Accédez à `https://your-domain.vercel.app/form`
2. Testez le flux complet
3. Vérifiez les logs Vercel: `vercel logs`
4. Confirmez le contact dans GHL
5. Confirmez les events dans Meta Pixel

---

## 🐛 Dépannage

### OTP non reçu
- Vérifier TWILIO_PHONE_NUMBER valide
- Vérifier TWILIO_ACCOUNT_SID et AUTH_TOKEN
- Check SMS logs in Twilio dashboard

### Contact non créé dans GHL
- Vérifier GHL_API_KEY et GHL_LOCATION_ID
- Check `/api/verify-otp` logs
- Vérifier que le numéro est en format +33

### Meta Pixel events manquants
- Vérifier META_PIXEL_ID dans HTML
- Vérifier META_CAPI_TOKEN si utilisant CAPI
- Check `/api/track-meta-event` logs

### Automation non déclenchée
- Vérifier GHL_AUTOMATION_ID configuré
- Vérifier ID workflow dans GHL
- Check logs de `trigger-ghl-automation`

---

## 📝 Résumé des Fichiers

```
form-ghl/
├── index.html              # Structure HTML (7 questions)
├── script.js               # Logique formulaire + animations
├── styles.css              # Styles Typeform + animations
├── FUNNEL_GUIDE.md         # Cette doc

api/
├── send-otp.js             # Envoie SMS OTP (Twilio)
├── verify-otp.js           # Vérifie OTP + crée contact GHL
├── trigger-ghl-automation.js  # Déclenche automation
├── track-meta-event.js     # Envoie events à Meta CAPI
├── debug-otp.js            # Debug endpoint
└── test-ghl-direct.js      # Test endpoint GHL
```

---

## 💡 Notes Importantes

1. **OTP Expiration**: 10 minutes (configurable via `OTP_EXPIRY_MINUTES`)
2. **Phone Format**: Toujours normalisé en +33xxx (France)
3. **Custom Fields**: Doivent exister dans GHL ou seront ignorés
4. **Automation ID**: Optionnel - si absent, contact créé mais pas d'automation
5. **A/B Tracking**: Variant stocké dans tous les events et tags GHL
6. **Exclusions**: Permanentes - utilisateurs exclu pas dans GHL
7. **SMS Cost**: Chaque OTP = 1 SMS (Twilio charges)

---

**Dernière mise à jour**: Mai 2026
**Version**: 2.0 (7 questions + Typeform-style + A/B testing)
