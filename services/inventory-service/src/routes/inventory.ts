import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { all, get, run } from '../database';

export const inventoryRoutes = Router();

// GET inventory for product
inventoryRoutes.get('/:productId', async (req: Request, res: Response) => {
  try {
    const inventory = await all<any>(
      `SELECT * FROM inventory WHERE product_id = ?`,
      [req.params.productId]
    );
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// POST reserve inventory
inventoryRoutes.post('/reserve', async (req: Request, res: Response) => {
  try {
    const { product_id, quantity, order_id } = req.body;

    if (!product_id || !quantity || !order_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check available inventory
    const inventory = await get<any>(
      `SELECT * FROM inventory WHERE product_id = ? LIMIT 1`,
      [product_id]
    );

    if (!inventory || inventory.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient inventory' });
    }

    // Create reservation
    const reservation_id = uuidv4();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await run(
      `INSERT INTO reservations (id, product_id, quantity, order_id, status, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [reservation_id, product_id, quantity, order_id, 'pending', expiresAt.toISOString()]
    );

    // Deduct from inventory
    await run(
      `UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?`,
      [quantity, product_id]
    );

    const reservation = await get(
      `SELECT * FROM reservations WHERE id = ?`,
      [reservation_id]
    );

    res.status(201).json(reservation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reserve inventory' });
  }
});

// POST release reservation
inventoryRoutes.post('/release', async (req: Request, res: Response) => {
  try {
    const { reservation_id } = req.body;

    if (!reservation_id) {
      return res.status(400).json({ error: 'Missing reservation_id' });
    }

    // Get reservation
    const reservation = await get<any>(
      `SELECT * FROM reservations WHERE id = ?`,
      [reservation_id]
    );

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Return to inventory
    await run(
      `UPDATE inventory SET quantity = quantity + ? WHERE product_id = ?`,
      [reservation.quantity, reservation.product_id]
    );

    // Update reservation status
    await run(
      `UPDATE reservations SET status = 'released' WHERE id = ?`,
      [reservation_id]
    );

    res.json({ message: 'Reservation released' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to release reservation' });
  }
});

// POST confirm reservation
inventoryRoutes.post('/confirm', async (req: Request, res: Response) => {
  try {
    const { reservation_id } = req.body;

    if (!reservation_id) {
      return res.status(400).json({ error: 'Missing reservation_id' });
    }

    await run(
      `UPDATE reservations SET status = 'confirmed' WHERE id = ?`,
      [reservation_id]
    );

    res.json({ message: 'Reservation confirmed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to confirm reservation' });
  }
});
