import express, { Express } from 'express';
import cors from 'cors';
import { initializeDatabase } from './database';
import { inventoryRoutes } from './routes/inventory';

const app: Express = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Routes
app.use('/inventory', inventoryRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Inventory Service is running' });
});

app.listen(PORT, () => {
  console.log(`Inventory Service listening on port ${PORT}`);
});
