import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/adminMiddleware';
import { listAllUsers, listAllMemberships, updateMembershipRole } from '../controllers/adminController';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get('/admin/users', listAllUsers);
adminRouter.get('/admin/memberships', listAllMemberships);
adminRouter.patch('/admin/memberships', updateMembershipRole);

