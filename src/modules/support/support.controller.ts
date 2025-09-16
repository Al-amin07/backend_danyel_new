import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../util/catchAsync';
import sendResponse from '../../util/sendResponse';
import { supportService } from './support.service';

const createSupport = catchAsync(async (req, res) => {
  const result = await supportService.createSupport(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Support created successfully',
    data: result,
  });
});
const getAllSupport = catchAsync(async (req, res) => {
  const result = await supportService.getSupports();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Supports retrived successfully',
    data: result,
  });
});
const getSingleSupport = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await supportService.getSingleSupport(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Support retrived successfully',
    data: result,
  });
});

export const supportController = {
  createSupport,
  getAllSupport,
  getSingleSupport,
};
