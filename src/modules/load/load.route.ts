import { Router } from 'express';
import { loadController } from './load.controller';
import { upload } from '../../util/uploadImgToCloudinary';
import auth from '../../middleware/auth';
import { userRole } from '../../constents';
import validator from '../../middleware/validator';
import { loadValidationSchema } from './load.validation';

const route = Router();

route.post(
  '/create-load',
  auth(userRole.admin, userRole.company, userRole.superAdmin),
  upload.array('documents', 10),
  (req, res, next) => {
    req.body = JSON.parse(req.body.data);
    console.log('Hello there');
    next();
  },
  validator(loadValidationSchema.createLoadSchema),
  loadController.createLoad,
);

route.get(
  '/',
  auth(userRole.company, userRole.admin, userRole.superAdmin),
  loadController.getAllLoad,
);
route.get(
  '/get-pending-loads',
  auth(userRole.driver),
  loadController.getAllLoadByDriver,
);

route.get('/generate-loadId', loadController.generateLoadId);
route.get('/:loadId', loadController.getSingleLoad);
route.patch(
  '/:loadId',
  auth(userRole.admin, userRole.company, userRole.superAdmin),
  upload.array('documents', 10),
  (req, res, next) => {
    if (req?.body?.data) {
      console.log('sefsegfgv');
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  loadController.updateLoad,
);

route.patch(
  '/:loadId/assign-driver',
  auth(userRole.admin, userRole.company, userRole.superAdmin),
  loadController.aassignDriverToLoad,
);
route.patch(
  '/:loadId/change-driver',
  auth(userRole.admin, userRole.company, userRole.superAdmin),
  loadController.changeDriver,
);

route.patch(
  `/:loadId/update-load-status`,
  validator(loadValidationSchema.loadStatusValidationSchema),
  auth(userRole.admin, userRole.company),
  loadController.updateLoadStatus,
);
route.patch(
  `/:loadId/cancel-load`,

  auth(userRole.admin, userRole.company, userRole.driver),
  loadController.cancelLoadByDriverDriver,
);

export const loadRoute = route;
