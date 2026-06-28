import express from 'express';
import {
  createBooking,
  createReview,
  getAdmin,
  getBookings,
  getMarketplace,
  getProvider,
  searchProviders,
} from '../controllers/rahaController.js';

const router = express.Router();

router.get('/marketplace', getMarketplace);
router.get('/providers', searchProviders);
router.get('/providers/:slug', getProvider);
router.get('/bookings', getBookings);
router.post('/bookings', createBooking);
router.post('/reviews', createReview);
router.get('/admin', getAdmin);

export default router;