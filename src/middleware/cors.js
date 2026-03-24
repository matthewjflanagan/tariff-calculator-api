import cors from 'cors';

const corsOptions = {
  origin: process.env.ALLOWED_ORIGIN || 'https://matthewjflanagan.github.io',
  methods: ['GET'],
  allowedHeaders: ['Content-Type'],
};

export default cors(corsOptions);