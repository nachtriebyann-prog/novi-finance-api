const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const twilio = require('twilio');
const crypto = require('crypto');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Configuration Twilio - use environment variables for security
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_FROM = process.env.TWILIO_PHONE_FROM;

// Initialize Twilio client if credentials are available
const twilioCLient = (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN)
    ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    : null;

if (!twilioCLient && process.env.NODE_ENV === 'production') {
    console.error('⚠️ CRITICAL: Twilio credentials not configured in production!');
}

// Stockage des OTP en mémoire (à remplacer par une base de données en production)
const otpStore = new Map();

// ===== ROUTES STATIC =====
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ===== API ROUTES =====

// 1. Envoyer OTP par SMS
app.post('/api/send-otp', async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ error: 'Numéro de téléphone requis' });
        }

        // Générer un code OTP aléatoire
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Formater le numéro pour Twilio
        let formattedPhone = phone.replace(/\s+/g, '');
        if (!formattedPhone.startsWith('+')) {
            // Si c'est un numéro français sans +, ajouter +33
            if (formattedPhone.startsWith('0')) {
                formattedPhone = '+33' + formattedPhone.substring(1);
            } else {
                formattedPhone = '+33' + formattedPhone;
            }
        }

        // Stocker l'OTP avec une expiration
        otpStore.set(formattedPhone, {
            code: otpCode,
            expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
        });

        // Envoyer le SMS via Twilio
        try {
            if (twilioCLient && TWILIO_PHONE_FROM) {
                const message = await twilioCLient.messages.create({
                    body: `Votre code de vérification Novi Finance: ${otpCode}\n\nValable 10 minutes.`,
                    from: TWILIO_PHONE_FROM,
                    to: formattedPhone,
                });

                console.log(`✓ SMS envoyé à ${formattedPhone} - SID: ${message.sid}`);
            } else {
                console.log(`⚠️ Twilio non configuré - code OTP généré localement pour: ${formattedPhone}`);
            }
        } catch (twilioError) {
            console.log(`⚠️ Erreur Twilio (dev mode): ${twilioError.message}`);
            console.log(`⚠️ En développement, code OTP généré localement pour: ${formattedPhone}`);
        }

        // Pour développement: retourner le code (À SUPPRIMER EN PRODUCTION!)
        res.json({
            success: true,
            message: 'Code OTP envoyé avec succès',
            otpCode: otpCode, // DÉVELOPPEMENT UNIQUEMENT
        });
    } catch (error) {
        console.error('Erreur OTP:', error);
        res.status(500).json({
            error: 'Erreur lors de l\'envoi du code OTP',
            details: error.message,
        });
    }
});

// 2. Vérifier l'OTP
app.post('/api/verify-otp', (req, res) => {
    try {
        const { phone, code } = req.body;

        if (!phone || !code) {
            return res.status(400).json({ error: 'Téléphone et code requis' });
        }

        // Récupérer l'OTP stocké
        const storedOtp = otpStore.get(phone);

        if (!storedOtp) {
            return res.status(400).json({ error: 'Aucun code OTP trouvé pour ce numéro' });
        }

        // Vérifier l'expiration
        if (storedOtp.expiresAt < Date.now()) {
            otpStore.delete(phone);
            return res.status(400).json({ error: 'Le code OTP a expiré' });
        }

        // Vérifier le code
        if (storedOtp.code !== code.trim()) {
            return res.status(400).json({ error: 'Code OTP incorrect' });
        }

        // Supprimer l'OTP utilisé
        otpStore.delete(phone);

        res.json({
            success: true,
            message: 'Numéro de téléphone vérifié avec succès',
        });
    } catch (error) {
        console.error('Erreur vérification OTP:', error);
        res.status(500).json({
            error: 'Erreur lors de la vérification',
            details: error.message,
        });
    }
});

// 3. Trigger GHL Automation - Créer un lead et déclencher l'automatisation
app.post('/api/trigger-ghl-automation', async (req, res) => {
    try {
        const {
            q1_age,
            q2_family,
            q3_taxes,
            q4_patrimoine,
            q5_objective,
            q6_nom,
            q6_nom_last,
            q6_email,
            q7_phone,
            variant,
            timestamp
        } = req.body;

        // Validate required fields
        if (!q6_email || !q7_phone || !q6_nom) {
            return res.status(400).json({
                error: 'Email, téléphone et nom requis',
                success: false
            });
        }

        // Format phone number for storage
        let formattedPhone = q7_phone.replace(/\s+/g, '');
        if (!formattedPhone.startsWith('+')) {
            if (formattedPhone.startsWith('0')) {
                formattedPhone = '+33' + formattedPhone.substring(1);
            } else {
                formattedPhone = '+33' + formattedPhone;
            }
        }

        // Prepare GHL contact data
        const ghlContactData = {
            firstName: q6_nom,
            lastName: q6_nom_last || '',
            email: q6_email,
            phone: formattedPhone,
            source: 'Novi Finance - Formulaire Web V8',
            tags: ['novi-finance', variant || 'default'],
            customFields: {
                'Âge': q1_age,
                'Situation familiale': q2_family,
                'Impôts annuels': q3_taxes,
                'Patrimoine': q4_patrimoine,
                'Objectif principal': q5_objective,
                'Variante': variant || 'default',
                'Date soumission': timestamp
            },
            // Note: Field names above should match your GHL custom field names
            // Update these to match your actual GHL setup
        };

        // Log the lead creation for debugging
        console.log(`📋 Nouveau lead: ${q6_nom} ${q6_nom_last} (${q6_email}) - ${formattedPhone}`);
        console.log(`   Réponses: Âge=${q1_age}, Famille=${q2_family}, Impôts=${q3_taxes}, Patrimoine=${q4_patrimoine}, Objectif=${q5_objective}`);

        // TODO: Call actual GHL API with your location ID and API key
        // For now, in development mode, we'll just log and return success
        //
        // const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
        // const GHL_API_KEY = process.env.GHL_API_KEY;
        //
        // if (!GHL_LOCATION_ID || !GHL_API_KEY) {
        //     console.warn('⚠️ GHL credentials not configured');
        //     return res.status(400).json({
        //         error: 'GHL configuration missing',
        //         success: false
        //     });
        // }
        //
        // const ghlResponse = await fetch(
        //     `https://rest.gohighlevel.com/v1/contacts/?locationId=${GHL_LOCATION_ID}`,
        //     {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json',
        //             'Authorization': `Bearer ${GHL_API_KEY}`,
        //         },
        //         body: JSON.stringify(ghlContactData),
        //     }
        // );
        //
        // if (!ghlResponse.ok) {
        //     throw new Error(`GHL API returned ${ghlResponse.status}`);
        // }
        //
        // const ghlData = await ghlResponse.json();

        // Development mode: simulate successful lead creation
        res.json({
            success: true,
            message: 'Lead créé et automatisation déclenchée avec succès',
            leadId: 'ghl-' + Date.now(),
            contact: {
                name: `${q6_nom} ${q6_nom_last}`,
                email: q6_email,
                phone: formattedPhone
            },
            devMode: process.env.NODE_ENV !== 'production'
        });

    } catch (error) {
        console.error('Erreur GHL Automation:', error);
        res.status(500).json({
            error: 'Erreur lors de la création du lead',
            details: error.message,
            success: false
        });
    }
});

// 4. Créer un lead dans GoHighLevel (Legacy endpoint)
app.post('/api/create-lead-ghl', async (req, res) => {
    try {
        const { leadData, apiKey } = req.body;

        if (!leadData || !apiKey) {
            return res.status(400).json({ error: 'Données du lead et clé API requises' });
        }

        // Préparer les données pour l'API GHL
        const ghlPayload = {
            firstName: leadData.firstName,
            lastName: leadData.lastName,
            email: leadData.email,
            phone: leadData.phone,
            source: 'Polaris Leads - Formulaire Web',
            tags: leadData.tags || [],
            customFields: {
                q1_project: leadData.custom.q1_project,
                q2_profession: leadData.custom.q2_profession,
                q3_family: leadData.custom.q3_family,
                q4_revenu: leadData.custom.q4_revenu,
                q5_age: leadData.custom.q5_age,
            },
        };

        // Appeler l'API GHL
        // NOTE: Vérifier l'endpoint exact de GoHighLevel pour votre location/business
        const ghlResponse = await fetch(
            'https://rest.gohighlevel.com/v1/contacts/',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify(ghlPayload),
            }
        );

        if (!ghlResponse.ok) {
            const errorData = await ghlResponse.text();
            console.error('Erreur GHL:', errorData);

            // En développement, retourner quand même le succès pour tester le flux complet
            // En production, lancer une erreur
            if (process.env.NODE_ENV !== 'production') {
                console.log('⚠️ Erreur GHL en dev mode - Continuant pour le test');
                return res.json({
                    success: true,
                    message: 'Lead créé avec succès (dev mode - API key à valider)',
                    leadId: 'dev-' + Date.now(),
                    devMode: true,
                });
            }

            throw new Error(`GHL API Error: ${ghlResponse.status}`);
        }

        const ghlData = await ghlResponse.json();

        res.json({
            success: true,
            message: 'Lead créé avec succès dans GoHighLevel',
            leadId: ghlData.id || ghlData.contact?.id,
        });
    } catch (error) {
        console.error('Erreur création lead:', error);
        res.status(500).json({
            error: 'Erreur lors de la création du lead',
            details: error.message,
        });
    }
});

// ===== DÉMARRER LE SERVEUR =====
app.listen(PORT, () => {
    console.log(`✅ Serveur running sur http://localhost:${PORT}`);
    console.log(`📱 Formulaire Novi Finance accessible à http://localhost:${PORT}`);
});
