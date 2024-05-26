// index.js

const express = require('express');
const { cek_payment, getPaymentLink } = require('./Paymenthandler');

const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.json());

// Define the API endpoints
app.post('/api/getPaymentLink', async (req, res) => {
  try {
    const paymentLink = await getPaymentLink(req.body);
    res.json(paymentLink);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Define another API endpoint for checking payment status
app.post('/api/checkPaymentStatus', async (req, res) => {
    const { invoiceNumber } = req.body;
    if (!invoiceNumber) {
      return res.status(400).json({ error: 'Invoice number is required' });
    }
  
    try {
      const paymentStatus = await cek_payment(invoiceNumber);
      res.json(paymentStatus);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
