import cors from 'cors';

const allowedOrigins = [
  'https://matthewjflanagan.github.io',
  'http://localhost:5173',
  'http://localhost:3000',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like curl or Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET'],
  allowedHeaders: ['Content-Type'],
};

export default cors(corsOptions);