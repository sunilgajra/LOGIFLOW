import { Request, Response } from 'express';
import { prisma } from '../prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    // Auto-seed standard demo accounts if requested
    if (!user && (email.toLowerCase().includes('admin@logiflow.com') || email.toLowerCase().includes('driver@logiflow.com'))) {
      let company = await prisma.company.findFirst();
      if (!company) {
        company = await prisma.company.create({ data: { name: 'LogiFlow Admin' } });
      }
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = await prisma.user.create({
        data: {
          company_id: company.id,
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          first_name: email.includes('admin') ? 'Admin' : 'Delivery',
          last_name: email.includes('admin') ? 'User' : 'Driver',
          role: email.includes('admin') ? 'SUPER_ADMIN' : 'OPERATIONS',
        }
      });
    }

    if (!user) {
      // Security best practice: don't reveal if user doesn't exist
      return res.json({
        message: 'If your account exists in our system, password reset instructions have been sent to your email.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        reset_password_token: resetToken,
        reset_password_expires: resetExpires,
      }
    });

    const resetUrl = `/reset-password?token=${resetToken}`;
    console.log(`[AUTH] Password reset requested for ${user.email}. Token URL: ${resetUrl}`);

    res.json({
      message: 'Password reset link generated successfully.',
      resetToken,
      resetUrl,
      email: user.email
    });

  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request', details: error.message });
  }
};

export const verifyResetToken = async (req: Request, res: Response) => {
  try {
    const token = req.params.token ? String(req.params.token) : '';

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const user = await prisma.user.findFirst({
      where: {
        reset_password_token: token,
        reset_password_expires: {
          gte: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ valid: false, error: 'Password reset link is invalid or has expired.' });
    }

    res.json({
      valid: true,
      email: user.email,
      first_name: user.first_name
    });

  } catch (error: any) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ error: 'Failed to verify token', details: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const tokenStr = String(token);

    const user = await prisma.user.findFirst({
      where: {
        reset_password_token: tokenStr,
        reset_password_expires: {
          gte: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        reset_password_token: null,
        reset_password_expires: null,
      }
    });

    res.json({
      message: 'Password reset successful! You can now log in with your new password.'
    });

  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password', details: error.message });
  }
};

