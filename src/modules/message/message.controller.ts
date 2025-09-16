import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../util/catchAsync';
import sendResponse from '../../util/sendResponse';
import { MessageService } from './message.service';

const createMessage = catchAsync(async (req, res) => {
  const file = req.file;
  const result = await MessageService.createMessage(req.body, file);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Message  created successfully',
  });
});
const getAllMessage = catchAsync(async (req, res) => {
  const result = await MessageService.getAllMessage();
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Messages  retrived successfully',
  });
});
const getUserAllConversion = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result = await MessageService.getUserConversations(id);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: StatusCodes.OK,
    message: 'My Messages  retrived successfully',
  });
});
const getInboxMessage = catchAsync(async (req, res) => {
  const senderId = req.params.senderId;
  const receiverId = req.params.receiverId;
  const result = await MessageService.getInboxMessage({ senderId, receiverId });
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: StatusCodes.OK,
    message: 'My Messages  retrived successfully',
  });
});
const markMessageAsRead = catchAsync(async (req, res) => {
  const messageIds = req.body.messageIds;
  const result = await MessageService.markMessageAsRead(messageIds);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Messages marked as read successfully',
  });
});

export const messageController = {
  createMessage,
  getAllMessage,
  getInboxMessage,
  getUserAllConversion,
  markMessageAsRead,
};
