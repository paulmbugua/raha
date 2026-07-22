import express from 'express';
import upload from '../middleware/multer.js';
import {
  addProfileImage,
  addBlacklistedClient,
  changePassword,
  confirmEmail,
  configureAiAssistant,
  createBookingLead,
  createMonetizationCheckout,
  createMpesaPayment,
  createPaystackPayment,
  deleteBlacklistedClient,
  deleteAccount,
  deleteProfileImage,
  getAdmin,
  getBlacklistedClients,
  getDirectory,
  getMe,
  getClientPortal,
  getMessages,
  getModel,
  getMonetizationOverview,
  getNotifications,
  getPaymentStatus,
  getReviews,
  loginAccount,
  registerAccount,
  resendValidation,
  searchModels,
  sendMessage,
  sendTip,
  submitReview,
  submitVerification,
  mpesaPaymentCallback,
  proxyProfileImage,
  verifyPaystackPayment,
  uploadProfileImages,
  updateAccountProfile,
} from '../controllers/utamuController.js';

const router = express.Router();

router.get('/directory', getDirectory);
router.get('/models', searchModels);
router.get(/^\/images\/proxy\/(.+)$/, proxyProfileImage);
router.get('/models/:slug', getModel);
router.post('/register', registerAccount);
router.post('/login', loginAccount);
router.post('/confirm-email', confirmEmail);
router.get('/confirm-email', confirmEmail);
router.post('/resend-validation', resendValidation);
router.get('/me', getMe);
router.put('/account/profile', updateAccountProfile);
router.post('/account/images', addProfileImage);
router.post('/account/images/upload', upload.array('images', 8), uploadProfileImages);
router.delete('/account/images/:id', deleteProfileImage);
router.post('/account/change-password', changePassword);
router.get('/account/blacklisted-clients', getBlacklistedClients);
router.post('/account/blacklisted-clients', addBlacklistedClient);
router.delete('/account/blacklisted-clients/:id', deleteBlacklistedClient);
router.delete('/account', deleteAccount);
router.get('/messages', getMessages);
router.post('/messages', sendMessage);
router.get('/notifications', getNotifications);
router.get('/monetization', getMonetizationOverview);
router.post('/monetization/checkout', createMonetizationCheckout);
router.post('/ai-assistant', configureAiAssistant);
router.post('/tips', sendTip);
router.post('/booking-leads', createBookingLead);
router.get('/client-portal', getClientPortal);
router.post('/payments/mpesa', createMpesaPayment);
router.post('/payments/mpesa/callback', mpesaPaymentCallback);
router.get('/payments/:reference/status', getPaymentStatus);
router.post('/payments/paystack', createPaystackPayment);
router.post('/payments/paystack/verify', verifyPaystackPayment);
router.get('/payments/paystack/verify', verifyPaystackPayment);
router.post('/verification', submitVerification);
router.get('/reviews', getReviews);
router.post('/reviews', submitReview);
router.get('/admin', getAdmin);

export default router;
