import catchAsync from '../../util/catchAsync';
import sendResponse from '../../util/sendResponse';
import userServices from './user.service';
import { StatusCodes } from 'http-status-codes';

const createAdmin = catchAsync(async (req, res) => {
  const user = req.body;
  const file = req.file;
  const result = await userServices.createAdminToDB(user, file);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'admin created successfully',
    data: result,
  });
});
const createCompany = catchAsync(async (req, res) => {
  const user = req.body;
  const file = req.file;
  const result = await userServices.createCompanyToDB(user, file);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'company created successfully',
    data: result,
  });
});
const createDriver = catchAsync(async (req, res) => {
  const user = req.body;
  const file = req.file;

  const result = await userServices.createDriverToDB(user, file);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'driver created successfully',
    data: result,
  });
});
const createSuperAdmin = catchAsync(async (req, res) => {
  const user = req.body;

  const result = await userServices.createSuperAdmin(user);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'admin created successfully',
    data: result,
  });
});

const getAllUsers = catchAsync(async (req, res) => {
  const query = req.query;
  const result = await userServices.getAllUsers(query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'All users retrived successfully',
    data: result.result,
    meta: result.meta,
  });
});
const blockUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await userServices.blockUser(id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User status updated  successfully',
    data: result,
  });
});
const deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await userServices.deleteUser(id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User status updated  successfully',
    data: result,
  });
});
const addFirebaseToken = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await userServices.addFirebaseToken(id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User token updated  successfully',
    data: result,
  });
});

const getUserProfile = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result = await userServices.getUserProfile(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User data retrived successfully',
    data: result,
  });
});

const userController = {
  createAdmin,
  createCompany,
  createDriver,
  getAllUsers,
  getUserProfile,
  createSuperAdmin,
  blockUser,
  deleteUser,
  addFirebaseToken,
};

export default userController;
