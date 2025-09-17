import express from 'express';
import { upload } from '../../util/uploadImgToCloudinary';
import { driverController } from './driver.controller';
import auth from '../../middleware/auth';
import { userRole } from '../../constents';
import validator from '../../middleware/validator';
import { driverValidationSchema } from './driver.validation';

const driverRoute = express.Router();

driverRoute.get(
  '/',
  auth(userRole.admin, userRole.company, userRole.superAdmin),
  driverController.getAllDriver,
);
driverRoute.get(
  '/suggested-drivers',
  // auth(userRole.admin, userRole.company, userRole.superAdmin),
  driverController.suggestedDriver,
);
driverRoute.get(
  '/getdriver/:id',
  auth(userRole.admin, userRole.company, userRole.superAdmin),
  driverController.getSingleDriver,
);
driverRoute.patch(
  '/decline/:id',
  auth(userRole.driver),
  driverController.declinedLoads,
);
driverRoute.get(
  '/get-driverby-id/:id',
  // auth(userRole.admin, userRole.company, userRole.superAdmin),
  driverController.getSingleDriverByUserId,
);

driverRoute.patch(
  '/update-profile',
  auth(userRole.driver),
  upload.fields([
    { name: 'nidOrPassport', maxCount: 1 },
    { name: 'drivingLicense', maxCount: 1 },
    { name: 'vehicleRegistration', maxCount: 1 },
    { name: 'profile', maxCount: 1 },
  ]),
  // upload.single('profile'),
  (req, res, next) => {
    if (req?.body?.data) {
      req.body = JSON.parse(req.body?.data || {});
    }
    next();
  },
  driverController.updateDriverProfile,
);

driverRoute.patch(
  '/assign-load',
  validator(driverValidationSchema.assignLoadValidationSchema),
  auth(userRole.driver),

  driverController.assignLoadToDriver,
);
driverRoute.patch(
  '/update-profile-image',
  upload.single('profile'),
  auth(userRole.driver, userRole.company),

  driverController.updateProfileImage,
);
driverRoute.patch(
  '/update-load-status',
  validator(driverValidationSchema.loadStatusValidationSchema),
  auth(userRole.driver),
  driverController.updateLoadStatus,
);
driverRoute.patch(
  '/:id/review',
  validator(driverValidationSchema.reviewDriverSchema),
  auth(userRole.company),
  driverController.reviewDriver,
);

driverRoute.patch(
  '/update-driver-status',
  auth(userRole.driver),

  driverController.updateDriverStatus,
);

driverRoute.get('/myload', auth(userRole.driver), driverController.myLoad);

driverRoute.patch(
  '/send-load-request',
  auth(userRole.driver),
  driverController.sendLoadRequest,
);

export default driverRoute;
