# Novi Finance Form Integration Guide

## Overview
This document describes the integration of the Novi Finance Velvet/Glass morphism design system with the existing form-ghl Express.js backend. The new design system provides an improved user experience with a multi-step form flow, silent exclusion logic, and responsive variants (mobile 390px / desktop 1280px).

## Completed Components

### Phase 1: Design System Foundation ✓
- **styles.css**: Complete replacement with Novi Finance design tokens
  - Color palette: Velvet (#0A0908), Copper (#B87333, #E89E5C)
  - Typography: Instrument Serif, Inter, JetBrains Mono
  - Glass morphism: `backdrop-filter: blur(30px) saturate(160%)`
  - Component classes: `.glass`, `.btn-primary`, `.step-card`, `.option-row`, `.input-field`, `.otp-slot`
  - Responsive breakpoints: 640px (mobile), 1024px+ (desktop)

- **index.html**: Complete restructure with new form flow
  - Form field IDs: q1_age, q2_family, q3_taxes, q4_patrimoine, q5_objective, q6_nom, q6_nom_last, q6_email, q7_phone
  - 7-step form: Age → Family → Taxes → Patrimoine → Objective → Contact → OTP
  - Step cards with active/completed/future states
  - Progress bar with percentage display
  - Sticky header with mini counter (−2 380 €/an)

### Phase 2: Form Logic & State Management ✓
- **script.js**: Updated with new DOM structure and 3 critical bug fixes
  - Bug Fix 1: `checkExclusions()` now uses correct field logic
    - Excludes if: `q3_taxes === '<2k'` OR `q4_patrimoine === '<20k'`
  - Bug Fix 2: Updated form field references
    - Changed: q6_nom_complet → q6_nom, q6_nom_last (separated)
  - Bug Fix 3: Added `/api/trigger-ghl-automation` endpoint support
  - Functions: selectOption(), nextQuestion(), prevQuestion(), sendOTP(), verifyOTP(), submitForm()
  - OTP input handling with auto-focus to next field
  - Silent exclusion with 800ms spinner delay

### Phase 3: Backend Verification & Enhancement ✓
- **server.js**: Added `/api/trigger-ghl-automation` endpoint
  - Accepts form data with all new field names
  - Prepares GHL contact data with custom fields
  - Supports development mode (returns success without actual GHL API call)
  - Handles phone number formatting (+33 prefix for French numbers)
  - Logs lead creation for debugging

### Phase 4: Exclusion Page ✓
- **exclusion.html**: Silent exclusion page
  - Displays spinner during 800ms analysis delay
  - Shows non-threatening message
  - Privacy notice about data handling
  - No rejection language (silent exclusion)

### Phase 5: Thank You Page ✓
- **thank-you.html**: Success confirmation page
  - Personalized greeting with user's first name
  - Next steps information
  - Privacy assurance message
  - Meta Pixel tracking for conversions
  - Optional: Redirect home button

### Phase 6: Responsive Design ✓
- Styles already included in styles.css
- Mobile breakpoint: 640px max-width
- Desktop: Full-width with max-width constraints
- Responsive typography and spacing

## How to Test

### 1. Start the Server
```bash
node server.js
```
Server runs on `http://localhost:3000`

### 2. Test Basic Form Flow
1. Open `http://localhost:3000` in browser
2. Complete all 5 questions:
   - Q1: Select an age range (e.g., "30–40 ans")
   - Q2: Select family status (e.g., "En couple")
   - Q3: Select tax amount (e.g., "Entre 5 000 € et 10 000 € / an")
   - Q4: Select patrimoine (e.g., "Entre 100 000 € et 300 000 €")
   - Q5: Select objective (e.g., "Préparer ma retraite")
3. Verify progress bar advances (0% → 100%)
4. Verify each step card shows "completed" state

### 3. Test Contact Info Step
1. After Q5, form advances to Contact Info step
2. Enter name: "Marc"
3. Enter last name: "Dupont"
4. Enter email: "marc.dupont@gmail.com"
5. Click "Continuer"

### 4. Test OTP Flow
1. After Contact Info, OTP step appears
2. Form calls `/api/send-otp` with phone number
3. Server returns OTP code (visible in dev mode)
4. Enter 6-digit code in OTP slots
5. Form auto-advances to next field on each digit
6. On completion, form calls `/api/verify-otp`
7. On success, form redirects to thank-you.html

### 5. Test Exclusion Logic
1. Start new form
2. Select exclusion criteria:
   - Q3: "Moins de 2 000 € / an" OR
   - Q4: "Moins de 20 000 €"
3. Complete remaining questions and OTP
4. On form submission, verify:
   - Spinner appears for 800ms
   - Silent redirect to `/exclusion.html`
   - No rejection message shown

### 6. Test Mobile Responsiveness
1. Resize browser to 390px width
2. Verify:
   - Single column layout
   - Readable text and inputs
   - Touch-friendly button sizes
   - Progress bar still visible at top

### 7. Test Desktop Layout
1. Resize browser to 1280px width
2. Verify:
   - Centered content with max-width constraints
   - Proper spacing and typography
   - All elements visible and usable

## API Endpoints

### POST /api/send-otp
**Request:**
```json
{
  "phone": "+33612345678",
  "variant": "default"
}
```
**Response (success):**
```json
{
  "success": true,
  "message": "Code OTP envoyé avec succès",
  "otpCode": "123456"  // Dev mode only
}
```

### POST /api/verify-otp
**Request:**
```json
{
  "phone": "+33612345678",
  "otp": "123456",
  "email": "user@example.com",
  "nom": "Marc",
  "variant": "default"
}
```
**Response (success):**
```json
{
  "success": true,
  "message": "Numéro de téléphone vérifié avec succès"
}
```

### POST /api/trigger-ghl-automation
**Request:**
```json
{
  "q1_age": "30-40",
  "q2_family": "couple",
  "q3_taxes": "5-10k",
  "q4_patrimoine": "100-300k",
  "q5_objective": "retraite",
  "q6_nom": "Marc",
  "q6_nom_last": "Dupont",
  "q6_email": "marc.dupont@gmail.com",
  "q7_phone": "+33612345678",
  "variant": "default",
  "timestamp": "2026-05-08T10:30:00Z"
}
```
**Response (success):**
```json
{
  "success": true,
  "message": "Lead créé et automatisation déclenchée avec succès",
  "leadId": "ghl-1715174400000",
  "contact": {
    "name": "Marc Dupont",
    "email": "marc.dupont@gmail.com",
    "phone": "+33612345678"
  },
  "devMode": true
}
```

## Configuration & Next Steps

### 1. GoHighLevel (GHL) Integration
**Current Status:** Development mode (no real API calls)

**To Enable Production:**
1. Get your GHL Location ID and API Key
2. Set environment variables:
   ```bash
   export GHL_LOCATION_ID="your_location_id"
   export GHL_API_KEY="your_api_key"
   export NODE_ENV="production"
   ```
3. Uncomment GHL API call in `/api/trigger-ghl-automation` endpoint (lines ~180-210 in server.js)
4. Update custom field names in GHL to match: "Âge", "Situation familiale", "Impôts annuels", etc.

**GHL Automation Setup:**
- Contact is created with tags: `['novi-finance', variant]`
- Custom fields populated from form answers
- Set up automation workflow in GHL to:
  - Send welcome email with estimation PDF
  - Schedule call with qualified leads
  - Tag excluded users separately (optional)

### 2. Meta Pixel Integration
**Current Status:** Code placeholders in place, not fully integrated

**To Enable:**
1. Add Meta Pixel ID to index.html `<head>`:
   ```html
   <script>
     !function(f,b,e,v,n,t,s){...your Meta Pixel code...}
   </script>
   ```
2. Update endpoints that call Meta CAPI:
   - Currently calling `/api/track-meta-event` (not implemented)
   - Implement this endpoint to send conversion events to Meta

### 3. Email & PDF Generation
**Current Status:** Not implemented

**To Add:**
1. When GHL automation triggers, it should:
   - Generate personalized estimation PDF
   - Send email with PDF attachment to user
2. Use template from Novi Finance brand guidelines
3. Include estimated savings (−2 380 €/an) personalized to user profile

### 4. Phone Number Validation
**Current Status:** Basic formatting only

**To Enhance:**
1. Add phone number validation library (e.g., libphonenumber-js)
2. Support international numbers, not just French
3. Validate format before OTP send

### 5. Error Handling & Retry Logic
**Current Status:** Basic error messages

**To Improve:**
1. Add retry logic for failed API calls
2. Better error messages for specific failures:
   - "Invalid phone number"
   - "Email already registered"
   - "Network timeout - please retry"
3. Log errors with request IDs for debugging

## File Structure
```
form-ghl/
├── index.html              # Main form page (7-step form)
├── styles.css              # Novi Finance design system
├── script.js               # Form logic & state management
├── server.js               # Express.js backend
├── exclusion.html          # Silent exclusion page
├── thank-you.html          # Success confirmation page
├── INTEGRATION_GUIDE.md    # This file
└── package.json            # Dependencies
```

## Key Metrics to Track
- Form abandonment rate (which step do users exit?)
- Time to complete (90 seconds target)
- Exclusion rate (% of users who don't meet criteria)
- OTP success rate (% of OTPs that verify successfully)
- Form submission rate (% who complete all steps)
- Meta Pixel conversions (for Facebook ad targeting)

## Troubleshooting

### Form Not Loading
- Check if `index.html` is being served at root (/)
- Verify styles.css is linked and fonts are loading
- Check browser console for JavaScript errors

### OTP Not Sending
- Verify Twilio credentials in server.js (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
- Check phone number format (should be +33... for French)
- In dev mode, OTP code is returned in response

### Form Not Submitting
- Verify `/api/trigger-ghl-automation` endpoint exists in server.js
- Check GHL credentials are set (in production)
- Check browser console for fetch errors
- Verify all required form fields are filled

### Progress Bar Not Moving
- Check if `selectOption()` is being called on option selection
- Verify `.option-row` elements have proper `onclick` handlers
- Check browser console for JavaScript errors in script.js

## Support & Maintenance

### Regular Checks
- Monitor form completion rates weekly
- Check error logs in server console
- Validate OTP success rate (should be >95%)
- Test form flow monthly with real phone numbers

### Update Schedule
- Update GHL custom field mappings if field names change
- Update Meta Pixel events if conversion goals change
- Refresh Twilio credentials if compromised
- Update TypeScript/JavaScript dependencies quarterly

## Questions & Support
For issues or questions about this integration:
1. Check the Troubleshooting section above
2. Review script.js comments for function documentation
3. Check server.js comments for endpoint details
4. Reference the original Novi Finance design system documentation
