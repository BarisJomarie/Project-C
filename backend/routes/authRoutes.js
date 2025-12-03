const express = require('express');
const router = express.Router();
const { signIn, signUp, verifyOtp, resendOtp, logout, tokenExpired, forgotPassword, verifySecurityAnswer, verifyResetToken, resetPassword, getSecurityQuestion} = require('../controllers/authController');
const verifyToken = require('../middleware/authMiddleware');

router.post('/signup', signUp);
router.post('/signin', signIn);
router.put('/logout', verifyToken, logout);
router.post('/token-expired', tokenExpired);

router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

router.post('/forgot-password', forgotPassword);
router.get('/reset-password/:token', verifyResetToken);
router.post('/verify-security', verifySecurityAnswer);
router.post('/new-password', resetPassword);
router.post("/get-security-question", getSecurityQuestion);

module.exports = router;