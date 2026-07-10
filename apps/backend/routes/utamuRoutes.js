import express from 'express';
import upload from '../middleware/multer.js';
import {
  addProfileImage,
  changePassword,
  confirmEmail,
  createMpesaPayment,
  createPaystackPayment,
  deleteProfileImage,
  getAdmin,
  getDirectory,
  getMe,
  getMessages,
  getModel,
  getNotifications,
  getReviews,
  loginAccount,
  registerAccount,
  resendValidation,
  searchModels,
  sendMessage,
  submitReview,
  submitVerification,
  mpesaPaymentCallback,
  verifyPaystackPayment,
  uploadProfileImages,
  updateAccountProfile,
} from '../controllers/utamuController.js';

const router = express.Router();

router.get('/directory', getDirectory);
router.get('/models', searchModels);
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
router.get('/messages', getMessages);
router.post('/messages', sendMessage);
router.get('/notifications', getNotifications);
router.post('/payments/mpesa', createMpesaPayment);
router.post('/payments/mpesa/callback', mpesaPaymentCallback);
router.post('/payments/paystack', createPaystackPayment);
router.post('/payments/paystack/verify', verifyPaystackPayment);
router.get('/payments/paystack/verify', verifyPaystackPayment);
router.post('/verification', submitVerification);
router.get('/reviews', getReviews);
router.post('/reviews', submitReview);
router.get('/admin', getAdmin);

export default router;
