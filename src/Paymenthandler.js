// paymentHandler.js
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const admin = require('firebase-admin');
const db = require('../Firebase'); // Ensure this is the correct path to your Firebase configuration

const client_id = 'BRN-0208-1716179958112'; // Change with your client-id
const secret_key = 'SK-sLHIfTLsCKCmbSs5Dafo'; // Change with your secret-key

// Function to get the current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString().slice(0, 19) + 'Z';
}

// Function to generate digest
function generateDigest(jsonBody) {
  const jsonStringHash256 = crypto.createHash('sha256').update(jsonBody, 'utf-8').digest();
  return Buffer.from(jsonStringHash256).toString('base64');
}

// Function to generate signature
function generateSignature(clientId, requestId, requestTarget, digest, secret) {
  const timestamp = getCurrentTimestamp();
  const componentSignature = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${requestTarget}${digest ? `\nDigest:${digest}` : ''}`;

  const hmac256Value = crypto.createHmac('sha256', secret).update(componentSignature).digest();
  const signature = Buffer.from(hmac256Value).toString('base64');
  return `HMACSHA256=${signature}`;
}

// Define function to fetch payment status
const cek_payment = async (invoiceNumber) => {
  const request_id = uuidv4();
  const url = `/orders/v1/status/${invoiceNumber}`;
  const requestTimestamp = getCurrentTimestamp();
  
  // Generate Header Signature
  const headerSignature = generateSignature(client_id, request_id, url, '', secret_key);

  const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `https://api-sandbox.doku.com${url}`,
    headers: {
      'Client-Id': client_id,
      'Request-Id': request_id,
      'Request-Timestamp': requestTimestamp,
      'Signature': headerSignature,
    },
  };

  try {
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error('Error occurred:', error.response ? error.response.data : error.message);
    throw new Error('An error occurred while fetching payment status');
  }
};

const getPaymentLink = async (req, res) => {
  try {
    const { serviceRequest, user } = req.body;

    if (!serviceRequest || !user) {
      return res.status(400).send('serviceRequest and user are required');
    }

    const request_id = uuidv4();
    const url = "/checkout/v1/payment";
    const requestTimestamp = getCurrentTimestamp();

    // Prepare the jsonBody
    const jsonBody = {
      order: {
        amount: serviceRequest.price,
        invoice_number: request_id,
        currency: "IDR",
        callback_url: "https://doku.com/",
        line_items: [
          {
            name: serviceRequest.title,
            price: serviceRequest.price,
            quantity: 1
          }
        ]
      },
      payment: {
        payment_due_date: 5
      },
      customer: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.emailAddress || "no-email@example.com", // Handle empty email
        phone: user.mobileNumber,
        address: serviceRequest.address,
        country: "ID"
      }
    };

    const jsonBodyString = JSON.stringify(jsonBody);
    const digest = generateDigest(jsonBodyString);

    // Generate Header Signature
    const headerSignature = generateSignature(client_id, request_id, url, digest, secret_key);

    // Axios configuration
    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://api-sandbox.doku.com" + url,
      headers: {
        "Client-Id": client_id,
        "Request-Id": request_id,
        "Request-Timestamp": requestTimestamp,
        "Signature": headerSignature,
        "Content-Type": "application/json",
      },
      data: jsonBodyString,
    };

    // Send the payment data to the Doku API
    const response = await axios.request(config);

    // Log the entire response from Doku API
    console.log("Doku API Response:", response.data);

    // Accessing the payment URL from the response
    const paymentUrl = response.data.response.payment.url;

    if (!paymentUrl) {
      console.error('Payment URL is undefined in Doku API response');
      throw new Error('Payment URL is undefined');
    }

    // Log the payment URL
    console.log('Payment URL:', paymentUrl);

    res.status(200).send({ paymentUrl });
  } catch (error) {
    console.error('Error generating payment URL:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = { cek_payment, getPaymentLink };
