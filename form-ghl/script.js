// Get URL parameters
const params = new URLSearchParams(window.location.search);
const variant = params.get('v') || 'a';

// Form data storage
const formData = {};
let currentStep = 0; // 0-based index into STEPS array
const STEPS = [
  { id: 'age', fieldName: 'q1_age', title: 'Tranche d\'âge' },
  { id: 'famille', fieldName: 'q2_family', title: 'Situation familiale' },
  { id: 'impots', fieldName: 'q3_taxes', title: 'Montant d\'impôts annuel' },
  { id: 'patrimoine', fieldName: 'q4_patrimoine', title: 'Patrimoine financier' },
  { id: 'objectif', fieldName: 'q5_objective', title: 'Objectif principal' },
  { id: 'contact', fieldName: 'contact', title: 'Vos coordonnées' },
  { id: 'otp', fieldName: 'otp', title: 'Vérifiez votre numéro' }
];

let otpVerified = false;
let userPhone = '';

// Update progress bar
function updateProgress() {
  const pct = Math.round((currentStep / (STEPS.length - 1)) * 100);
  const progressBar = document.getElementById('progressBar');
  if (progressBar) {
    progressBar.style.width = pct + '%';
  }
  // Update percentage text if it exists
  const progressPct = document.querySelector('[data-progress-pct]');
  if (progressPct) {
    progressPct.textContent = pct + '%';
  }
}

// Select option for a question
function selectOption(questionId, value, element) {
  // Find the step card for this question
  const stepCard = document.querySelector(`[data-step-id="${questionId}"]`);
  if (!stepCard) return;

  // Update all option rows in this step
  const optionRows = stepCard.querySelectorAll('.option-row');
  optionRows.forEach(row => {
    if (row.getAttribute('data-value') === value) {
      row.classList.add('selected');
    } else {
      row.classList.remove('selected');
    }
  });

  // Store the selection
  formData[questionId] = value;

  // Auto-advance to next step after short delay
  setTimeout(() => {
    nextQuestion();
  }, 220);
}

// Advance to next question
function nextQuestion() {
  // Find current step
  const currentStepData = STEPS[currentStep];

  // Validate current step based on type
  if (currentStepData.id === 'contact') {
    if (!validateContactInfo()) return;
  } else if (currentStepData.id === 'otp') {
    if (!validateOTP()) return;
  } else {
    // For option-based steps, check if answer is selected
    if (!formData[currentStepData.id]) return;
  }

  // Hide current step card
  const currentStepCard = document.querySelector(`[data-step-id="${currentStepData.id}"]`);
  if (currentStepCard) {
    currentStepCard.classList.remove('active');
    currentStepCard.classList.add('completed');
  }

  // Move to next step
  currentStep++;
  if (currentStep >= STEPS.length) {
    currentStep = STEPS.length - 1;
    return;
  }

  // Show next step card
  const nextStepData = STEPS[currentStep];
  const nextStepCard = document.querySelector(`[data-step-id="${nextStepData.id}"]`);
  if (nextStepCard) {
    nextStepCard.classList.add('active');
    nextStepCard.classList.remove('completed', 'future');
  }

  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Go back to previous question
function prevQuestion() {
  // Hide current step
  const currentStepData = STEPS[currentStep];
  const currentStepCard = document.querySelector(`[data-step-id="${currentStepData.id}"]`);
  if (currentStepCard) {
    currentStepCard.classList.remove('active');
  }

  // Move to previous step
  currentStep--;
  if (currentStep < 0) {
    currentStep = 0;
  }

  // Show previous step
  const prevStepData = STEPS[currentStep];
  const prevStepCard = document.querySelector(`[data-step-id="${prevStepData.id}"]`);
  if (prevStepCard) {
    prevStepCard.classList.remove('completed', 'future');
    prevStepCard.classList.add('active');
  }

  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Contact info validation (FIX BUG 2: Updated field IDs)
function validateContactInfo() {
  let valid = true;
  const errorNom = document.getElementById('error-nom') || document.getElementById('contact-error-nom');
  const errorEmail = document.getElementById('error-email') || document.getElementById('contact-error-email');
  const errorPhone = document.getElementById('error-phone') || document.getElementById('contact-error-phone');

  // Clear errors
  if (errorNom) errorNom.textContent = '';
  if (errorEmail) errorEmail.textContent = '';
  if (errorPhone) errorPhone.textContent = '';

  // Get form fields with new IDs
  const nomField = document.getElementById('q6_nom');
  const nomLastField = document.getElementById('q6_nom_last');
  const emailField = document.getElementById('q6_email');
  const phoneField = document.getElementById('q7_phone');

  const nom = nomField ? nomField.value.trim() : '';
  const nomLast = nomLastField ? nomLastField.value.trim() : '';
  const email = emailField ? emailField.value.trim() : '';
  const phone = phoneField ? phoneField.value.trim() : '';

  // Validate name
  if (!nom || !nomLast) {
    if (errorNom) errorNom.textContent = 'Veuillez entrer votre nom complet';
    if (nomField) nomField.classList.add('input-error');
    if (nomLastField) nomLastField.classList.add('input-error');
    valid = false;
  } else {
    if (nomField) nomField.classList.remove('input-error');
    if (nomLastField) nomLastField.classList.remove('input-error');
  }

  // Validate email
  if (!email || !email.includes('@')) {
    if (errorEmail) errorEmail.textContent = 'Veuillez entrer un email valide';
    if (emailField) emailField.classList.add('input-error');
    valid = false;
  } else {
    if (emailField) emailField.classList.remove('input-error');
  }

  // Validate phone
  if (!phone) {
    if (errorPhone) errorPhone.textContent = 'Veuillez entrer votre téléphone';
    if (phoneField) phoneField.classList.add('input-error');
    valid = false;
  } else {
    if (phoneField) phoneField.classList.remove('input-error');
  }

  if (valid) {
    formData.q6_nom = nom;
    formData.q6_nom_last = nomLast;
    formData.q6_email = email;
    userPhone = phone;
  }

  return valid;
}

// Send OTP via Twilio
async function sendOTP() {
  if (!validateContactInfo()) return;

  const btn = document.getElementById('sendOtpBtn') || document.querySelector('button[onclick="sendOTP()"]');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>Envoi en cours...';
  }

  try {
    const response = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: userPhone,
        variant: variant
      })
    });

    const data = await response.json();

    if (data.success) {
      // Move to OTP step
      currentStep = STEPS.findIndex(s => s.id === 'otp');

      // Hide contact step, show OTP step
      const contactCard = document.querySelector('[data-step-id="contact"]');
      if (contactCard) {
        contactCard.classList.remove('active');
        contactCard.classList.add('completed');
      }

      const otpCard = document.querySelector('[data-step-id="otp"]');
      if (otpCard) {
        otpCard.classList.add('active');
      }

      // Update progress
      updateProgress();

      // Show OTP message
      const otpMessage = document.getElementById('otp-message');
      if (otpMessage) {
        otpMessage.textContent = 'Code envoyé. Consultez vos SMS.';
      }

      // Track OTP event
      if (typeof fbq !== 'undefined') {
        fbq('track', 'OTPSent', { phone: userPhone, variant: variant });
      }
    } else {
      const errorPhone = document.getElementById('contact-error-phone');
      if (errorPhone) {
        errorPhone.textContent = data.message || 'Erreur lors de l\'envoi du code';
      }
    }
  } catch (error) {
    console.error('OTP Error:', error);
    const errorPhone = document.getElementById('contact-error-phone');
    if (errorPhone) {
      errorPhone.textContent = 'Erreur réseau. Veuillez réessayer.';
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Envoyer le code';
    }
  }
}

// Handle OTP input - auto-fill and focus next field
function handleOtpInput(e) {
  const input = e.target;

  // Only allow digits
  input.value = input.value.replace(/[^0-9]/g, '');

  // Move to next field
  if (input.value && input.nextElementSibling) {
    input.nextElementSibling.focus();
  }

  // Check if all fields are filled
  const otpSlots = document.querySelectorAll('.otp-slot input');
  const allFilled = Array.from(otpSlots).every(el => el.value !== '');

  if (allFilled) {
    verifyOTP();
  }
}

// Verify OTP code
async function verifyOTP() {
  const otpSlots = document.querySelectorAll('.otp-slot input');
  const otp = Array.from(otpSlots).map(el => el.value).join('');

  if (otp.length !== 6) {
    const errorOtp = document.getElementById('otp-error');
    if (errorOtp) {
      errorOtp.textContent = 'Veuillez entrer les 6 chiffres';
    }
    return;
  }

  try {
    const response = await fetch('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: userPhone,
        otp: otp,
        email: formData.q6_email,
        nom: formData.q6_nom,
        variant: variant
      })
    });

    const data = await response.json();

    if (data.success) {
      otpVerified = true;

      const errorOtp = document.getElementById('otp-error');
      if (errorOtp) {
        errorOtp.textContent = '';
      }

      const otpMessage = document.getElementById('otp-message');
      if (otpMessage) {
        otpMessage.textContent = 'Code vérifié! ✓';
        otpMessage.style.color = 'var(--copper-light)';
      }

      // Track OTP verified event
      if (typeof fbq !== 'undefined') {
        fbq('track', 'OTPVerified', { phone: userPhone, variant: variant });
      }

      // Auto-submit form after OTP verification
      setTimeout(() => {
        submitForm();
      }, 1000);
    } else {
      const errorOtp = document.getElementById('otp-error');
      if (errorOtp) {
        errorOtp.textContent = data.message || 'Code incorrect';
      }

      otpSlots.forEach(el => {
        el.classList.remove('filled');
      });
    }
  } catch (error) {
    console.error('Verify OTP Error:', error);
    const errorOtp = document.getElementById('otp-error');
    if (errorOtp) {
      errorOtp.textContent = 'Erreur réseau';
    }
  }
}

// Validate OTP (check it's been verified)
function validateOTP() {
  if (!otpVerified) {
    const errorOtp = document.getElementById('otp-error');
    if (errorOtp) {
      errorOtp.textContent = 'Veuillez vérifier votre code OTP';
    }
    return false;
  }
  return true;
}

// FIX BUG 1: Check exclusions with correct field logic
// Exclusion criteria: if impots < 2000€ OR patrimoine < 20000€
function checkExclusions() {
  const impots = formData.q3_taxes;
  const patrimoine = formData.q4_patrimoine;

  // Parse tax values: <2k, 2-5k, 5-10k, >10k
  const impottsExcluded = impots === '<2k';

  // Parse patrimoine values: <20k, 20-100k, 100-300k, >300k
  const patrimoineExcluded = patrimoine === '<20k';

  // Exclude if either condition is met
  return impottsExcluded || patrimoineExcluded;
}

// Submit form after OTP verification
async function submitForm() {
  if (!otpVerified) {
    const errorOtp = document.getElementById('otp-error');
    if (errorOtp) {
      errorOtp.textContent = 'Veuillez vérifier votre code OTP';
    }
    return;
  }

  // Collect all form data
  const nomComplet = (formData.q6_nom || '') + ' ' + (formData.q6_nom_last || '');
  const prenom = (formData.q6_nom || '').split(' ')[0];

  const formDataFinal = {
    ...formData,
    q6_nom_complet: nomComplet.trim(),
    q6_email: formData.q6_email,
    q7_phone: userPhone,
    variant: variant,
    timestamp: new Date().toISOString()
  };

  // Check exclusions - show exclusion page if needed
  if (checkExclusions()) {
    // Show exclusion loader briefly, then redirect to exclusion page
    const loaderCard = document.querySelector('[data-exclusion-loader]');
    const otpCard = document.querySelector('[data-step-id="otp"]');

    if (otpCard) {
      otpCard.classList.remove('active');
    }

    if (loaderCard) {
      loaderCard.classList.add('active');
    }

    // Silent redirect after 800ms (as per design spec)
    setTimeout(() => {
      window.location.href = '/exclusion.html?v=' + variant;
    }, 800);

    return;
  }

  // FIX BUG 3: Call /api/trigger-ghl-automation endpoint
  const btn = document.getElementById('submitBtn') || document.querySelector('button[onclick="submitForm()"]');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>Envoi...';
  }

  try {
    // Trigger GHL automation (create lead + send email)
    const ghlResponse = await fetch('/api/trigger-ghl-automation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formDataFinal)
    });

    const ghlData = await ghlResponse.json();

    // Track form submission
    if (typeof fbq !== 'undefined') {
      fbq('track', 'FormSubmitted', {
        email: formDataFinal.q6_email,
        variant: variant
      });
    }

    // Send to Meta CAPI (Conversions API) if endpoint exists
    await fetch('/api/track-meta-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'FormSubmitted',
        email: formDataFinal.q6_email,
        phone: formDataFinal.q7_phone,
        variant: variant
      })
    }).catch(e => console.log('Meta CAPI call failed (non-critical):', e));

    // Redirect to thank you page
    const redirectUrl = '/thank-you.html?v=' + variant + '&name=' + encodeURIComponent(prenom);
    window.location.href = redirectUrl;
  } catch (error) {
    console.error('Form submission error:', error);
    alert('Une erreur s\'est produite. Veuillez réessayer.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Recevoir mon bilan';
    }
  }
}

// Show form and hide CTA
function showForm() {
  const ctaContainer = document.getElementById('ctaContainer');
  const formContainer = document.getElementById('formContainer');

  if (ctaContainer) {
    ctaContainer.style.display = 'none';
  }

  if (formContainer) {
    formContainer.classList.add('show');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Toggle FAQ items
function toggleFaq(element) {
  const answer = element.nextElementSibling;
  const isOpen = element.classList.contains('open');

  // Close all other FAQ items
  document.querySelectorAll('.faq-question').forEach(faq => {
    if (faq !== element) {
      faq.classList.remove('open');
      if (faq.nextElementSibling) {
        faq.nextElementSibling.style.display = 'none';
      }
    }
  });

  // Toggle current item
  if (isOpen) {
    element.classList.remove('open');
    if (answer) answer.style.display = 'none';
  } else {
    element.classList.add('open');
    if (answer) answer.style.display = 'block';
  }
}

// Initialize form
function initializeForm() {
  currentStep = 0;

  // Show first step card
  const firstStepCard = document.querySelector('[data-step-id="age"]');
  if (firstStepCard) {
    firstStepCard.classList.add('active');
  }

  // Mark other steps as future
  STEPS.slice(1).forEach(step => {
    const card = document.querySelector(`[data-step-id="${step.id}"]`);
    if (card && !card.classList.contains('completed')) {
      card.classList.add('future');
    }
  });

  updateProgress();

  // Clear all error messages
  document.querySelectorAll('[class*="error"]').forEach(el => {
    el.textContent = '';
  });
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeForm);
} else {
  initializeForm();
}
