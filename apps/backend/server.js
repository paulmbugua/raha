import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import utamuRoutes from './routes/utamuRoutes.js';
import mpesaUrlsRoutes from './routes/mpesaUrlsRoutes.js';

const app = express();
const port = Number(process.env.PORT || 4008);
const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'https://secretnairobi.co.ke',
  'https://www.secretnairobi.co.ke',
  'https://server.secretnairobi.co.ke',
];
const configuredAllowedOrigins = String(process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...configuredAllowedOrigins])];

function isAllowedCorsOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  try {
    const url = new URL(origin);
    return url.protocol === 'https:' && (url.hostname === 'secretnairobi.co.ke' || url.hostname.endsWith('.secretnairobi.co.ke'));
  } catch {
    return false;
  }
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedCorsOrigin(origin)) return callback(null, true);
    console.warn('[cors] blocked_origin', origin);
    return callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => res.json({ name: 'Utamu Directory API', status: 'ok' }));
app.get('/healthz', (_req, res) => res.status(200).send('ok'));
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok', service: 'utamu-backend' }));
app.use('/api/utamu', utamuRoutes);
app.use('/api/mpesa', mpesaUrlsRoutes);
app.use('/api', (_req, res) => res.status(200).json({ message: 'Utamu API is ready.', routes: ['/api/utamu/directory', '/api/utamu/models', '/api/utamu/payments/mpesa', '/api/mpesa/callback', '/api/utamu/admin'] }));
app.use((req, res) => res.status(404).json({ message: 'Route not found', path: req.originalUrl }));
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ message: 'Internal server error' }); });
app.listen(port, '0.0.0.0', () => console.log('Utamu backend listening on port ' + port));
