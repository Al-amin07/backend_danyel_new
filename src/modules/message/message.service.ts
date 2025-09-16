import mongoose, { Types } from 'mongoose';
import { IMessage } from './message.interface';
import { Message } from './message.model';
import { getIO, onlineUsers } from '../../socket';
import config from '../../config';

const createMessage = async (
  payload: IMessage,
  file: Express.Multer.File | undefined,
) => {
  const io = getIO();

  if (file?.path) {
    payload.document = `${config.server_url}/uploads/${file?.filename}`;
  }
  let message = await Message.create(payload);
  message = await message.populate({
    path: 'sender receiver',
    select: 'name email profileImage',
  });
  const receiverSocketId =
    onlineUsers[(payload?.receiver as Types.ObjectId)?.toString()];
  if (receiverSocketId) {
    io.to(receiverSocketId).emit('receive_message', {
      _id: message._id,
      senderId: message.sender,
      receiverId: message.receiver,
      text: message.text,
      document: message.document,
      isRead: message.isRead,
      createdAt: message.createdAt,
    });
  }
  // const result = await Message.create(payload);
  return message;
};

const getAllMessage = async () => {
  const result = await Message.find({})
    .populate({
      path: 'sender',
      select: 'name email profileImage',
    })
    .populate({
      path: 'receiver',
      select: 'name email profileImage',
    })
    .sort({ createdAt: -1 })
    .exec();
  return result;
};
const getInboxMessage = async (payload: {
  senderId: string;
  receiverId: string;
}) => {
  console.log({ payload });

  const messages = await Message.find({
    $or: [
      {
        sender: new mongoose.Types.ObjectId(payload?.senderId),
        receiver: new mongoose.Types.ObjectId(payload?.receiverId),
      },
      {
        sender: new mongoose.Types.ObjectId(payload?.receiverId),
        receiver: new mongoose.Types.ObjectId(payload?.senderId),
      },
    ],
  })
    .populate({
      path: 'sender',
      select: 'name email profileImage',
    })
    .populate({
      path: 'receiver',
      select: 'name email profileImage',
    })
    .sort({ createdAt: 1 });
  return messages;
};

const getUserConversations = async (userId: string) => {
  return await Message.aggregate([
    {
      $match: {
        $or: [
          { sender: new mongoose.Types.ObjectId(userId) },
          { receiver: new mongoose.Types.ObjectId(userId) },
        ],
      },
    },
    { $sort: { createdAt: -1 } }, // sort all messages by newest first
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$sender', new mongoose.Types.ObjectId(userId)] },
            '$receiver',
            '$sender',
          ],
        },
        lastMessage: { $first: '$$ROOT' }, // keep the latest only
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        user: { _id: 1, name: 1, email: 1, profileImage: 1 },
        text: '$lastMessage.text',
        isRead: '$lastMessage.isRead',
        createdAt: '$lastMessage.createdAt',
      },
    },
    { $sort: { createdAt: -1 } },
  ]);
};

const markMessageAsRead = async (messageIds: string[]) => {
  return await Message.updateMany(
    { _id: { $in: messageIds } },
    { isRead: true },
    { new: true },
  );
};

export const MessageService = {
  createMessage,
  getAllMessage,
  getInboxMessage,
  getUserConversations,
  markMessageAsRead,
};
