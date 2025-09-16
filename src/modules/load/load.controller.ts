import catchAsync from '../../util/catchAsync';
import sendResponse from '../../util/sendResponse';
import { loadService } from './load.service';

const createLoad = catchAsync(async (req, res) => {
  const { id } = req.user;
  console.log(id);
  const result = await loadService.createLoadToDB(
    id,
    req.body,
    req.files as Express.Multer.File[],
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: 201,
    message: 'Load  created successfully',
  });
});
const getAllLoad = catchAsync(async (req, res) => {
  const query = req.query;

  const result = await loadService.getAllLoad(query);
  sendResponse(res, {
    data: result.result,
    meta: result.meta,
    success: true,
    statusCode: 200,
    message: 'Loads  retrived successfully',
  });
});
const getAllLoadByDriver = catchAsync(async (req, res) => {
  const query = req.query;
  const { id } = req.user;
  const result = await loadService.getAllLoadsByDriver(id, query);
  sendResponse(res, {
    data: result.result,
    meta: result.meta,
    success: true,
    statusCode: 200,
    message: 'Loads  retrived successfully',
  });
});
const getSingleLoad = catchAsync(async (req, res) => {
  const { loadId } = req.params;
  const result = await loadService.getSingleLoad(loadId);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: 200,
    message: 'Load  retrived successfully',
  });
});
const updateLoad = catchAsync(async (req, res) => {
  const { loadId } = req.params;
  console.log({ loadId });
  const result = await loadService.updateLoadToDB(
    loadId,
    req.body,
    req.files as Express.Multer.File[],
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: 200,
    message: 'Load  updated successfully',
  });
});
const aassignDriverToLoad = catchAsync(async (req, res) => {
  const { loadId } = req.params;

  const result = await loadService.assignDriver(loadId, req.body);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: 200,
    message: 'Driver assigned successfully',
  });
});

const generateLoadId = catchAsync(async (req, res) => {
  const result = await loadService.generateLoadId();
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: 200,
    message: 'Load id generated successfully',
  });
});
const updateLoadStatus = catchAsync(async (req, res) => {
  const { loadId } = req.params;
  const result = await loadService.updateLoadStatus(loadId, req.body);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: 200,
    message: 'Load status updated successfully',
  });
});
const changeDriver = catchAsync(async (req, res) => {
  const { loadId } = req.params;
  const { assignedDriver } = req.body;
  const result = await loadService.changedDriver(loadId, assignedDriver);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: 200,
    message: 'Load assignd successfully',
  });
});
const cancelLoadByDriverDriver = catchAsync(async (req, res) => {
  const { loadId } = req.params;

  const result = await loadService.cancelLoadByDriver(loadId);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: 200,
    message: 'Load cancelled successfully',
  });
});

export const loadController = {
  createLoad,
  getAllLoad,
  getSingleLoad,
  updateLoad,
  aassignDriverToLoad,
  generateLoadId,
  updateLoadStatus,
  changeDriver,
  cancelLoadByDriverDriver,
  getAllLoadByDriver,
};
