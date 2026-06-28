import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rahaRoutes from './routes/rahaRoutes.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const allowedOrigins = String(process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001').split(',').map((origin) => origin.trim()).filter(Boolean);

app.use(cors({ origin: (origin, callback) => (!origin || allowedOrigins.includes(origin) ? callback(null, true) : callback(new Error(`Not allowed by CORS: ${origin}`))), credentials: true }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => res.json({ name: 'Raha Wellness Marketplace API', status: 'ok' }));
app.get('/healthz', (_req, res) => res.status(200).send('ok'));
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok', service: 'raha-backend' }));
app.use('/api/raha', rahaRoutes);
app.use('/api', (_req, res) => res.status(200).json({ message: 'Raha API is ready.', routes: ['/api/raha/marketplace', '/api/raha/providers', '/api/raha/bookings', '/api/raha/admin'] }));
app.use((req, res) => res.status(404).json({ message: 'Route not found', path: req.originalUrl }));
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ message: 'Internal server error' }); });
app.listen(port, '0.0.0.0', () => console.log(`Raha backend listening on port ${port}`));
