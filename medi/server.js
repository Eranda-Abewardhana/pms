require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route files
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const appointmentRoutes = require('./routes/appointment');
const adminRoutes = require('./routes/admin');
const patientRoutes = require('./routes/patient');
const emrRoutes = require('./routes/emr');
const labRoutes = require('./routes/lab');
const billingRoutes = require('./routes/billing');
const vitalsRoutes = require('./routes/vitals');
const feedbackRoutes = require('./routes/feedback');
const configRoutes = require('./routes/config');
const reportRoutes = require('./routes/reports');

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));

// Enable CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://me-djestic-lzhb2n7er-eranda-abewardhanas-projects.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' || allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
  },
  credentials: true,
}));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Mount Routes ─────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/emr', emrRoutes);
app.use('/api/v1/lab', labRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/vitals', vitalsRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/config', configRoutes);
app.use('/api/v1/reports', reportRoutes);

// ── Health check ─────────────────────────────────────────────────
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PMS API is running',
    timestamp: new Date().toISOString(),
  });
});

// ── Global error handler ─────────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 7860;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  // Log the Backend URL for visibility in Hugging Face / Docker logs
  const publicUrl = process.env.SPACE_ID 
    ? `https://${process.env.SPACE_ID.replace('/', '-')}.hf.space` 
    : `http://localhost:${PORT}`;
  console.log(`Backend API URL: ${publicUrl}/api/v1`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
