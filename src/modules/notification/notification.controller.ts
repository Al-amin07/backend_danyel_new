import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../util/catchAsync';
import sendResponse from '../../util/sendResponse';
import { notificationService } from './notification.service';

const getAllNotification = catchAsync(async (req, res) => {
  const result = await notificationService.getAllNotification();
  sendResponse(res, {
    data: result,
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notifications retrived successfully',
  });
});
const sendNotification = catchAsync(async (req, res) => {
  console.log({ req: req.body });
  const result = await notificationService.sendNotification(req.body);
  sendResponse(res, {
    data: result,
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notifications send successfully',
  });
});
const getMyNotification = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await notificationService.getMyNotification(id);
  sendResponse(res, {
    data: result,
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notifications retrived successfully',
  });
});
const getSingleNotification = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await notificationService.getSingleNotificationData(id);
  sendResponse(res, {
    data: result,
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notification retrived successfully',
  });
});
const markNotificationsAsRead = catchAsync(async (req, res) => {
  const { notifications } = req.body;
  const result =
    await notificationService.markNotificationsAsRead(notifications);
  sendResponse(res, {
    data: result,
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notifications updated successfully',
  });
});
const changeNotificationPreferences = catchAsync(async (req, res) => {
  const { notifications } = req.body;
  const id = req.user?.id;
  console.log({ notifications, id });
  const result = await notificationService.changeNotificationPreferences(
    id,
    notifications,
  );
  sendResponse(res, {
    data: result,
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notifications updated successfully',
  });
});

export const notificationController = {
  getAllNotification,
  getMyNotification,
  sendNotification,
  markNotificationsAsRead,
  changeNotificationPreferences,
  getSingleNotification,
};
