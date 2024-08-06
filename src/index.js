const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const CryptoJS = require('crypto-js');
const express = require('express');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://crunchquest-default-rtdb.firebaseio.com'
});

const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.json());

const apikey = process.env.IPAYMU_API_KEY || "SANDBOX08F5A37E-D33D-405D-8217-AD1A1678B798"; // Replace with your iPaymu API key
const va = process.env.IPAYMU_VA || "0000001318509968"; // Replace with your iPaymu VA

function getCurrentTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
}

function generateSHA256Hash(body) {
  return CryptoJS.SHA256(body).toString(CryptoJS.enc.Hex);
}

function generateSignature(method, va, requestBodyHash, apiKey) {
  const stringToSign = `${method}:${va}:${requestBodyHash}:${apiKey}`;
  const signature = CryptoJS.HmacSHA256(stringToSign, apiKey).toString(CryptoJS.enc.Hex);
  return signature;
}

app.post('/payment/generate_payment_url', async (req, res) => {
  try {
    const { serviceRequest, user } = req.body;
    
    if (!serviceRequest || !user) {
      console.error('Invalid request body:', req.body);
      return res.status(400).send('Invalid request body');
    }
    
    const request_id = uuidv4();
    const url = 'https://sandbox.ipaymu.com/api/v2/payment'; // Redirect payment endpoint
    const requestTimestamp = getCurrentTimestamp();
    
    // Prepare the jsonBody
    const jsonBody = {
      product: [`${serviceRequest.title}`],
      qty: ["1"],
      price: [`${serviceRequest.price}`],
      description: [`${serviceRequest.description}`],
      returnUrl: 'https://ipaymu.com/return',
      notifyUrl: 'https://ipaymu.com/notify',
      cancelUrl: 'https://ipaymu.com/cancel',
      referenceId: request_id,
      buyerName: `${user.firstName} ${user.lastName}`,
      buyerEmail: user.emailAddress || "no-email@example.com",
      buyerPhone: user.mobileNumber || "081234567890",
    };

    console.log('Payment Request JSON Body:', JSON.stringify(jsonBody));

    const requestBodyHash = generateSHA256Hash(JSON.stringify(jsonBody));
    console.log('Payment Request Body Hash:', requestBodyHash);

    const signature = generateSignature('POST', va, requestBodyHash, apikey);
    console.log('Payment Request Signature:', signature);

    const fetch = (await import('node-fetch')).default;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'va': va,
        'signature': signature,
        'timestamp': requestTimestamp,
        'Accept': 'application/json'
      },
      body: JSON.stringify(jsonBody)
    });

    // Get raw response body
    const responseText = await response.text();
    console.log('iPaymu API Raw Response:', responseText);

    // Parse and log JSON data
    const responseData = JSON.parse(responseText);
    console.log('iPaymu API Parsed Response Data:', responseData);

    // Accessing the payment URL from the response
    const paymentUrl = responseData.Data?.Url;

    if (!paymentUrl) {
      console.error('Payment URL is undefined in iPaymu API response');
      throw new Error('Payment URL is undefined');
    }

    console.log('Payment URL:', paymentUrl);

    res.status(200).send({ paymentUrl });
  } catch (error) {
    console.error('Error generating payment URL:', error.message);

    if (error.response && error.response.data && error.response.data.Message === 'unauthorized signature') {
      res.status(401).send('Unauthorized signature');
    } else {
      res.status(500).send('Internal Server Error');
    }
  }
});

// Create the HTTP function for Firebase
exports.api = functions.https.onRequest(app);

// Start the server locally on port 8000
if (require.main === module) {
  app.listen(8000, () => {
    console.log('Server running on port 8000');
  });
}
