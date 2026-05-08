// Test verify-otp API endpoint with valid OTP code
async function testVerifyOTP() {
  console.log('Testing verify-otp API endpoint with valid code...\n');

  // Test data - using the OTP code we saw in the browser logs
  // Note: The phone number used by the API might be different
  const testData = {
    phoneNumber: '+33761234075', // This is what was logged in the console
    otpCode: '417817', // The OTP code from the earlier browser logs
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com',
  };

  console.log('Request body:', testData);
  console.log('\n---\n');

  try {
    const response = await fetch('https://novi-finance-form.vercel.app/api/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('Status:', response.status);

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testVerifyOTP();
