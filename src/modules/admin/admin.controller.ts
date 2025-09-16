import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../util/catchAsync';
import sendResponse from '../../util/sendResponse';
import { adminService } from './admin.service';

const getAdminState = catchAsync(async (req, res) => {
  const result = await adminService.getAdminState();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Admin state fetched successfully',
    data: result,
  });
});

export const adminController = {
  getAdminState,
};
