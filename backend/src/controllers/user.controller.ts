import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../auth.middleware';
import bcrypt from 'bcrypt';

export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const users = await prisma.user.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        client_id: true,
        created_at: true,
        updated_at: true,
        client: {
          select: {
            id: true,
            company_name: true,
            client_id: true,
          }
        }
      }
    });

    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
};

export const createUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const { email, password, first_name, last_name, role, client_id } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        company_id: companyId,
        email,
        password: hashedPassword,
        first_name: first_name || '',
        last_name: last_name || '',
        role: role || 'VIEWER',
        client_id: client_id || null,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        client_id: true,
        created_at: true,
      }
    });

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
};

export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { first_name, last_name, role, password, client_id } = req.body;

    const existing = await prisma.user.findFirst({
      where: { id: String(id), company_id: companyId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData: any = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (role !== undefined) updateData.role = role;
    if (client_id !== undefined) updateData.client_id = client_id || null;

    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: String(id) },
      data: updateData,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        client_id: true,
        updated_at: true,
      }
    });

    res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update user', details: error.message });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;

    // Prevent deleting oneself
    if (req.user?.id === id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const existing = await prisma.user.findFirst({
      where: { id: String(id), company_id: companyId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.delete({
      where: { id: String(id) }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete user', details: error.message });
  }
};
