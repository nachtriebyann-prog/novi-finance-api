# Novi Finance — Bilan Patrimonial

## URLs
| Environnement | URL |
|---|---|
| Production | https://bl.novifinance.fr |
| Vercel projet | https://vercel.com/yanns-projects-2311dda4/project-9bvv3 |
| GitHub repo | https://github.com/nachtriebyann-prog/novi-finance-api |

## Pages du funnel
| Fichier | URL | Indexée Google |
|---|---|---|
| `public/landing.html` | bl.novifinance.fr/ | ✅ Oui |
| `public/formulaire.html` | bl.novifinance.fr/formulaire | ✅ Oui |
| `public/thank-you.html` | bl.novifinance.fr/thank-you | ❌ noindex |
| `public/non-eligible.html` | bl.novifinance.fr/non-eligible | ❌ noindex |

## Déploiement
```bash
# Toujours déployer depuis le git root :
cd "C:\Users\PC\OneDrive\Bureau\Claude Code"
npx vercel deploy --prod
```
> ⚠️ Le push GitHub seul ne redéploie PAS automatiquement.

## Variables d'environnement (Vercel)
| Variable | Usage |
|---|---|
| `GHL_API_KEY` | Token GoHighLevel (format `pit-…`) |
| `GHL_LOCATION_ID` | ID de la location GHL |
| `TWILIO_ACCOUNT_SID` | SMS OTP |
| `TWILIO_AUTH_TOKEN` | SMS OTP |
| `TWILIO_PHONE_NUMBER` | Numéro expéditeur OTP |
| `SUPABASE_URL` | Stockage codes OTP |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé Supabase |

## Intégrations actives
| Service | Détail |
|---|---|
| GoHighLevel | API v2 — `services.leadconnectorhq.com` — tag `bilan-novi` |
| Microsoft Clarity | Project ID `wqjlolvr8u` — sur toutes les pages |
| Vercel | Projet `project-9bvv3` — org `yanns-projects-2311dda4` |

## Structure API
```
api/
├── create-ghl-contact.js   ← Création contact GHL + tag bilan-novi
├── send-otp.js             ← Envoi SMS via Twilio
└── verify-otp.js           ← Vérification code OTP (Supabase)
```

## Assets statiques
```
public/assets/
├── amf.png        ← Logo AMF (téléchargé localement — CDN GHL bloque le hotlink)
├── orias.png      ← Logo ORIAS (idem)
└── favicon.svg    ← Favicon "N" italic cuivre sur fond sombre
```

## Notes techniques
- React 18 + Babel standalone (compilation JSX in-browser)
- Pas de build step — les fichiers HTML sont servis directement
- `vercel.json` redirige `/*` vers `public/$1`
- OTP : 1 input transparent sur 4 cases visuelles (UX mobile)
- `window._noviFormData` — store global partagé entre composants React
