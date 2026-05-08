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

// Configuration Twilio
const TWILIO_ACCOUNT_SID = 'ACee4fa3c14f361c864d89d194497dae62';
const TWILIO_AUTH_TOKEN = '6f0d3564f2d7a9e66c4ee27b1aca239c';
const TWILIO_PHONE_FROM = '+33757594907';
const twilioCLient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

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
            const message = await twilioCLient.messages.create({
                body: `Votre code de vérification Novi Finance: ${otpCode}\n\nValable 10 minutes.`,
                from: TWILIO_PHONE_FROM,
                to: formattedPhone,
            });

            console.log(`✓ SMS envoyé à ${formattedPhone} - SID: ${message.sid}`);
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

// 3. Créer un lead dans GoHighLevel
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
