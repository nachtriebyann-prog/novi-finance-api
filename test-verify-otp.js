// Test verify-otp API endpoint directly
async function testVerifyOTP() {
  console.log('Testing verify-otp API endpoint...\n');

  // Test data
  const testData = {
    phoneNumber: '+33757594907',
    otpCode: '123456', // We'll use a dummy code for now to see the error
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
