// server/api/registration.js
const express = require('express');
const router = express.Router();

router.use(express.json());

// Accepts both: { paymentIntentId } OR { payment: { intentId } }
router.post('/mark-registration-paid', async (req, res) => {
  try {
    const { userId, payment, paymentIntentId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const intentId = paymentIntentId || payment?.intentId || null;

    // TODO: call Integration API to set profile.publicData.registrationPaid = true
    // For now, respond ok so UI can proceed:
    return res.json({ ok: true, intentId });
  } catch (err) {
    console.error('mark-registration-paid failed:', err);
    return res.status(500).json({ error: 'Server error updating profile' });
  }
});

module.exports = router;
