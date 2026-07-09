import express from 'express';
import upload from '../middleware/multer.js';
import {
  addProfileImage,
  changePassword,
  confirmEmail,
  createMpesaPayment,
  deleteProfileImage,
  getAdmin,
  getDirectory,
  getMe,
  getMessages,
  getModel,
  getNotifications,
  loginAccount,
  registerAccount,
  resendValidation,
  searchModels,
  sendMessage,
  submitReview,
  submitVerification,
  uploadProfileImages,
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
router.post('/account/images', addProfileImage);
router.post('/account/images/upload', upload.array('images', 8), uploadProfileImages);
router.delete('/account/images/:id', deleteProfileImage);
router.post('/account/change-password', changePassword);
router.get('/messages', getMessages);
router.post('/messages', sendMessage);
router.get('/notifications', getNotifications);
router.post('/payments/mpesa', createMpesaPayment);
router.post('/verification', submitVerification);
router.post('/reviews', submitReview);
router.get('/admin', getAdmin);

export default router;
