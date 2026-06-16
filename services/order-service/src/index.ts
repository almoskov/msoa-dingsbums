import express, { Express } from 'express';
import cors from 'cors';
import { initializeDatabase } from './database';
import { orderRoutes } from './routes/orders';

const app: Express = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Routes
app.use('/orders', orderRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Order Service is running' });
});

app.listen(PORT, () => {
  console.log(`Order Service listening on port ${PORT}`);
});
