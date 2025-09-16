import express from 'express';
import userController from './user.controller';
import { userRole } from '../../constents';
import auth from '../../middleware/auth';
import { upload } from '../../util/uploadImgToCloudinary';
// import { upload } from '../../util/uploadImgToCloudinary';

const userRoutes = express.Router();

// users routes
userRoutes.post('/create-super-admin', userController.createSuperAdmin);
userRoutes.post(
  '/create-admin',
  upload.single('profile'),
  (req, res, next) => {
    req.body = JSON.parse(req.body.data);
    next();
  },
  auth(userRole.superAdmin),
  userController.createAdmin,
);
userRoutes.post(
  '/create-company',
  upload.single('profile'),
  (req, res, next) => {
    req.body = JSON.parse(req.body.data);
    next();
  },
  userController.createCompany,
);
userRoutes.post(
  '/create-driver',
  upload.single('profile'),
  (req, res, next) => {
    req.body = JSON.parse(req.body.data);
    next();
  },
  userController.createDriver,
);

userRoutes.get(
  '/get-profile',
  auth(userRole.admin, userRole.superAdmin, userRole.company, userRole.driver),
  userController.getUserProfile,
);

// admin routes
userRoutes.get(
  '/getAlluser',
  auth(userRole.admin, userRole.superAdmin),
  userController.getAllUsers,
);
userRoutes.patch(
  '/add-firebase-token/:id',

  userController.addFirebaseToken,
);
userRoutes.delete(
  '/delete-user/:id',
  auth(userRole.admin, userRole.superAdmin),
  userController.deleteUser,
);
userRoutes.patch(
  '/block-user/:id',
  auth(userRole.admin, userRole.superAdmin),
  userController.blockUser,
);

export default userRoutes;
