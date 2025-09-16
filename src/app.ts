import express from 'express';
const app = express();
import cors from 'cors';
import globalErrorHandler from './middleware/globalErrorHandler';
import routeNotFound from './middleware/routeNotFound';
import Routes from './routes';

app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(
  cors({
    origin: [
      '*',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'https://danyel-gamez.netlify.app',
      'https://admindanyel-gamez.netlify.app',
    ],
    methods: 'GET,POST,PUT,PATCH,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  }),
);

app.get('/', (req, res) => {
  res.send('Welcome to APP NAME server..!');
});

// Routes
app.use('/api/v1', Routes);

// route not found
app.use(routeNotFound);

// global error handeller
app.use(globalErrorHandler);

export default app;
