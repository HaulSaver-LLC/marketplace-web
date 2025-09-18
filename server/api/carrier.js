router.post('/mark-authority-verified', async (req, res) => {
  try {
    const { userId, verified, usdotNumber, authorityStatus } = req.body || {};
    const trustedSdk = getTrustedSdk(req, res); // from ../api-util/sdk

    await trustedSdk.users.updateProfile({
      id: userId,
      privateData: {
        authorityVerified: !!verified,
        ...(usdotNumber ? { usdotNumber } : {}),
        ...(authorityStatus ? { authorityStatus } : {}),
      },
    });

    res.json({ ok: true });
  } catch (e) {
    console.error('mark-authority-verified failed', e);
    res.status(500).json({ ok: false, error: 'Internal error' });
  }
});
