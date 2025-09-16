import { Router } from 'express';
import { messageController } from './message.controller';
import auth from '../../middleware/auth';
import { userRole } from '../../constents';
import { upload } from '../../util/uploadImgToCloudinary';

const route = Router();

route.post(
  '/',
  upload.single('doc'),
  (req, res, next) => {
    if (req?.body?.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  messageController.createMessage,
);
route.get('/', messageController.getAllMessage);
route.patch('/', messageController.markMessageAsRead);
route.get(
  '/my-message',
  auth(userRole.admin, userRole.company, userRole.driver, userRole.superAdmin),
  messageController.getUserAllConversion,
);
route.get('/inbox/:senderId/:receiverId', messageController.getInboxMessage);

export const messageRoute = route;
