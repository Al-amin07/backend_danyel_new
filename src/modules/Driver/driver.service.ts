import config from '../../config';
import fs from 'fs';
import path from 'path';
import { Driver } from './driver.model';
import { LoadModel } from '../load/load.model';
import mongoose, { Types } from 'mongoose';
import ApppError from '../../error/AppError';
import { StatusCodes } from 'http-status-codes';
import { EAvailability, IReview } from './driver.interface';
import QueryBuilder from '../../builder/QueryBuilder';
import { ILoad, IStatusTimeline } from '../load/load.interface';
import { getLoadNote } from '../load/load.constant';
import { notificationService } from '../notification/notification.service';
import { Company } from '../Company/company.model';
import { User } from '../user/user.model';
import { endOfWeek, startOfWeek } from 'date-fns';
import { ENotificationType } from '../notification/notification.interface';
import { getLatLon } from '../../util/getLayLon';
const getAllDriver = async (query: Record<string, unknown>) => {
  const driverQuery = new QueryBuilder(
    Driver.find().populate({
      path: 'user',
      select: 'name email profileImage role',
    }),
    query,
  )
    .search([
      'user.name',
      'driverId',
      'user.email',
      'location.city',
      'location.street',
      'location.zipCode',
      'vehicleType',
      'vehicleModel',
      'availability',
    ])
    .filter()
    .sort()
    .paginate();
  const result = await driverQuery.modelQuery;
  const meta = await driverQuery.getMetaData();
  return {
    data: result,
    meta,
  };
};
const getSingleDriver = async (id: string) => {
  const result = await Driver.findById(id)
    .populate({
      path: 'user',
      select: 'name email profileImage role phone',
    })
    .populate({
      path: 'loads',
      populate: { path: 'companyId' },
    })
    .populate('currentLoad');

  return result;
};
const getSingleDriverByUserId = async (id: string) => {
  console.log({ id });
  const result = await Driver.findOne({ user: id })
    .populate({
      path: 'user',
      select: 'name email profileImage role phone _id',
    })
    .populate({
      path: 'loads',
      populate: { path: 'companyId' },
    })
    .populate('currentLoad');

  return result;
};
const updateDriverProfileIntoDb = async (
  id: string,
  payload: any,

  files: { [fieldname: string]: Express.Multer.File[] } | undefined,
  // file: Express.Multer.File,
) => {
  const folder = 'uploads/drivers';
  const { location, loads, name, ...restDriverData } = payload;
  console.log({ payload, files });
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  const updateData: any = { ...restDriverData };

  const fileFields: Record<string, string> = {
    nidOrPassport: 'nidOrPassport',
    drivingLicense: 'drivingLicense',
    vehicleRegistration: 'vehicleRegistration',
    profile: 'profile',
  };
  for (const [key, field] of Object.entries(fileFields)) {
    if (files?.[key]?.[0]) {
      const file = files[key][0];
      // console.log({ file });

      // Move file to /uploads/drivers with unique name
      const fileName = `${Date.now()}-${file.originalname}`;
      const destPath = path.join(folder, fileName);

      fs.renameSync(file.path, destPath);
      console.log(`File saved to ${destPath}`);
      if (file?.fieldname === 'profile') {
        const profileImage = `${config.server_url}/uploads/drivers/${fileName}`;
        const updateUser = await User.findByIdAndUpdate(
          id,
          { profileImage },
          { new: true },
        );
        console.log({ updateUser });
        continue;
      }
      // Save relative URL for DB
      updateData[field] = {
        type: file.mimetype,
        url: `${config.server_url}/uploads/drivers/${fileName}`,
      };
    }
  }
  // console.log({ updateData });
  if (location) {
    (Object.keys(location) as (keyof {})[]).forEach((key) => {
      updateData[`location.${key}`] = location[key];
    });
    const address = `${payload?.location?.street + ', ' + payload?.location?.city + ', ' + payload?.location?.state + ' ' + payload?.location?.zipCode + ', ' + payload?.location?.country}`;
    const driverLocation = await getLatLon(address);
    if (!driverLocation) {
      throw new ApppError(
        StatusCodes.BAD_REQUEST,
        'Failed to fetch driver location coordinates. Please check the address.',
      );
    }
    updateData['location.coordinates'] = [
      parseFloat(driverLocation.lon),
      parseFloat(driverLocation.lat),
    ];
    // updateData.location.type = 'Point';
  }
  const userData: { isProfileUpdate: boolean; name?: string } = {
    isProfileUpdate: true,
  };
  if (name) {
    userData.name = name;
  }
  const updatesUserData = await User.findByIdAndUpdate(
    id,
    { ...userData },
    { new: true },
  );
  const result = await Driver.findOneAndUpdate({ user: id }, updateData, {
    new: true,
  }).populate('user');
  return result;
};

const assignLoadToDriver = async (id: string, loadId: string) => {
  if (!mongoose.Types.ObjectId.isValid(loadId)) {
    throw new ApppError(StatusCodes.BAD_REQUEST, 'Invalid load ID');
  }

  const isLoadExist = await LoadModel.findById(loadId).lean();
  if (!isLoadExist) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'Load not found');
  }
  if (isLoadExist?.assignedDriver) {
    throw new ApppError(
      StatusCodes.BAD_REQUEST,
      'This load is already assigned to another driver',
    );
  }
  const isDriverExist = await Driver.findOne({ user: id }).populate('user');
  if (!isDriverExist) {
    throw new ApppError(
      StatusCodes.NOT_FOUND,
      'Driver profile not found. Please complete your driver profile first.',
    );
  }
  if (isDriverExist.availability === 'On Duty' || isDriverExist?.currentLoad) {
    throw new ApppError(StatusCodes.BAD_REQUEST, 'You are already on a load');
  }

  const statusTimeline = {
    status: 'Assigned',
    timestamp: new Date(),
    notes: `Load assigned to ${(isDriverExist?.user as any)?.name}`,
  };
  console.log({ isDriverExist });
  if (
    isDriverExist.loads &&
    isDriverExist.loads.length > 0 &&
    isDriverExist.loads.includes(new mongoose.Types.ObjectId(loadId))
  ) {
    throw new ApppError(
      StatusCodes.BAD_REQUEST,
      'This load is already assigned to you',
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await Driver.findOneAndUpdate(
      { user: id },
      {
        $set: { currentLoad: loadId, availability: 'On Duty' },
        $push: { loads: loadId },
      },
      { new: true, session, upsert: true },
    );

    await LoadModel.findByIdAndUpdate(
      loadId,
      {
        assignedDriver: result.id,
        loadStatus: 'Awaiting Pickup',
        $push: { statusTimeline },
      },
      { session },
    );

    const populatedResult = await Driver.findById(result._id)
      .populate('loads')
      .populate('currentLoad')
      .session(session);

    await session.commitTransaction();
    session.endSession();

    return populatedResult;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const updateLoadStatus = async (
  id: string,
  payload: { loadId: string; status: string },
) => {
  if (!mongoose.Types.ObjectId.isValid(payload?.loadId)) {
    throw new ApppError(StatusCodes.BAD_REQUEST, 'Invalid load ID');
  }

  const isLoadExist = await LoadModel.findById(payload?.loadId)
    .populate({
      path: 'companyId',
      populate: { path: 'user', select: 'name email profileImage role _id' },
    })
    .lean();
  if (!isLoadExist) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'Load not found');
  }
  if (isLoadExist.loadStatus === payload?.status) {
    throw new ApppError(
      StatusCodes.BAD_REQUEST,
      `Load is already in ${payload?.status} status`,
    );
  }

  const isDriverExist = await Driver.findOne({ user: id }).populate('user');
  if (!isDriverExist) {
    throw new ApppError(
      StatusCodes.NOT_FOUND,
      'Driver profile not found. Please complete your driver profile first.',
    );
  }
  console.log(isLoadExist?.assignedDriver === isDriverExist?.id);
  if (isLoadExist.assignedDriver != isDriverExist?.id) {
    throw new ApppError(
      StatusCodes.FORBIDDEN,
      'You are not authorized to update this load status',
    );
  }

  if (payload?.status) {
    const statusTimeline: IStatusTimeline = {
      status: payload?.status as
        | 'Pending Assignment'
        | 'Assigned'
        | 'In Transit'
        | 'At Pickup'
        | 'En Route to Pickup'
        | 'Delivered'
        | 'Cancelled',
      timestamp: new Date(),
      notes: getLoadNote(
        payload?.status as
          | 'Pending Assignment'
          | 'Assigned'
          | 'In Transit'
          | 'At Pickup'
          | 'En Route to Pickup'
          | 'Delivered'
          | 'Cancelled',
        (isLoadExist.assignedDriver as any).name,
      ),
    };
    if (payload?.status === 'In Transit') {
      statusTimeline.expectedDeliveryDate = new Date(
        new Date().getTime() + 12 * 60 * 60 * 1000,
      );
    }

    const result = await LoadModel.findByIdAndUpdate(
      payload?.loadId,
      { loadStatus: payload?.status, $push: { statusTimeline } },
      { new: true },
    );
    if (payload?.status === 'Delivered') {
      await updateDriverOnTimeRate(isDriverExist?._id as string);

      await notificationService.sendNotification({
        content: `Load ${isLoadExist?.loadId} has been successfully deliveried by ${(isDriverExist?.user as any)?.name}`,
        type: ENotificationType.LOAD_STATUS_UPDATE,
        load: result?.id,
        receiverId: (isLoadExist?.companyId as any)?.user?._id,
      });
      // console.log({ sendNotification });
    } else if (payload?.status === 'Cancelled') {
      await Driver.findByIdAndUpdate(isDriverExist?._id, {
        $set: { currentLoad: null, availability: 'Available' },
        $pull: { loads: payload?.loadId },
      });
      await notificationService.sendNotification({
        content: `Load ${isLoadExist?.loadId} has been cancelled  by ${(isDriverExist?.user as any)?.name}`,
        type: ENotificationType.LOAD_STATUS_UPDATE,
        load: result?.id,
        receiverId: (isLoadExist?.companyId as any)?.user?._id,
      });
    } else {
      await notificationService.sendNotification({
        content: `Driver ${(isDriverExist?.user as any)?.name} has updated load ${isLoadExist?.loadId} to: ${payload?.status}`,
        type: ENotificationType.LOAD_STATUS_UPDATE,
        load: result?.id,
        receiverId: (isLoadExist?.companyId as any)?.user?._id,
      });
      // console.log({ sendNotification });
    }

    return result;
  }
};

const reviewDriver = async (id: string, payload: IReview, userId: string) => {
  if (payload?.rating < 1 || payload?.rating > 5) {
    throw new ApppError(
      StatusCodes.BAD_REQUEST,
      'Rating must be between 1 and 5',
    );
  }
  const isDriverExist = await Driver.findById(id).populate('user');
  if (!isDriverExist) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'Driver not found');
  }
  const isCompanyExist = await Company.findOne({ user: userId }).populate(
    'user',
  );

  const isReviewExist = isDriverExist?.reviews?.find(
    (el) => el.loadId == payload.loadId,
  );
  if (isReviewExist) {
    throw new ApppError(
      StatusCodes.BAD_REQUEST,
      'You already reviewed this driver for this load',
    );
  }
  payload.companyId = isCompanyExist?.id;

  const totalReviews = isDriverExist?.reviews?.reduce(
    (acc, el) => acc + el.rating,
    0,
  );
  const averageRating =
    ((totalReviews as number) + payload.rating) /
    ((isDriverExist?.reviews?.length as number) + 1);

  const sendNotification = await notificationService.sendNotification({
    content: `You got ${payload?.rating} rating form Dispatcher ${(isCompanyExist?.user as any)?.name}`,
    type: ENotificationType.OTHER,
    receiverId: (isDriverExist?.user as any)?._id,
  });

  console.log({ payload, isDriverExist, averageRating, sendNotification });
  const result = await Driver.findByIdAndUpdate(
    id,
    { $push: { reviews: payload }, $set: { averageRating } },
    { new: true },
  );
  const updatedLoad = await LoadModel.findByIdAndUpdate(
    payload?.loadId,
    { $set: { review: { rating: payload?.rating, comment: payload?.review } } },
    { new: true },
  );
  return result;
};

const updateDriverStatus = async (id: string, payload: { status: boolean }) => {
  const isDriverExist = await Driver.findOne({ user: id });
  if (!isDriverExist) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'Driver not found');
  }
  const result = await Driver.findByIdAndUpdate(
    isDriverExist?.id,
    { status: payload.status },
    { new: true },
  );
  return result;
};

const myLoad = async (id: Types.ObjectId) => {
  const isDriverExist = await Driver.findOne({ user: id });
  const result = await LoadModel.find({ assignedDriver: isDriverExist?.id });
  const totalAmount = result.reduce((acc, el) => acc + el.totalPayment, 0);
  const pendingAmount = result
    .filter((el) => el.loadStatus !== 'Delivered')
    .reduce((acc, item) => acc + item.totalPayment, 0);
  const paidAmount = result
    .filter(
      (el) => el.paymentStatus === 'PAID' && el.loadStatus === 'Delivered',
    )
    .reduce((acc, item) => acc + item.totalPayment, 0);
  const completedLoad = result.filter(
    (el) => el.paymentStatus === 'PAID',
  ).length;
  const activeLoad = result.filter((el) => el.paymentStatus !== 'PAID').length;
  // Weekly stats
  const start = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(new Date(), { weekStartsOn: 1 });

  const weeklyLoads = result.filter(
    (el) => (el.createdAt as Date) >= start && (el.createdAt as Date) <= end,
  );

  const weeklyEarnings = weeklyLoads.reduce(
    (acc, el) => acc + (el.totalPayment || 0),
    0,
  );

  const weeklyDistance = weeklyLoads.reduce(
    (acc, el) => acc + (el.totalDistance || 0),
    0,
  );
  return {
    data: result,
    totalAmount,
    pendingAmount,
    paidAmount,
    completedLoad,
    activeLoad,
    weekly: {
      loads: weeklyLoads.length,
      earnings: weeklyEarnings,
      distance: weeklyDistance,
    },
  };
};
const updatePhoto = async (id: string, file: Express.Multer.File) => {
  let profileImage = '';
  console.log({ file });
  if (!file?.path) {
    throw new ApppError(StatusCodes.BAD_REQUEST, 'Please upload a photo');
  }
  profileImage = `${config.server_url}/uploads/${file?.filename}`;
  const result = await User.findByIdAndUpdate(id, { profileImage });
  return result;
};

const declinedLoads = async (driverUserId: string, loadId: string) => {
  console.log({ driverUserId, loadId });
  const isDriverExist = await Driver.findOne({ user: driverUserId });
  if (!isDriverExist) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'Driver not found');
  }

  const result = await Driver.findByIdAndUpdate(
    isDriverExist?._id,
    { $addToSet: { declinedLoads: loadId } },
    { new: true },
  );
  console.log({ result });
  return result;
};

const suggestedDriver = async (payload: {
  pickupLat: number;
  pickupLng: number;
}) => {
  console.log({ payload });
  const nearbyDrivers = await Driver.find({
    availability: 'AVAILABLE',
    'location.coordinates': { $exists: true },
    'location.type': 'Point',
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [payload?.pickupLng, payload?.pickupLat], // [lng, lat]
        },
        $maxDistance: 300000,
      },
    },
  });
  console.log({ nearbyDrivers });

  if (!nearbyDrivers.length) {
    return [];
  }
  return nearbyDrivers;
};

const sendLoadRequest = async (payload: { loadId: string }, userId: string) => {
  const isDriverExist = await Driver.findOne({ user: userId });
  if (!isDriverExist) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'Driver not found');
  }
  if (isDriverExist.currentLoad) {
    throw new ApppError(StatusCodes.BAD_REQUEST, 'You already have a load');
  }
  const isLoadExist = await LoadModel.findById(payload?.loadId).populate({
    path: 'companyId',
    populate: { path: 'user', select: 'name email profileImage _id' },
  });
  if (!isLoadExist) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'Load not found');
  }

  await notificationService.sendNotification({
    content: `${isDriverExist?.driverId ? isDriverExist?.driverId : isDriverExist?.id} has requested to pickup load ${isLoadExist?.loadId}`,
    type: ENotificationType.LOAD_ASSIGNMENT_REQUEST,
    receiverId: (isLoadExist?.companyId as any)?.user?._id,
    load: isLoadExist?.id,
    senderId: new mongoose.Types.ObjectId(userId),
  });
  const updatedLoad = await LoadModel.findByIdAndUpdate(
    isLoadExist?.id,
    {
      $addToSet: { requestedDrivers: isDriverExist?.id },
    },
    { new: true },
  );
  return updatedLoad;
};

export const driverService = {
  updateDriverProfileIntoDb,
  assignLoadToDriver,
  updateLoadStatus,
  reviewDriver,
  getAllDriver,
  updateDriverStatus,
  myLoad,
  updatePhoto,
  getSingleDriver,
  getSingleDriverByUserId,
  declinedLoads,
  suggestedDriver,
  sendLoadRequest,
};

export const updateDriverOnTimeRate = async (driverId: string) => {
  if (!driverId) return;

  const deliveredLoads = await LoadModel.aggregate([
    { $match: { assignedDriver: driverId, loadStatus: 'Delivered' } },
    {
      $addFields: {
        expectedDate: {
          $ifNull: [
            { $last: '$statusTimeline.expectedDeliveryDate' },
            '$deliveryDate',
          ],
        },
      },
    },
    {
      $project: {
        onTime: {
          $cond: [{ $lte: ['$deliveryDate', '$expectedDate'] }, 1, 0],
        },
      },
    },
    {
      $group: {
        _id: null,
        totalDelivered: { $sum: 1 },
        onTimeDelivered: { $sum: '$onTime' },
      },
    },
    {
      $project: {
        _id: 0,
        onTimeRate: {
          $cond: [
            { $eq: ['$totalDelivered', 0] },
            0,
            {
              $multiply: [
                { $divide: ['$onTimeDelivered', '$totalDelivered'] },
                100,
              ],
            },
          ],
        },
      },
    },
  ]);

  const onTimeRate = deliveredLoads[0]?.onTimeRate || 0;

  // Update the driver document
  const res = await Driver.findByIdAndUpdate(
    driverId,
    { onTimeRate, currentLoad: null, availability: 'Available' },
    { new: true },
  );
};

// const drivers = await Driver.find({
//   availability: EAvailability.AVAILABLE,
//   status: true,
//   currentLoad: null,
// })
//   .populate('loads')
//   .populate('user')
//   .lean();

// if (!drivers.length) return [];

// // Scoring weights
// const WEIGHTS = {
//   rating: 0.5, // 50% importance
//   onTime: 0.5, // 50% importance
// };

// // Normalize and score drivers
// const scoredDrivers = drivers.map((driver: any) => {
//   const ratingScore = (driver.averageRating || 0) / 5; // normalize to 0-1
//   const onTimeScore = (driver.onTimeRate || 0) / 100; // assuming it's percentage

//   const score = ratingScore * WEIGHTS.rating + onTimeScore * WEIGHTS.onTime;

//   return { ...driver, score };
// });

// // Sort by best score
// scoredDrivers.sort((a, b) => b.score - a.score);

// // Return top 3 drivers
// return scoredDrivers.slice(0, 3);
