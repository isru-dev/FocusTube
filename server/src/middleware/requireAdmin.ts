import type { Request, Response, NextFunction } from 'express';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const adminId = process.env.ADMIN_USER_ID;

  // If the variable is missing, block everyone instead of allowing everyone
  if (!adminId) {
    res.status(500).json({ error: 'Admin not configured' });
    return;
  }

  if (req.userId !== adminId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  next();
}