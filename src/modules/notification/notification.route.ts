import { Router } from 'express';
import { notificationController } from './notification.controller';
import auth from '../../middleware/auth';
import { userRole } from '../../constents';

const route = Router();

route.get('/', notificationController.getAllNotification);
route.post('/', notificationController.sendNotification);
route.patch('/mark-as-read', notificationController.markNotificationsAsRead);
route.patch(
  '/change-notification',
  auth(userRole.driver, userRole.company),
  notificationController.changeNotificationPreferences,
);
route.get('/:id', notificationController.getMyNotification);

export const notificationRoute = route;
