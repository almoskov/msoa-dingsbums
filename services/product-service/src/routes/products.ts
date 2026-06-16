import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, all, get, run } from '../database';

export const productRoutes = Router();

// GET all products
productRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const products = await all<any>(
      `SELECT p.*, c.name as category_name FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id`
    );
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET product by id
productRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await get<any>(
      `SELECT p.*, c.name as category_name FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST create product
productRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const { name, category_id, price, description, unit } = req.body;
    
    if (!name || !category_id || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    await run(
      `INSERT INTO products (id, name, category_id, price, description, unit) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, category_id, price, description || null, unit || null]
    );

    const product = await get('SELECT * FROM products WHERE id = ?', [id]);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT update product
productRoutes.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, category_id, price, description, unit } = req.body;
    
    await run(
      `UPDATE products 
       SET name = ?, category_id = ?, price = ?, description = ?, unit = ?
       WHERE id = ?`,
      [name, category_id, price, description || null, unit || null, req.params.id]
    );

    const product = await get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE product
productRoutes.delete('/:id', async (req: Request, res: Response) => {
  try {
    await run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});
