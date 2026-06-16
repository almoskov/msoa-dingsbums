import express, { Express } from 'express';
import cors from 'cors';
import { initializeDatabase } from './database';
import { productRoutes } from './routes/products';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Routes
app.use('/products', productRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Product Service is running' });
});

app.listen(PORT, () => {
  console.log(`Product Service listening on port ${PORT}`);
});
