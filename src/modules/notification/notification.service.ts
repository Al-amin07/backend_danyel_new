import { Types } from 'mongoose';
import { userRole } from '../../constents';
import ApppError from '../../error/AppError';
import { fcmAdmin } from '../../firebaseAdmin';
import { getIO, onlineUsers } from '../../socket';
import { Driver } from '../Driver/driver.model';
import { User } from '../user/user.model';
import { INotification } from './notification.interface';
import { Notification } from './notification.model';

// const sendNotification = async (notification: INotification) => {
//   console.log({ notification });
//   const result = await Notification.create(notification);
//   const isUserExist = await User.findById(notification?.receiverId);
//   if (isUserExist?.role === userRole.driver) {
//     const isDriverExist = await Driver.findOne({ user: isUserExist?.id });
//     if (
//       isDriverExist &&
//       isDriverExist.notificationPreferences &&
//       isDriverExist.notificationPreferences[
//         notification.type as keyof typeof isDriverExist.notificationPreferences
//       ] === true
//     ) {
//       const io = getIO();
//       //   const receiverSocketId = onlineUsers[String('68b659c9778a2b206a349ed3')];

//       const receiverSocketId = onlineUsers[String(notification?.receiverId)];
//       //   console.log({ receiverSocketId, form: notification, onlineUsers });
//       if (receiverSocketId) {
//         io.to(receiverSocketId).emit('receive_notification', notification);
//       }
//     }
//   } else if (isUserExist?.role === userRole.company) {
//     const io = getIO();
//     //   const receiverSocketId = onlineUsers[String('68b659c9778a2b206a349ed3')];

//     const receiverSocketId = onlineUsers[String(notification?.receiverId)];
//     //   console.log({ receiverSocketId, form: notification, onlineUsers });
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit('receive_notification', notification);
//     }
//   }

//   return result;
// };

export const sendNotification = async (notificationData: INotification) => {
  const result = await Notification.create(notificationData);
  console.log({ notificationData });
  const user = await User.findById(notificationData.receiverId);
  if (!user || !user.firebaseToken) return result; // no token, skip FCM
  // console.log({ notificationData, user });

  try {
    const io = getIO();
    // const receiverSocketId = onlineUsers[String('68b659c9778a2b206a349ed3')];

    const receiverSocketId = onlineUsers[String(notificationData?.receiverId)];
    //   console.log({ receiverSocketId, form: notification, onlineUsers });
    console.log('sgvgfv', receiverSocketId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive_notification', notificationData);
    }

    const res = await fcmAdmin.send({
      token: user.firebaseToken, // ✅ Device token
      data: {
        title: 'New Notification',
        body: notificationData.content,
        loadId: String(notificationData?.load as Types.ObjectId),
        token: user?.firebaseToken,
      },
    });
    console.log({ res });

    console.log('FCM notification sent successfully to single device');
  } catch (err) {
    console.error('Error sending FCM notification:', err);
  }

  return result;
};

const getAllNotification = async () => {
  const result = await Notification.find()
    .populate({
      path: 'senderId',
      select: 'name email profileImage',
    })
    .populate({
      path: 'receiverId',
      select: 'name email profileImage',
    })
    .sort({ createdAt: -1 });
  return result;
};

const getMyNotification = async (id: string) => {
  const result = await Notification.find({ receiverId: id })
    .populate({
      path: 'senderId',
      select: 'name email profileImage',
    })
    .populate({
      path: 'receiverId',
      select: 'name email profileImage',
    })
    .sort({ createdAt: -1 });
  return result;
};

const markNotificationsAsRead = async (notifications: string[]) => {
  console.log({ notifications });
  const result = await Notification.updateMany(
    { _id: { $in: notifications } },
    { $set: { isRead: true } },
  );
  return result;
};

const changeNotificationPreferences = async (
  userId: string,
  notifications: any,
) => {
  const isUserExist = await User.findById(userId);
  if (isUserExist?.role === userRole.driver) {
    const isDriverExist = await Driver.findOne({ user: isUserExist?.id });
    if (!isDriverExist) {
      throw new ApppError(404, 'Driver not found');
    }
    const result = await Driver.findByIdAndUpdate(
      isDriverExist?.id,
      {
        notificationPreferences: {
          ...isDriverExist.notificationPreferences,
          ...notifications,
        },
      },
      { new: true },
    );
    return result;
  }
};

export const notificationService = {
  getAllNotification,
  getMyNotification,
  sendNotification,
  markNotificationsAsRead,
  changeNotificationPreferences,
};
