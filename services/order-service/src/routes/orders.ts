import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { all, get, run } from '../database';

export const orderRoutes = Router();

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3002';

// GET all orders
orderRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const orders = await all<any>(
      `SELECT o.*, COUNT(oi.id) as item_count FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       GROUP BY o.id`
    );
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET order by id
orderRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await get<any>(
      `SELECT * FROM orders WHERE id = ?`,
      [req.params.id]
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = await all<any>(
      `SELECT * FROM order_items WHERE order_id = ?`,
      [req.params.id]
    );

    res.json({ ...order, items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST create order
orderRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const { customer_name, customer_email, items } = req.body;

    if (!customer_name || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const order_id = uuidv4();
    let total_price = 0;

    // Process each item
    for (const item of items) {
      const { product_id, quantity } = item;

      // Get product details
      try {
        const product = await axios.get(
          `${PRODUCT_SERVICE_URL}/products/${product_id}`
        );
        const price = product.data.price;
        total_price += price * quantity;

        // Reserve inventory
        await axios.post(`${INVENTORY_SERVICE_URL}/inventory/reserve`, {
          product_id,
          quantity,
          order_id
        });

        // Create order item
        const item_id = uuidv4();
        await run(
          `INSERT INTO order_items (id, order_id, product_id, quantity, price)
           VALUES (?, ?, ?, ?, ?)`,
          [item_id, order_id, product_id, quantity, price]
        );
      } catch (error: any) {
        return res.status(400).json({
          error: `Failed to process item: ${error.message}`
        });
      }
    }

    // Create order
    await run(
      `INSERT INTO orders (id, customer_name, customer_email, status, total_price)
       VALUES (?, ?, ?, ?, ?)`,
      [order_id, customer_name, customer_email || null, 'pending', total_price]
    );

    const order = await get(
      `SELECT * FROM orders WHERE id = ?`,
      [order_id]
    );

    res.status(201).json(order);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PUT update order status
orderRoutes.put('/:id', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Missing status' });
    }

    await run(
      `UPDATE orders SET status = ? WHERE id = ?`,
      [status, req.params.id]
    );

    const order = await get(
      `SELECT * FROM orders WHERE id = ?`,
      [req.params.id]
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});
