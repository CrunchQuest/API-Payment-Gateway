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

const getPaymentLink = async (req) => {
  try {
    const { serviceRequest = {}, user = {}, order = {} } = req.body;

    // Check if serviceRequest, user, and order are provided
    if (!serviceRequest || !user || !order) {
      throw new Error('At least one of serviceRequest, user, or order is required');
    }

    // Extracting orderId and customerId if order is provided
    const { orderId, customerId } = order;

    // Constructing the JSON body
    const jsonBody = {
      order: {
        amount: serviceRequest.price || 0,
        invoice_number: orderId || uuidv4(),
        currency: "IDR",
        callback_url: "https://doku.com/",
        line_items: [
          {
            name: serviceRequest.title || "",
            price: serviceRequest.price || 0,
            quantity: 1
          }
        ]
      },
      payment: {
        payment_due_date: 5
      },
      customer: {
        name: `${user.firstName || ''} ${user.lastName || ''}`,
        email: user.emailAddress || "no-email@example.com",
        phone: user.mobileNumber || "",
        address: serviceRequest.address || "",
        country: "ID"
      }
    };

    let jsonBodyString = JSON.stringify(jsonBody);
    let digest = generateDigest(jsonBodyString);

    // Rest of the function remains the same
    // Making API request, error handling, etc.

  } catch (error) {
    console.error('Error occurred:', error.response ? error.response.data : error.message);
    throw new Error('An error occurred while getting payment link');
  }
};

module.exports = { cek_payment, getPaymentLink };
