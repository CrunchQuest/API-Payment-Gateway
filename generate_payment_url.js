const express = require('express');
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.json());

const client_id = "BRN-0208-1716179958112"; // change with your client-id "BRN-...."
const secret_key = "SK-sLHIfTLsCKCmbSs5Dafo"; // change with your secret-key "SK-...."

// Function to get the current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString().slice(0, 19) + "Z";
}

// Function to generate digest
function generateDigest(jsonBody) {
  let jsonStringHash256 = crypto
    .createHash("sha256")
    .update(jsonBody, "utf-8")
    .digest();

  let bufferFromJsonStringHash256 = Buffer.from(jsonStringHash256);
  return bufferFromJsonStringHash256.toString("base64");
}

// Function to generate signature
function generateSignature(clientId, requestId, requestTarget, digest, secret) {
  let componentSignature = "Client-Id:" + clientId;
  componentSignature += "\n";
  componentSignature += "Request-Id:" + requestId;
  componentSignature += "\n";
  componentSignature += "Request-Timestamp:" + getCurrentTimestamp();
  componentSignature += "\n";
  componentSignature += "Request-Target:" + requestTarget;
  if (digest) {
    componentSignature += "\n";
    componentSignature += "Digest:" + digest;
  }

  let hmac256Value = crypto
    .createHmac("sha256", secret)
    .update(componentSignature.toString())
    .digest();

  let bufferFromHmac256Value = Buffer.from(hmac256Value);
  let signature = bufferFromHmac256Value.toString("base64");
  return "HMACSHA256=" + signature;
}

// Define the API endpoint
app.post('/api/getPaymentLink', (req, res) => {
  const request_id = uuidv4();
  const url = "/checkout/v1/payment";
  const requestTimestamp = getCurrentTimestamp();

  // Receive jsonBody from the request
  let jsonBody = req.body;
  
  // Add necessary fields if they are not provided
  jsonBody.order.invoice_number = request_id;

  let jsonBodyString = JSON.stringify(jsonBody);

  let digest = generateDigest(jsonBodyString);

  // Generate Header Signature
  let headerSignature = generateSignature(
    client_id,
    request_id,
    url,
    digest,
    secret_key
  );

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://api-sandbox.doku.com" + url,
    headers: {
      "Client-Id": client_id,
      "Request-Id": request_id,
      "Request-Timestamp": requestTimestamp,
      Signature: headerSignature,
      "Content-Type": "application/json",
    },
    data: jsonBodyString,
  };

  axios
    .request(config)
    .then((response) => {
      res.json(response.data);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('An error occurred');
    });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
