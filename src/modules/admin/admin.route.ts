import { Router } from 'express';
import { userRole } from '../../constents';
import auth from '../../middleware/auth';
import { adminController } from './admin.controller';

const route = Router();

route.get(
  '/admin-stat',
  auth(userRole.admin, userRole.superAdmin),
  adminController.getAdminState,
);

export const adminRoutes = route;
