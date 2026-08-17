import { Request, Response } from 'express';
import { prisma } from '../prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user = await prisma.user.findUnique({
      where: { email }
    });

    // --- AUTO-SEED FOR DEMO PURPOSES ---
    if (!user && (email === 'admin@logiflow.com' || email === 'driver@logiflow.com')) {
      let company = await prisma.company.findFirst();
      if (!company) {
        company = await prisma.company.create({ data: { name: 'LogiFlow Admin' } });
      }
      
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = await prisma.user.create({
        data: {
          company_id: company.id,
          email,
          password: hashedPassword,
          first_name: email === 'admin@logiflow.com' ? 'Admin' : 'Delivery',
          last_name: email === 'admin@logiflow.com' ? 'User' : 'Driver',
          role: email === 'admin@logiflow.com' ? 'SUPER_ADMIN' : 'OPERATIONS',
        }
      });
    }
    // ------------------------------------

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.password) {
      return res.status(401).json({ error: 'Account not fully set up' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, company_id: user.company_id, role: user.role, client_id: user.client_id },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        client_id: user.client_id,
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login', details: error.message });
  }
};
