const express = require('express');
const router = express.Router();

router.use(express.json()); // ensure body parsed for this router

router.post('/mark-registration-paid', async (req, res) => {
  try {
    const { userId, paymentIntentId } = req.body || {};
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    // TODO: update your DB / user profile here
    // e.g. mark registrationPaid=true, store paymentIntentId

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('mark-registration-paid failed', err);
    return res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router;
