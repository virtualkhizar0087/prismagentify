/**
 * LivePK — Pakistan Payment Gateway Service
 * Supports: JazzCash, Easypaisa, Bank Transfer, Wallet
 */

const crypto = require('crypto');
const https = require('https');

// ══════════════════════════════════════════
// JAZZCASH
// ══════════════════════════════════════════

const JAZZCASH_URL = process.env.NODE_ENV === 'production'
  ? 'https://payments.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction'
  : 'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction';

/**
 * Generate JazzCash secure hash
 */
const generateJazzCashHash = (params) => {
  const salt = process.env.JAZZCASH_INTEGRITY_SALT;
  const sortedKeys = Object.keys(params).sort();
  const hashString = salt + '&' + sortedKeys.map(k => params[k]).join('&');
  return crypto.createHmac('sha256', salt).update(hashString).digest('hex').toUpperCase();
};

/**
 * Initiate JazzCash Mobile Wallet transaction
 */
exports.jazzCashPayment = async ({ amount, phone, orderId, description }) => {
  try {
    const txnRefNo = `T${Date.now()}`;
    const txnDateTime = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    const expiryDateTime = new Date(Date.now() + 30 * 60 * 1000)
      .toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);

    const params = {
      pp_Version: '1.1',
      pp_TxnType: 'MWALLET',
      pp_Language: 'EN',
      pp_MerchantID: process.env.JAZZCASH_MERCHANT_ID,
      pp_SubMerchantID: '',
      pp_Password: process.env.JAZZCASH_PASSWORD,
      pp_TxnRefNo: txnRefNo,
      pp_Amount: String(Math.round(amount * 100)), // JazzCash uses paisas
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: txnDateTime,
      pp_BillReference: orderId,
      pp_Description: description || 'LivePK Order',
      pp_TxnExpiryDateTime: expiryDateTime,
      pp_MobileNumber: phone.replace(/^\+92/, '0'),
      pp_CNIC: '',
      ppmpf_1: '', ppmpf_2: '', ppmpf_3: '', ppmpf_4: '', ppmpf_5: ''
    };

    params.pp_SecureHash = generateJazzCashHash(params);

    const response = await httpPost(JAZZCASH_URL, params);
    const data = JSON.parse(response);

    return {
      success: data.pp_ResponseCode === '000',
      responseCode: data.pp_ResponseCode,
      responseMessage: data.pp_ResponseMessage,
      txnRefNo: data.pp_TxnRefNo,
      raw: data
    };
  } catch (error) {
    console.error('JazzCash error:', error);
    return { success: false, error: error.message };
  }
};

// ══════════════════════════════════════════
// EASYPAISA
// ══════════════════════════════════════════

const EASYPAISA_URL = process.env.NODE_ENV === 'production'
  ? 'https://easypaisaapi.com/payments/apicalls/dooneclicktransactionma'
  : 'https://easypaisa.com.pk/tpg/testing/pgmtransaction/dooneclicktransactionma';

/**
 * Generate Easypaisa secure hash
 */
const generateEasypaisaHash = (data) => {
  const hashKey = process.env.EASYPAISA_HASH_KEY;
  const str = Object.values(data).join('') + hashKey;
  return crypto.createHash('sha256').update(str).digest('hex');
};

/**
 * Initiate Easypaisa MA (Mobile Account) transaction
 */
exports.easypaisaPayment = async ({ amount, phone, orderId, description }) => {
  try {
    const data = {
      amount: String(amount),
      orderRefNum: orderId,
      paymentMethod: 'MA',
      paymentType: 'MA',
      storeId: process.env.EASYPAISA_STORE_ID,
      timeStamp: new Date().toISOString(),
      transactionType: 'MA'
    };

    data.hash = generateEasypaisaHash(data);

    const payload = {
      ...data,
      msisdn: phone.replace(/^\+92/, '0'),
      desc: description || 'LivePK Order'
    };

    const response = await httpPost(EASYPAISA_URL, payload);
    const result = JSON.parse(response);

    return {
      success: result.responseCode === '0000',
      responseCode: result.responseCode,
      responseMessage: result.responseDesc,
      transactionId: result.transactionId,
      raw: result
    };
  } catch (error) {
    console.error('Easypaisa error:', error);
    return { success: false, error: error.message };
  }
};

// ══════════════════════════════════════════
// VERIFY PAYMENT (JazzCash callback)
// ══════════════════════════════════════════
exports.verifyJazzCashCallback = (callbackData) => {
  const receivedHash = callbackData.pp_SecureHash;
  const params = { ...callbackData };
  delete params.pp_SecureHash;
  const computedHash = generateJazzCashHash(params);
  return {
    isValid: computedHash === receivedHash,
    success: callbackData.pp_ResponseCode === '000',
    txnRefNo: callbackData.pp_TxnRefNo,
    amount: parseInt(callbackData.pp_Amount) / 100
  };
};

// ══════════════════════════════════════════
// HTTP Helper
// ══════════════════════════════════════════
const httpPost = (url, data) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let response = '';
      res.on('data', chunk => response += chunk);
      res.on('end', () => resolve(response));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

// ══════════════════════════════════════════
// PAYMENT ROUTES (for index.js)
// ══════════════════════════════════════════
exports.createPaymentRoutes = () => {
  const express = require('express');
  const router = express.Router();
  const Order = require('../models/Order');
  const { protect } = require('../middleware/auth');

  // Initiate JazzCash payment
  router.post('/jazzcash', protect, async (req, res) => {
    try {
      const { orderId, phone } = req.body;
      const order = await Order.findOne({ _id: orderId, buyer: req.user._id });
      if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

      const result = await exports.jazzCashPayment({
        amount: order.totalAmount,
        phone,
        orderId: order.orderNumber,
        description: `LivePK Order ${order.orderNumber}`
      });

      if (result.success) {
        order.paymentReference = result.txnRefNo;
        order.paymentStatus = 'paid';
        await order.save();
      }

      res.json({ success: result.success, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: 'JazzCash payment failed.' });
    }
  });

  // Initiate Easypaisa payment
  router.post('/easypaisa', protect, async (req, res) => {
    try {
      const { orderId, phone } = req.body;
      const order = await Order.findOne({ _id: orderId, buyer: req.user._id });
      if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

      const result = await exports.easypaisaPayment({
        amount: order.totalAmount,
        phone,
        orderId: order.orderNumber,
        description: `LivePK Order ${order.orderNumber}`
      });

      if (result.success) {
        order.paymentReference = result.transactionId;
        order.paymentStatus = 'paid';
        await order.save();
      }

      res.json({ success: result.success, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Easypaisa payment failed.' });
    }
  });

  // JazzCash callback webhook
  router.post('/jazzcash/callback', async (req, res) => {
    try {
      const verification = exports.verifyJazzCashCallback(req.body);
      if (verification.isValid && verification.success) {
        // Update order payment status
        await Order.findOneAndUpdate(
          { orderNumber: req.body.pp_BillReference },
          { paymentStatus: 'paid', paymentReference: verification.txnRefNo, paidAt: new Date() }
        );
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false });
    }
  });

  return router;
};
