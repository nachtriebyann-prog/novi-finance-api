# ✅ Checklist Configuration Novi Finance Funnel v2

## 🎯 Configuration Rapide

### 1️⃣ Vercel Environment Variables
Dans le dashboard Vercel, aller à **Settings → Environment Variables** et ajouter:

```env
# Supabase (déjà configuré)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_secret_key

# Twilio (déjà configuré)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+33123456789

# GHL (vérifier que c'est correct)
GHL_API_KEY=pit-xxx-xxx-xxx
GHL_LOCATION_ID=your_location_id

# GHL AUTOMATION (optionnel mais recommandé)
GHL_AUTOMATION_ID=your_workflow_id
```

### 2️⃣ Meta Pixel Configuration
Dans `index.html` ligne 12, remplacer `1234567890` par votre Pixel ID:
```javascript
fbq('init', 'YOUR_META_PIXEL_ID_HERE');
```

Dans `track-meta-event.js` ligne 38, vérifier que la variable d'environnement est utilisée:
```javascript
const pixelId = process.env.META_PIXEL_ID;
const accessToken = process.env.META_CAPI_TOKEN;
```

Ajouter à Vercel:
```env
META_PIXEL_ID=1234567890
META_CAPI_TOKEN=your_capi_token
```

### 3️⃣ GHL Custom Fields
**Optionnel** - Si vous voulez que les réponses soient stockées dans les custom fields GHL:

1. Aller dans GHL → Settings → Custom Fields
2. Créer les champs suivants (ou noter leurs IDs existants):
   - `q1_objectif`
   - `q2_situation_pro`
   - `q3_revenu`
   - `q4_famille`
   - `q5_age`
   - `variant`

3. Si les champs existent, GHL les remplira automatiquement
4. Si absent, GHL ignorera silencieusement

### 4️⃣ GHL Automation Workflow
**Optionnel** - Pour automatiser le suivi:

1. Dans GHL → Automations → Create New Workflow
2. Configurer le trigger (manuel par API)
3. Ajouter les actions désirées (ex: envoi email, notification, etc.)
4. Copier l'ID du workflow
5. Ajouter à Vercel: `GHL_AUTOMATION_ID=workflow_id`

Sans cette configuration, les contacts seront créés mais pas d'automation.

---

## 📋 Avant le Déploiement

- [ ] Tous les environment variables sont configurés dans Vercel
- [ ] Meta Pixel ID est correct dans index.html
- [ ] GHL_API_KEY et GHL_LOCATION_ID sont testés
- [ ] Fichiers déployés sur Vercel:
  - [ ] `form-ghl/index.html`
  - [ ] `form-ghl/script.js`
  - [ ] `form-ghl/styles.css`
  - [ ] `api/send-otp.js`
  - [ ] `api/verify-otp.js`
  - [ ] `api/trigger-ghl-automation.js`
  - [ ] `api/track-meta-event.js`

---

## 🧪 Test Complet

### Test 1: Form Navigation
1. Visiter `https://your-domain.vercel.app/form?v=a`
2. ✓ Page charge sans erreurs
3. ✓ Les 7 questions s'affichent une par une
4. ✓ Les animations sont fluides
5. ✓ Progress bar se met à jour

### Test 2: OTP Flow
1. Remplir jusqu'à la question 7 (téléphone)
2. Entrer un numéro valide (06 ou 07 ou +33)
3. Cliquer "Envoyer le code"
4. ✓ SMS reçu en < 10 secondes
5. ✓ Entrer le code reçu
6. ✓ Validation automatique
7. ✓ Contact créé dans GHL

### Test 3: Exclusions
**Test exclusion 1**:
1. Q2: Sélectionner "Sans activité"
2. Q2b apparaît
3. Q2b: Sélectionner "Moins de 50 000€"
4. Soumettre le form
5. ✓ Exclusion page s'affiche

**Test exclusion 2**:
1. Q3: Sélectionner "Moins de 2 000€"
2. Q3b apparaît
3. Q3b: Sélectionner "Moins de 100 000€"
4. Soumettre le form
5. ✓ Exclusion page s'affiche

### Test 4: A/B Variants
1. Visiter avec `?v=a`
2. Visiter avec `?v=b`
3. ✓ Les deux URLs fonctionnent identiquement
4. Vérifier dans GHL: tags contiennent `variant:a` ou `variant:b`

### Test 5: Meta Pixel
1. Ouvrir les DevTools → Network
2. Filtrer sur "facebook.com" ou "graph.facebook"
3. Remplir le formulaire
4. ✓ Événements de pixel s'affichent (PageView, ViewContent, etc.)
5. Attendre 1-2 min
6. Vérifier dans Meta Pixel dashboard → Events → Test Events

### Test 6: GHL Contact
1. Remplir le formulaire complètement
2. ✓ Contact créé dans GHL avec:
   - Prénom, nom, email, téléphone
   - Tags: `source:novi-finance-funnel`, `variant:a`
   - Custom fields remplis (si configurés)
   - Automation déclenchée (si configurée)

---

## 🚀 Déploiement

### Via Git (Recommandé)
```bash
# Vercel auto-deploy sur push vers main
git add .
git commit -m "Deploy Novi Finance funnel v2"
git push origin main
```

### Via Vercel CLI
```bash
vercel deploy --prod
```

### Vérifier le déploiement
```bash
# Voir les logs
vercel logs

# Test API
curl https://your-domain.vercel.app/api/verify-otp
```

---

## 🆘 Troubleshooting Rapide

### ❌ "Les événements Meta Pixel ne s'affichent pas"
- Vérifier le Pixel ID dans index.html
- Vérifier que fbq est chargé (DevTools → Network)
- Attendre 1-2 min (délai de propagation Meta)
- Vérifier META_PIXEL_ID dans Vercel env vars

### ❌ "Le contact n'est pas créé dans GHL"
- Vérifier GHL_API_KEY et GHL_LOCATION_ID
- Tester l'OTP directement: visiter `/api/debug-otp?phoneNumber=%2B33757594907`
- Vérifier que le numéro est en format +33
- Vérifier les logs Vercel: `vercel logs`

### ❌ "L'OTP n'est pas reçu"
- Vérifier TWILIO_PHONE_NUMBER valide
- Vérifier TWILIO_ACCOUNT_SID et AUTH_TOKEN
- Vérifier le solde Twilio (pas de crédits?)
- Tester via dashboard Twilio

### ❌ "L'automation ne se déclenche pas"
- Vérifier GHL_AUTOMATION_ID configuré
- Vérifier ID du workflow dans GHL
- Vérifier que le workflow accepte les triggers API
- Sans GHL_AUTOMATION_ID, c'est normal - contact créé mais pas d'automation

### ❌ "Le form affiche des erreurs JavaScript"
- Vérifier la console du navigateur (F12 → Console)
- Vérifier les logs Vercel
- Vérifier que tous les fichiers `.js` sont déployés
- Nettoyer le cache: Ctrl+Shift+Delete puis reload

---

## 📞 Support

| Problème | Solution |
|----------|----------|
| Twilio | https://www.twilio.com/console |
| GHL | https://app.highlevel.com |
| Meta Pixel | https://business.facebook.com/events_manager |
| Vercel | https://vercel.com/dashboard |
| Supabase | https://app.supabase.com |

---

## 🎉 Prêt!

Une fois tout configuré et testé:

1. ✅ Funnel en production
2. ✅ Contacts créés dans GHL
3. ✅ Events trackés dans Meta Pixel
4. ✅ A/B testing prêt à fonctionner
5. ✅ Automations déclenchées

**Partager le lien**: `https://your-domain.vercel.app/form`

Ou avec variante B: `https://your-domain.vercel.app/form?v=b`

---

**Date**: Mai 2026
**Version**: 2.0
**Status**: ✅ Production Ready
