// Configuration
const CONFIG = {
    GHL_API_KEY: 'pit-b513c222-b83a-44db-87d2-dbcad3291bae',
    OTP_TIMEOUT: 10 * 60 * 1000,
    OTP_LENGTH: 4,
};

// Question Definitions
const QUESTIONS = {
    1: {
        title: "Quel est votre principal projet en ce moment ?",
        subtitle: "",
        fieldName: "q1_project",
        options: [
            { value: "preparer_retraite", text: "Préparer ma retraite", icon: "🏠" },
            { value: "reduire_impots", text: "Réduire mes impôts", icon: "💰" },
            { value: "epargner_fructifier", text: "Épargner et faire fructifier mon argent", icon: "📈" },
            { value: "investir_immobilier", text: "Investir dans l'immobilier", icon: "🏢" }
        ]
    },
    2: {
        title: "Quelle est votre situation professionnelle ?",
        subtitle: "",
        fieldName: "q2_profession",
        options: [
            { value: "salarie", text: "Salarié", icon: "💼" },
            { value: "independant", text: "Indépendant / TNS", icon: "🤝" },
            { value: "cadre_dirigeant", text: "Cadre ou dirigeant", icon: "👔" },
            { value: "sans_activite", text: "Sans activité professionnelle", icon: "🏛️" }
        ]
    },
    "2b": {
        title: "Disposez-vous déjà d'un patrimoine ?",
        subtitle: "(Pour les sans activité professionnelle)",
        fieldName: "q2b_patrimoine",
        options: [
            { value: "moins_10k", text: "Moins de 10 000€", icon: "📉" },
            { value: "10k_50k", text: "Entre 10 000€ et 50 000€", icon: "📊" },
            { value: "50k_100k", text: "Entre 50 000€ et 100 000€", icon: "📈" },
            { value: "plus_100k", text: "Plus de 100 000€", icon: "🚀" }
        ]
    },
    3: {
        title: "Quelle est votre situation familiale ?",
        subtitle: "",
        fieldName: "q3_family",
        options: [
            { value: "celibataire", text: "Célibataire", icon: "👤" },
            { value: "couple", text: "En couple", icon: "👥" },
            { value: "famille", text: "Famille avec enfants", icon: "👨‍👩‍👧‍👦" },
            { value: "autre", text: "Autre situation", icon: "🤔" }
        ]
    },
    4: {
        title: "Quel est votre revenu mensuel net approximatif ?",
        subtitle: "",
        fieldName: "q4_revenu",
        options: [
            { value: "moins_2k", text: "Moins de 2 000€", icon: "📉" },
            { value: "2k_4k", text: "Entre 2 000€ et 4 000€", icon: "📊" },
            { value: "4k_6k", text: "Entre 4 000€ et 6 000€", icon: "📈" },
            { value: "plus_6k", text: "Plus de 6 000€", icon: "🚀" }
        ]
    },
    "4b": {
        title: "Disposez-vous déjà d'un patrimoine ?",
        subtitle: "(Pour les revenus faibles)",
        fieldName: "q4b_patrimoine",
        options: [
            { value: "moins_10k", text: "Moins de 10 000€", icon: "📉" },
            { value: "10k_50k", text: "Entre 10 000€ et 50 000€", icon: "📊" },
            { value: "50k_100k", text: "Entre 50 000€ et 100 000€", icon: "📈" },
            { value: "plus_100k", text: "Plus de 100 000€", icon: "🚀" }
        ]
    },
    5: {
        title: "Quelle est votre tranche d'âge ?",
        subtitle: "",
        fieldName: "q5_age",
        options: [
            { value: "30_40", text: "30 - 40 ans", icon: "📆" },
            { value: "40_50", text: "40 - 50 ans", icon: "📆" },
            { value: "50_60", text: "50 - 60 ans", icon: "📆" },
            { value: "60_plus", text: "60 ans et plus", icon: "📆" }
        ]
    },
    6: {
        title: "Quel est votre prénom ?",
        subtitle: "",
        fieldName: "q6_prenom",
        type: "text",
        placeholder: "Jean"
    },
    7: {
        title: "Quel est votre email ?",
        subtitle: "",
        fieldName: "q7_email",
        type: "email",
        placeholder: "jean@example.com"
    },
    8: {
        title: "Quel est votre numéro de téléphone ?",
        subtitle: "",
        fieldName: "q8_phone",
        type: "tel",
        placeholder: "06 12 34 56 78"
    }
};

// State management
let currentStep = 1;
let visibleSteps = [1, 2, 3, 4, 5, 6, 7, 8]; // Default visible steps
let otpVerified = false;
let otpCode = null;
let otpExpiry = null;
let formData = {};

// DOM Elements
const form = document.getElementById('polarisFunnel');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const progressFill = document.getElementById('progressFill');
const stepNumber = document.getElementById('stepNumber');
const totalStepsDisplay = document.getElementById('totalSteps');
const questionCard = document.getElementById('questionCard');
const optionsContainer = document.getElementById('optionsContainer');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const otpBlock = document.getElementById('otpBlock');
const otpStatus = document.getElementById('otpStatus');
const otpTimer = document.getElementById('otpTimer');
const thankYouPage = document.getElementById('thankYouPage');
const exclusionPage = document.getElementById('exclusionPage');
const thankYouName = document.getElementById('thankYouName');
const loadingMessage = document.getElementById('loadingMessage');
const questionTitle = document.getElementById('questionTitle');
const questionSubtitle = document.getElementById('questionSubtitle');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function () {
    updateConditionalSteps();
    updateProgress();
    renderQuestion(currentStep);
});

prevBtn.addEventListener('click', goToPreviousStep);
nextBtn.addEventListener('click', goToNextStep);
submitBtn.addEventListener('click', submitForm);
form.addEventListener('submit', (e) => e.preventDefault());
sendOtpBtn.addEventListener('click', sendOTP);

// ===== SWIPE GESTURE STATE =====
let swipeState = {
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false,
    startTime: 0,
    velocityX: 0,
};

let optionState = {
    currentOptionIndex: 0,
    question: null,
    stepNum: null,
};

// ===== QUESTION RENDERING =====
function renderQuestion(stepNum) {
    const question = QUESTIONS[stepNum];
    if (!question) return;

    questionTitle.textContent = question.title;
    questionSubtitle.textContent = question.subtitle || '';
    optionsContainer.innerHTML = '';

    // Reset swipe state
    swipeState = {
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        isDragging: false,
        startTime: 0,
        velocityX: 0,
    };
    questionCard.style.transform = '';
    questionCard.style.opacity = '1';
    questionCard.classList.remove('dragging', 'removed');

    // Text input fields
    if (question.type) {
        renderTextInput(question);
        // Remove swipe handlers for text input questions
        questionCard.removeEventListener('mousedown', handleSwipeStart);
        questionCard.removeEventListener('touchstart', handleSwipeStart);
    } else {
        // Render swipeable option cards
        renderSwipeableOptions(question, stepNum);
        // Add swipe handlers
        questionCard.addEventListener('mousedown', handleSwipeStart);
        questionCard.addEventListener('touchstart', handleSwipeStart);
    }

    // Special handling for Q8 - show OTP block after selection
    if (stepNum === 8 && formData.q8_phone) {
        otpBlock.style.display = 'block';
    } else {
        otpBlock.style.display = 'none';
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderSwipeableOptions(question, stepNum) {
    optionState.question = question;
    optionState.stepNum = stepNum;
    optionState.currentOptionIndex = 0;

    renderCurrentOption();

    // Store question on the card for swipe detection
    questionCard.dataset.stepNum = stepNum;
    questionCard.dataset.question = JSON.stringify(question);
}

function renderCurrentOption() {
    const question = optionState.question;
    const currentIndex = optionState.currentOptionIndex;
    const option = question.options[currentIndex];

    optionsContainer.innerHTML = '';

    if (!option) return;

    // Large option card for the current choice
    const optionCard = document.createElement('div');
    optionCard.style.cssText = `
        background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
        color: white;
        padding: 40px 24px;
        border-radius: 16px;
        text-align: center;
        margin-bottom: 24px;
        min-height: 200px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
    `;

    optionCard.innerHTML = `
        <div style="font-size: 48px;">${option.icon}</div>
        <div style="font-size: 22px; font-weight: 600;">${option.text}</div>
        <div style="font-size: 12px; opacity: 0.8;">Option ${currentIndex + 1}/${question.options.length}</div>
    `;

    optionsContainer.appendChild(optionCard);

    // Swipe instructions
    const swipeHint = document.createElement('div');
    swipeHint.style.cssText = `
        text-align: center;
        color: var(--text-light);
        font-size: 13px;
        padding: 16px;
        background: var(--bg-mint);
        border-radius: 10px;
        line-height: 1.5;
    `;
    swipeHint.innerHTML = `
        <div>👉 Swipe RIGHT to select this option</div>
        <div style="margin-top: 6px;">👈 Swipe LEFT to see next option</div>
    `;
    optionsContainer.appendChild(swipeHint);
}

function renderTextInput(question) {
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'text-input-field';

    const input = document.createElement('input');
    input.type = question.type;
    input.placeholder = question.placeholder || '';
    input.value = formData[question.fieldName] || '';

    input.addEventListener('input', (e) => {
        formData[question.fieldName] = e.target.value;
        updateFormInputs();
    });

    input.addEventListener('focus', (e) => {
        e.target.style.borderColor = 'var(--primary)';
    });

    input.addEventListener('blur', (e) => {
        e.target.style.borderColor = 'var(--border)';
    });

    inputWrapper.appendChild(input);
    optionsContainer.appendChild(inputWrapper);

    // Auto-focus input
    setTimeout(() => input.focus(), 100);
}

function selectOption(fieldName, value) {
    // Update form data
    formData[fieldName] = value;
    updateFormInputs();

    // Update conditional steps based on new selection
    updateConditionalSteps();

    // Trigger card exit animation
    triggerCardExit();
}

// ===== SWIPE GESTURE HANDLERS =====
function handleSwipeStart(e) {
    if (questionCard.querySelector('.text-input-field')) return; // Skip on text input questions

    swipeState.isDragging = true;
    swipeState.startTime = Date.now();
    swipeState.startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    swipeState.startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    swipeState.currentX = swipeState.startX;

    questionCard.classList.add('dragging');

    const moveHandler = handleSwipeMove;
    const endHandler = handleSwipeEnd;

    // Remove previous listeners to avoid duplicates
    document.removeEventListener('mousemove', moveHandler);
    document.removeEventListener('mouseup', endHandler);
    document.removeEventListener('touchmove', moveHandler);
    document.removeEventListener('touchend', endHandler);

    document.addEventListener(e.type.includes('mouse') ? 'mousemove' : 'touchmove', moveHandler);
    document.addEventListener(e.type.includes('mouse') ? 'mouseup' : 'touchend', endHandler);

    e.preventDefault();
}

function handleSwipeMove(e) {
    if (!swipeState.isDragging) return;

    swipeState.currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const deltaX = swipeState.currentX - swipeState.startX;

    // Apply transform to card
    const rotation = (deltaX / window.innerWidth) * 20; // Max 20 degree rotation
    questionCard.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;

    // Calculate opacity based on distance
    const opacity = 1 - Math.abs(deltaX) / (window.innerWidth * 0.8);
    questionCard.style.opacity = Math.max(0.3, opacity);

    // Visual feedback overlay
    updateSwipeIndicator(deltaX);

    e.preventDefault();
}

function updateSwipeIndicator(deltaX) {
    let indicator = document.getElementById('swipeIndicator');

    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'swipeIndicator';
        indicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translateX(-50%) translateY(-50%);
            font-size: 64px;
            font-weight: 700;
            pointer-events: none;
            z-index: 999;
            text-shadow: 0 2px 8px rgba(0,0,0,0.2);
            opacity: 0;
            transition: opacity 0.1s;
        `;
        document.body.appendChild(indicator);
    }

    if (Math.abs(deltaX) > 30) {
        if (deltaX > 0) {
            indicator.textContent = '✓ SELECT';
            indicator.style.color = 'var(--success)';
            indicator.style.opacity = Math.min(1, Math.abs(deltaX) / 200);
        } else {
            indicator.textContent = 'SKIP ✕';
            indicator.style.color = 'var(--error)';
            indicator.style.opacity = Math.min(1, Math.abs(deltaX) / 200);
        }
    } else {
        indicator.style.opacity = 0;
    }
}

function handleSwipeEnd(e) {
    if (!swipeState.isDragging) return;

    swipeState.isDragging = false;
    questionCard.classList.remove('dragging');

    const deltaX = swipeState.currentX - swipeState.startX;
    const deltaTime = Date.now() - swipeState.startTime;
    const velocity = deltaX / deltaTime; // px/ms

    // Swipe threshold: 50px distance OR 0.3 px/ms velocity
    const minDistance = 50;
    const minVelocity = 0.3;
    const isSwipeRight = Math.abs(deltaX) > minDistance || Math.abs(velocity) > minVelocity;
    const direction = deltaX > 0 ? 'right' : 'left';

    document.removeEventListener('mousemove', handleSwipeMove);
    document.removeEventListener('mouseup', handleSwipeEnd);
    document.removeEventListener('touchmove', handleSwipeMove);
    document.removeEventListener('touchend', handleSwipeEnd);

    if (!isSwipeRight) {
        // Snap back to center
        questionCard.style.transform = '';
        questionCard.style.opacity = '1';
        return;
    }

    // Process swipe
    processSwiperAnswer(direction);
}

function processSwiperAnswer(direction) {
    const question = optionState.question;
    const currentIndex = optionState.currentOptionIndex;
    const option = question.options[currentIndex];

    if (direction === 'right') {
        // Swipe right = select this option and advance
        selectOption(question.fieldName, option.value);
    } else {
        // Swipe left = show next option or advance if at end
        if (currentIndex < question.options.length - 1) {
            optionState.currentOptionIndex++;

            // Reset card animation state
            questionCard.classList.remove('removed');
            questionCard.style.transform = '';
            questionCard.style.opacity = '1';

            renderCurrentOption();
        } else {
            // No more options, skip to next question
            goToNextStep();
        }
    }
}

function triggerCardExit() {
    questionCard.classList.add('removed');

    setTimeout(() => {
        goToNextStep();
    }, 400);
}

// ===== CONDITIONAL STEPS LOGIC =====
function updateConditionalSteps() {
    visibleSteps = [1, 2, 3, 4, 5, 6, 7, 8];

    const q2Value = formData.q2_profession;
    const q4Value = formData.q4_revenu;

    // Add Q2b if sans activité
    if (q2Value === 'sans_activite') {
        visibleSteps.splice(visibleSteps.indexOf(3), 0, '2b');
    }

    // Add Q4b if revenu < 2k
    if (q4Value === 'moins_2k') {
        visibleSteps.splice(visibleSteps.indexOf(6), 0, '4b');
    }

    updateProgress();
}

// ===== FORM VALIDATION =====
function isCurrentStepValid() {
    const question = QUESTIONS[currentStep];
    if (!question) return false;

    const value = formData[question.fieldName];

    if (question.type) {
        // Text field validation
        return value && value.trim().length > 0;
    } else {
        // Option validation
        return !!value;
    }
}

// ===== NAVIGATION =====
function goToNextStep() {
    if (!isCurrentStepValid()) {
        alert('Veuillez compléter cette question');
        return;
    }

    if (currentStep === 8 && !otpVerified) {
        alert('Veuillez vérifier votre numéro de téléphone');
        return;
    }

    const currentIndex = visibleSteps.indexOf(currentStep);
    if (currentIndex < visibleSteps.length - 1) {
        currentStep = visibleSteps[currentIndex + 1];
        updateProgress();
        renderQuestion(currentStep);
        updateButtonVisibility();
    }
}

function goToPreviousStep() {
    const currentIndex = visibleSteps.indexOf(currentStep);
    if (currentIndex > 0) {
        currentStep = visibleSteps[currentIndex - 1];
        updateProgress();
        renderQuestion(currentStep);
        updateButtonVisibility();
    }
}

function updateButtonVisibility() {
    const currentIndex = visibleSteps.indexOf(currentStep);
    const isFirstStep = currentIndex === 0;
    const isLastStep = currentIndex === visibleSteps.length - 1;
    const question = QUESTIONS[currentStep];
    const isTextInput = question && question.type;

    // Show buttons only for text input questions
    if (isTextInput) {
        prevBtn.style.display = isFirstStep ? 'none' : 'block';
        nextBtn.style.display = isLastStep ? 'none' : 'block';
        submitBtn.style.display = isLastStep ? 'block' : 'none';
    } else {
        // Hide buttons for swipe questions
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'none';
    }
}

function updateProgress() {
    const currentIndex = visibleSteps.indexOf(currentStep);
    const progress = ((currentIndex + 1) / visibleSteps.length) * 100;
    progressFill.style.width = progress + '%';
    stepNumber.textContent = currentIndex + 1;
    totalStepsDisplay.textContent = visibleSteps.length;
    updateButtonVisibility();
}

function updateFormInputs() {
    // Update hidden form inputs
    for (let [key, value] of Object.entries(formData)) {
        const input = document.getElementById(key);
        if (input) input.value = value;
    }
}

// ===== PHONE NORMALIZATION =====
function normalizePhoneNumber(phone) {
    const cleaned = phone.replace(/\s/g, '');
    if (cleaned.startsWith('06') || cleaned.startsWith('07')) {
        return '+33' + cleaned.slice(1);
    }
    return cleaned;
}

// ===== OTP HANDLING =====
async function sendOTP() {
    let phoneNumber = formData.q8_phone?.trim();

    if (!phoneNumber) {
        otpStatus.textContent = '❌ Veuillez entrer votre numéro';
        otpStatus.classList.add('error');
        return;
    }

    // Validate French phone format (06/07 or +33)
    if (!/^(\+33|0)[1-9]\d{8}$/.test(phoneNumber.replace(/\s/g, ''))) {
        otpStatus.textContent = '❌ Numéro de téléphone invalide';
        otpStatus.classList.add('error');
        return;
    }

    // Normalize to +33 format
    phoneNumber = normalizePhoneNumber(phoneNumber);

    sendOtpBtn.disabled = true;
    otpStatus.textContent = '⏳ Envoi du code...';
    otpStatus.classList.remove('error', 'success');

    try {
        const response = await fetch('/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber }),
        });

        if (!response.ok) throw new Error('Erreur lors de l\'envoi du code');

        otpExpiry = Date.now() + CONFIG.OTP_TIMEOUT;

        otpStatus.textContent = '✓ Code envoyé avec succès';
        otpStatus.classList.add('success');
        otpStatus.classList.remove('error');

        startOTPTimer();

        setTimeout(() => {
            document.getElementById('otpCode').focus();
        }, 300);
    } catch (error) {
        console.error('Erreur OTP:', error);
        otpStatus.textContent = '❌ Erreur lors de l\'envoi. Réessayez.';
        otpStatus.classList.add('error');
        sendOtpBtn.disabled = false;
    }
}

function startOTPTimer() {
    const otpInput = document.getElementById('otpCode');
    otpInput.addEventListener('input', verifyOTPRealtime);

    const timerInterval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((otpExpiry - Date.now()) / 1000));
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;

        otpTimer.textContent = `Expire dans: ${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (remaining === 0) {
            clearInterval(timerInterval);
            otpBlock.style.display = 'none';
            otpStatus.textContent = '⚠️ Le code a expiré. Envoyez un nouveau code.';
            otpStatus.classList.add('error');
            sendOtpBtn.disabled = false;
            otpInput.removeEventListener('input', verifyOTPRealtime);
        }
    }, 1000);
}

async function verifyOTPRealtime() {
    const otpInput = document.getElementById('otpCode');
    const enteredCode = otpInput.value.trim();

    if (enteredCode.length === CONFIG.OTP_LENGTH) {
        otpStatus.textContent = '⏳ Vérification...';
        otpStatus.classList.remove('error', 'success');

        try {
            const response = await fetch('/api/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber: normalizePhoneNumber(formData.q8_phone),
                    otpCode: enteredCode,
                    firstName: formData.q6_prenom,
                    lastName: formData.q6_prenom,
                    email: formData.q7_email,
                }),
            });

            if (response.ok) {
                otpVerified = true;
                otpStatus.textContent = '✓ Numéro de téléphone vérifié';
                otpStatus.classList.add('success');
                otpStatus.classList.remove('error');
                otpInput.disabled = true;
                sendOtpBtn.disabled = true;
            } else {
                const error = await response.json();
                otpStatus.textContent = '❌ ' + (error.error || 'Code incorrect');
                otpStatus.classList.add('error');
                otpStatus.classList.remove('success');
                otpVerified = false;
            }
        } catch (error) {
            console.error('Erreur vérification OTP:', error);
            otpStatus.textContent = '❌ Erreur lors de la vérification';
            otpStatus.classList.add('error');
            otpVerified = false;
        }
    }
}

// ===== FORM SUBMISSION =====
async function submitForm(e) {
    e.preventDefault();

    const q2Value = formData.q2_profession;
    const q4Value = formData.q4_revenu;

    // Exclusion checks
    if (q2Value === 'sans_activite' && formData.q2b_patrimoine === 'moins_10k') {
        showExclusionPage();
        return;
    }

    if (q4Value === 'moins_2k' && formData.q4b_patrimoine === 'moins_10k') {
        showExclusionPage();
        return;
    }

    const leadData = {
        firstName: formData.q6_prenom,
        lastName: formData.q6_prenom, // Using same for last name
        email: formData.q7_email,
        phone: formData.q8_phone,
        tags: [],
        custom: {
            q1_project: formData.q1_project,
            q2_profession: formData.q2_profession,
            q3_family: formData.q3_family,
            q4_revenu: formData.q4_revenu,
            q5_age: formData.q5_age,
        },
    };

    if (q2Value === 'sans_activite' && formData.q2b_patrimoine) {
        leadData.tags.push('Sans activité — patrimoine existant');
    }

    if (q4Value === 'moins_2k' && formData.q4b_patrimoine) {
        leadData.tags.push('Revenu faible — patrimoine existant');
    }

    submitBtn.disabled = true;
    showThankYouPage();
}

function showThankYouPage() {
    document.querySelector('.form-section').style.display = 'none';
    thankYouName.textContent = formData.q6_prenom;
    thankYouPage.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showExclusionPage() {
    document.querySelector('.form-section').style.display = 'none';
    exclusionPage.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
