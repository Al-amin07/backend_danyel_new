import { Request, Response } from 'express';
import catchAsync from '../../util/catchAsync';
import { companyService } from './company.service';
import sendResponse from '../../util/sendResponse';
import { StatusCodes } from 'http-status-codes';

const getAllCompany = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await companyService.getAllCompanyFromDb(query);
  sendResponse(res, {
    data: result.data,
    meta: result.meta,
    message: 'Companies retrived successfully',
    success: true,
    statusCode: 200,
  });
});
const getAllLoadOfCompany = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const query = req.query;
  const result = await companyService.getAllCompanyLoad(id, query);
  sendResponse(res, {
    data: result.data,
    meta: result.meta,
    message: 'Loads retrived successfully',
    success: true,
    statusCode: 200,
  });
});
const getSingleCompany = catchAsync(async (req: Request, res: Response) => {
  const { companyId } = req.params;
  const result = await companyService.getSingleCompany(companyId);

  sendResponse(res, {
    data: result,
    message: 'Company retrived successfully',
    success: true,
    statusCode: 200,
  });
});
const updateCompany = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const payload = req.body;
  const result = await companyService.updateCompany(id, payload);

  sendResponse(res, {
    data: result,
    message: 'Company updated successfully',
    success: true,
    statusCode: 200,
  });
});
const companyState = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const result = await companyService.companyStat(id);

  sendResponse(res, {
    data: result,
    message: 'Company data retrived successfully',
    success: true,
    statusCode: StatusCodes.OK,
  });
});
const sendNotificationToSuggestedDrivers = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.user;
    const result = await companyService.sendNotificationToSuggestedDrivers(
      id,
      req.body,
    );

    sendResponse(res, {
      data: result,
      message: 'Message send successfully',
      success: true,
      statusCode: StatusCodes.OK,
    });
  },
);
const getCompanyEarning = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const result = await companyService.getCompanyEarning(id);

  sendResponse(res, {
    data: result,
    message: 'Company Earn retrived successfully successfully',
    success: true,
    statusCode: StatusCodes.OK,
  });
});
const acceptLoadRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await companyService.acceptLoadRequest(req.body);

  sendResponse(res, {
    data: result,
    message: 'Load request accept successfully',
    success: true,
    statusCode: StatusCodes.OK,
  });
});
const addDriverToCompany = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const { userId } = req.body;
  const result = await companyService.addDriverToCompany(id, userId);

  sendResponse(res, {
    data: result,
    message: 'Driver added to company successfully',
    success: true,
    statusCode: StatusCodes.OK,
  });
});

export const companyController = {
  getAllCompany,
  getSingleCompany,
  updateCompany,
  getAllLoadOfCompany,
  companyState,
  sendNotificationToSuggestedDrivers,
  getCompanyEarning,
  acceptLoadRequest,
  addDriverToCompany,
};
