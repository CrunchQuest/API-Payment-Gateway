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
// Define function to get payment link
const getPaymentLink = async (reqBody) => {
  const { orderId, customerId } = reqBody; // Assume order ID and customer ID are passed in the request body

  if (!orderId || !customerId) {
    throw new Error('orderId and customerId are required');
  }

  try {
    // Fetch order data from Firebase
    const orderSnapshot = await db.ref(`service_requests/${orderId}`).once('value');
    const orderData = orderSnapshot.val();

    if (!orderData) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Fetch customer data from Firebase
    const customerSnapshot = await db.ref(`users/${customerId}`).once('value');
    const customerData = customerSnapshot.val();

    if (!customerData) {
      throw new Error(`Customer not found: ${customerId}`);
    }

    console.log('Order Data:', orderData);
    console.log('Customer Data:', customerData);

    // Ensure Firstname and Lastname fields exist
    const customerName = `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim();
    if (!customerName) {
      throw new Error('Customer name is invalid');
    }

    const request_id = uuidv4();
    const url = '/checkout/v1/payment';
    const requestTimestamp = getCurrentTimestamp();

    // Create jsonBody from fetched data
    const jsonBody = {
      order: {
        amount: orderData.price,
        currency: "IDR",
        callback_url: orderData.callback_url,
        callback_url_cancel: orderData.callback_url_cancel,
        invoice_number: orderData.invoice_number || orderId, 
        auto_redirect: true
      },
      payment: {
        payment_due_date: 60,
        payment_method_types: [
          "VIRTUAL_ACCOUNT_BCA",
          "VIRTUAL_ACCOUNT_BANK_MANDIRI",
          "VIRTUAL_ACCOUNT_BANK_SYARIAH_MANDIRI",
          "VIRTUAL_ACCOUNT_DOKU",
          "VIRTUAL_ACCOUNT_BRI",
          "VIRTUAL_ACCOUNT_BNI",
          "VIRTUAL_ACCOUNT_BANK_PERMATA",
          "VIRTUAL_ACCOUNT_BANK_CIMB",
          "VIRTUAL_ACCOUNT_BANK_DANAMON",
          "ONLINE_TO_OFFLINE_ALFA",
          "CREDIT_CARD",
          "DIRECT_DEBIT_BRI",
          "EMONEY_SHOPEEPAY",
          "EMONEY_OVO",
          "EMONEY_DANA",
          "QRIS",
          "PEER_TO_PEER_AKULAKU",
          "PEER_TO_PEER_KREDIVO",
          "PEER_TO_PEER_INDODANA"
        ]
      },
      customer: {
        id: customerData.id,
        name: customerName,
        email: customerData.emailAddress,
      }
    };

    const jsonBodyString = JSON.stringify(jsonBody);
    const digest = generateDigest(jsonBodyString);

    // Generate Header Signature
    const headerSignature = generateSignature(client_id, request_id, url, digest, secret_key);

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `https://api-sandbox.doku.com${url}`,
      headers: {
        'Client-Id': client_id,
        'Request-Id': request_id,
        'Request-Timestamp': requestTimestamp,
        'Signature': headerSignature,
        'Content-Type': 'application/json'
      },
      data: jsonBodyString
    };

    console.log('Request config:', config);

    const response = await axios.request(config);
    console.log('Response from Doku:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error occurred:', error.response ? error.response.data : error.message);
    throw new Error('An error occurred while getting payment link');
  }
};

module.exports = { cek_payment, getPaymentLink };