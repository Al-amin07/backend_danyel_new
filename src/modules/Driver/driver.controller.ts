import { Request, Response } from 'express';
import catchAsync from '../../util/catchAsync';
import { driverService } from './driver.service';
import { JwtPayload } from 'jsonwebtoken';
import sendResponse from '../../util/sendResponse';
import { StatusCodes } from 'http-status-codes';

const updateDriverProfile = catchAsync(async (req: Request, res: Response) => {
  const id = (req.user as JwtPayload).id;
  const data = req.body;
  // const file = req.file;
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  const result = await driverService.updateDriverProfileIntoDb(
    id,
    data,

    files,
    // file as Express.Multer.File,
  );
  sendResponse(res, {
    success: true,
    message: 'Driver profile updated successfully',
    data: result,
    statusCode: StatusCodes.OK,
  });
});
const assignLoadToDriver = catchAsync(async (req: Request, res: Response) => {
  const id = (req.user as JwtPayload).id;
  const { loadId } = req.body;

  const result = await driverService.assignLoadToDriver(id, loadId);
  sendResponse(res, {
    success: true,
    message: 'Load assigned to driver successfully',
    data: result,
    statusCode: StatusCodes.OK,
  });
});
const updateLoadStatus = catchAsync(async (req: Request, res: Response) => {
  const id = (req.user as JwtPayload).id;
  console.log({ id, body: req.body });
  const result = await driverService.updateLoadStatus(id, req.body);
  sendResponse(res, {
    success: true,
    message: 'Load assigned to driver successfully',
    data: result,
    statusCode: StatusCodes.OK,
  });
});
const reviewDriver = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log({ id, body: req.user });
  const { username, id: userId } = req.user as JwtPayload;
  const result = await driverService.reviewDriver(id, req.body, userId);
  sendResponse(res, {
    success: true,
    message: 'Review added successfully!!!',
    data: result,
    statusCode: StatusCodes.OK,
  });
});
const getAllDriver = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  console.log({ query });
  const result = await driverService.getAllDriver(query);
  sendResponse(res, {
    success: true,
    message: 'Drivers retrived successfully!!!',
    data: result.data,
    meta: result.meta,
    statusCode: StatusCodes.OK,
  });
});
const getSingleDriver = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  const result = await driverService.getSingleDriver(id);
  sendResponse(res, {
    success: true,
    message: 'Driver retrived successfully!!!',
    data: result,

    statusCode: StatusCodes.OK,
  });
});
const getSingleDriverByUserId = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    console.log({ id });
    const result = await driverService.getSingleDriverByUserId(id);
    sendResponse(res, {
      success: true,
      message: 'Driversss retrived successfully!!!',
      data: result,

      statusCode: StatusCodes.OK,
    });
  },
);

const updateDriverStatus = catchAsync(async (req: Request, res: Response) => {
  const id = (req.user as JwtPayload).id;
  console.log({ id, body: req.body });
  const result = await driverService.updateDriverStatus(id, req.body);
  sendResponse(res, {
    success: true,
    message: 'Driver status updated successfully',
    data: result,
    statusCode: 200,
  });
});

const myLoad = catchAsync(async (req: Request, res: Response) => {
  const id = (req.user as JwtPayload).id;

  const result = await driverService.myLoad(id);
  sendResponse(res, {
    success: true,
    message: 'Loads retrived successfully',
    data: result,
    statusCode: StatusCodes.OK,
  });
});

const updateProfileImage = catchAsync(async (req: Request, res: Response) => {
  const id = (req.user as JwtPayload).id;

  const result = await driverService.updatePhoto(
    id,
    req.file as Express.Multer.File,
  );
  sendResponse(res, {
    success: true,
    message: 'profile update  successfully',
    data: result,
    statusCode: StatusCodes.OK,
  });
});
const declinedLoads = catchAsync(async (req: Request, res: Response) => {
  const id = (req.user as JwtPayload).id;
  const loadId = req.params.id;
  const result = await driverService.declinedLoads(id, loadId);
  sendResponse(res, {
    success: true,
    message: 'load declined  successfully',
    data: result,
    statusCode: StatusCodes.OK,
  });
});
const suggestedDriver = catchAsync(async (req: Request, res: Response) => {
  const result = await driverService.suggestedDriver(req.body);
  sendResponse(res, {
    success: true,
    message: 'Drivers retrived  successfully',
    data: result,
    statusCode: StatusCodes.OK,
  });
});

export const driverController = {
  updateDriverProfile,
  assignLoadToDriver,
  updateLoadStatus,
  reviewDriver,
  getAllDriver,
  updateDriverStatus,
  myLoad,
  updateProfileImage,
  getSingleDriver,
  getSingleDriverByUserId,
  declinedLoads,
  suggestedDriver,
};
