import express from 'express';
import { createMpesaPayment, getAdmin, getDirectory, getModel, searchModels, submitReview, submitVerification } from '../controllers/utamuController.js';

const router = express.Router();

router.get('/directory', getDirectory);
router.get('/models', searchModels);
router.get('/models/:slug', getModel);
router.post('/payments/mpesa', createMpesaPayment);
router.post('/verification', submitVerification);
router.post('/reviews', submitReview);
router.get('/admin', getAdmin);

export default router;
