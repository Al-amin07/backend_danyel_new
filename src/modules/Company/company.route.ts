import express from 'express';
import { companyController } from './company.controller';
import auth from '../../middleware/auth';
import { userRole } from '../../constents';

const companyRoute = express.Router();

companyRoute.get('/', companyController.getAllCompany);
companyRoute.get(
  '/myload',
  auth(userRole.company),
  companyController.getAllLoadOfCompany,
);
companyRoute.get(
  '/mystat',
  auth(userRole.company),
  companyController.companyState,
);
companyRoute.get(
  '/my-earn',
  auth(userRole.company),
  companyController.getCompanyEarning,
);
companyRoute.get('/:companyId', companyController.getSingleCompany);
companyRoute.patch(
  '/',
  auth(userRole.company),
  companyController.updateCompany,
);
companyRoute.post(
  '/send-load-notification',
  auth(userRole.company),
  companyController.sendNotificationToSuggestedDrivers,
);
companyRoute.patch(
  '/accept-load-request',
  auth(userRole.company, userRole.admin, userRole.superAdmin),
  companyController.acceptLoadRequest,
);
companyRoute.patch(
  '/add-driver',
  auth(userRole.company, userRole.admin, userRole.superAdmin),
  companyController.addDriverToCompany,
);

export default companyRoute;
