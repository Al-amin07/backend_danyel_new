import { StatusCodes } from 'http-status-codes';
import QueryBuilder from '../../builder/QueryBuilder';
import ApppError from '../../error/AppError';
import { ICompany } from './company.interface';
import { Company } from './company.model';
import { companySarchableFields } from './conpany.constant';
import { LoadModel } from '../load/load.model';
import { notificationService } from '../notification/notification.service';
import mongoose, { Types } from 'mongoose';
import { ENotificationType } from '../notification/notification.interface';
import { User } from '../user/user.model';
import { Driver } from '../Driver/driver.model';
import config from '../../config';

const getAllCompanyFromDb = async (query: Record<string, unknown>) => {
  const companyQuery = new QueryBuilder(Company.find(), query)
    .search(companySarchableFields)
    .sort()
    .filter()
    .paginate();
  // console.log({ companyQuery });
  const result = await companyQuery.modelQuery
    .select('-password')
    .populate('user')
    .populate('loads')
    .populate('drivers');
  // console.log({ result });
  const metadata = await companyQuery.getMetaData();
  return {
    meta: metadata,
    data: result,
  };
};

const getSingleCompany = async (id: string) => {
  const result = await Company.findById(id)
    .populate('user')
    .populate('loads')
    .populate({ path: 'drivers', populate: 'user currentLoad' })
    .select('-password');
  return result;
};

const updateCompany = async (userId: string, payload: ICompany) => {
  const {
    address,
    notificationPreferences,
    loads,
    drivers,
    user,
    ...restCompanyInfo
  } = payload;
  const updatedCompany: Record<string, unknown> = { ...restCompanyInfo };
  if (address) {
    (Object.keys(address) as (keyof {})[]).forEach((key) => {
      updatedCompany[`address.${key}`] = address[key];
    });
  }
  if (notificationPreferences) {
    (Object.keys(notificationPreferences) as (keyof {})[]).forEach((key) => {
      updatedCompany[`notificationPreferences.${key}`] =
        notificationPreferences[key];
    });
  }
  if (user) {
    const updatedUserDetails = await User.findByIdAndUpdate(
      userId,
      { ...user },
      { new: true },
    );
    console.log({ updatedUserDetails });
  }

  const result = await Company.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        ...updatedCompany,
      },
      $push: {
        loads,
        drivers,
      },
    },
    { new: true, upsert: true },
  )
    .populate('user')
    .populate('loads')
    .populate('drivers')
    .select('-password');
  console.log({ result });
  return result;
};

const updateCompanyLogo = async (userId: string, file: Express.Multer.File) => {
  let profileImage = '';
  console.log({ file });
  if (!file?.path) {
    throw new ApppError(StatusCodes.BAD_REQUEST, 'Please upload a photo');
  }
  profileImage = `${config.server_url}/uploads/${file?.filename}`;
  const result = await User.findByIdAndUpdate(userId, { profileImage });
  return result;
};

const getAllCompanyLoad = async (
  userId: string,
  query: Record<string, unknown>,
) => {
  const isCompanyExist = await Company.findOne({ user: userId }).populate(
    'loads',
  );

  // console.log({ isCompanyExist });
  if (!isCompanyExist) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'Company not found');
  }

  const loadQuery = new QueryBuilder(
    LoadModel.find({ companyId: isCompanyExist?.id }),
    query,
  )
    .search([
      'loadId',
      'loadType',
      'loadStatus',
      'paymentStatus',
      'pickupAddress.street',
      'pickupAddress.city',
      'pickupAddress.apartment',
      'pickupAddress.country',
      'deliveryAddress.street',
      'deliveryAddress.city',
      'deliveryAddress.apartment',
      'deliveryAddress.country',
    ])
    .filter()
    .sort()
    .paginate();
  const result = await loadQuery.modelQuery.populate({
    path: 'assignedDriver',
    populate: { path: 'user', select: 'name email profileImage role' },
  });

  const meta = await loadQuery.getMetaData();
  return {
    data: result,
    meta,
  };
};

const companyStat = async (id: string) => {
  const isCompanyExist = await Company.findOne({ user: id })
    .populate('user')
    .populate('loads');
  // console.log({ id, isCompanyExist: isCompanyExist?.loads });
  const allLoads = await LoadModel.find({ companyId: isCompanyExist?.id });
  const activeLoads = allLoads.filter((el) => {
    if (el.loadStatus !== 'Delivered' && el.loadStatus !== 'Cancelled') {
      return el;
    }
  }).length;
  const unassignedLoads = allLoads.filter((el) => !el.assignedDriver).length;

  const totalAmount = allLoads.reduce((acc, el) => acc + el.totalPayment, 0);

  const drivers = await Driver.find({ company: isCompanyExist?.id })
    .populate('loads')
    .populate('user')
    .lean();

  if (!drivers.length) return [];

  // Scoring weights
  const WEIGHTS = {
    rating: 0.5, // 50% importance
    onTime: 0.5, // 50% importance
  };

  // Normalize and score drivers
  const scoredDrivers = drivers.map((driver: any) => {
    const ratingScore = (driver.averageRating || 0) / 5; // normalize to 0-1
    const onTimeScore = (driver.onTimeRate || 0) / 100; // assuming it's percentage

    const score = ratingScore * WEIGHTS.rating + onTimeScore * WEIGHTS.onTime;

    return { ...driver, score };
  });

  // Sort by best score
  scoredDrivers.sort((a: any, b: any) => b.score - a.score);

  return {
    totalLoads: allLoads.length,
    activeLoads,
    unassignedLoads,
    topDrivers: scoredDrivers.slice(0, 3),
    totalAmount,
    totalDriver: isCompanyExist?.drivers?.length,
  };
};

const getCompanyEarning = async (id: string) => {
  const now = new Date();
  const isCompanyExist = await Company.findOne({ user: id });

  if (!isCompanyExist) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'Company not found');
  }
  console.log({ isCompanyExist });
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 6);

  const results = await LoadModel.aggregate([
    {
      $match: {
        companyId: isCompanyExist?.id, // ✅ ensure ObjectId
      },
    },
    {
      $addFields: {
        deliveryDateParsed: { $toDate: '$deliveryDate' }, // ✅ convert string -> Date
      },
    },
    {
      $facet: {
        last7Days: [
          { $match: { deliveryDateParsed: { $gte: sevenDaysAgo } } },
          {
            $group: {
              _id: null,
              totalEarnings: {
                $sum: {
                  $cond: [
                    { $eq: ['$paymentStatus', 'PAID'] },
                    '$totalPayment',
                    0,
                  ],
                },
              },
              pendingEarnings: {
                $sum: {
                  $cond: [
                    { $ne: ['$paymentStatus', 'PAID'] },
                    '$totalPayment',
                    0,
                  ],
                },
              },
              totalLoads: { $sum: 1 }, // ✅ count all loads
            },
          },
          {
            $addFields: {
              avgEarnings: {
                $cond: [
                  { $eq: ['$totalLoads', 0] },
                  0,
                  { $divide: ['$totalEarnings', '$totalLoads'] },
                ],
              },
            },
          },
        ],
        last30Days: [
          { $match: { deliveryDateParsed: { $gte: thirtyDaysAgo } } },
          {
            $group: {
              _id: null,
              totalEarnings: {
                $sum: {
                  $cond: [
                    { $eq: ['$paymentStatus', 'PAID'] },
                    '$totalPayment',
                    0,
                  ],
                },
              },
              pendingEarnings: {
                $sum: {
                  $cond: [
                    { $ne: ['$paymentStatus', 'PAID'] },
                    '$totalPayment',
                    0,
                  ],
                },
              },
              totalLoads: { $sum: 1 },
            },
          },
          {
            $addFields: {
              avgEarnings: {
                $cond: [
                  { $eq: ['$totalLoads', 0] },
                  0,
                  { $divide: ['$totalEarnings', '$totalLoads'] },
                ],
              },
            },
          },
        ],
        thisMonth: [
          { $match: { deliveryDateParsed: { $gte: startOfMonth } } },
          {
            $group: {
              _id: null,
              totalEarnings: {
                $sum: {
                  $cond: [
                    { $eq: ['$paymentStatus', 'PAID'] },
                    '$totalPayment',
                    0,
                  ],
                },
              },
              pendingEarnings: {
                $sum: {
                  $cond: [
                    { $ne: ['$paymentStatus', 'PAID'] },
                    '$totalPayment',
                    0,
                  ],
                },
              },
              totalLoads: { $sum: 1 },
            },
          },
          {
            $addFields: {
              avgEarnings: {
                $cond: [
                  { $eq: ['$totalLoads', 0] },
                  0,
                  { $divide: ['$totalEarnings', '$totalLoads'] },
                ],
              },
            },
          },
        ],
        lastSixMonths: [
          { $match: { deliveryDateParsed: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: null,
              totalEarnings: {
                $sum: {
                  $cond: [
                    { $eq: ['$paymentStatus', 'PAID'] },
                    '$totalPayment',
                    0,
                  ],
                },
              },
              pendingEarnings: {
                $sum: {
                  $cond: [
                    { $ne: ['$paymentStatus', 'PAID'] },
                    '$totalPayment',
                    0,
                  ],
                },
              },
              totalLoads: { $sum: 1 },
            },
          },
          {
            $addFields: {
              avgEarnings: {
                $cond: [
                  { $eq: ['$totalLoads', 0] },
                  0,
                  { $divide: ['$totalEarnings', '$totalLoads'] },
                ],
              },
            },
          },
        ],
      },
    },
  ]);

  return results[0];
};

const sendNotificationToSuggestedDrivers = async (
  companyId: string,
  payload: { driverUserIds: string[]; loadId: string },
) => {
  const isCompanyExist = await Company.findOne({ user: companyId });
  if (!isCompanyExist) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'Company not found');
  }
  const isLoadExist = await LoadModel.findById(payload.loadId);
  if (!isLoadExist) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'Load not found');
  }
  console.log(payload.driverUserIds);
  for (const driverId of payload.driverUserIds) {
    await notificationService.sendNotification({
      senderId: companyId as unknown as Types.ObjectId, // Company that sends the load
      receiverId: driverId as unknown as Types.ObjectId, // Driver receiving notification
      type: ENotificationType.LOAD_ASSIGNMENT_REQUEST, // Custom type
      content: 'New load available. Do you want to accept it?',
      load: isLoadExist?.id, // Store load reference for driver action
    });
  }
};

const acceptLoadRequest = async (payload: {
  loadId: string;
  userId: string;
  isAccepted: boolean;
}) => {
  const isLoadExist = await LoadModel.findById(payload.loadId).populate({
    path: 'companyId',
    populate: { path: 'user' },
  });
  if (!isLoadExist) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'Load not found');
  }
  if (isLoadExist?.loadStatus === 'Delivered') {
    throw new ApppError(StatusCodes.BAD_REQUEST, 'This Load already delivered');
  }
  const isDriverExist = await Driver.findOne({ user: payload.userId }).populate(
    'user',
  );
  if (!isDriverExist) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'Driver not found');
  }
  if (isDriverExist.currentLoad) {
    throw new ApppError(StatusCodes.BAD_REQUEST, 'Driver already has a load');
  }
  if (!payload?.isAccepted) {
    const result = await LoadModel.findByIdAndUpdate(
      payload.loadId,
      {
        $pull: { requestedDrivers: isDriverExist?.id },
      },
      { new: true },
    );
    return result;
  }
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1️⃣ Update Load directly
    const updatedLoad = await LoadModel.findByIdAndUpdate(
      payload.loadId,
      {
        assignedDriver: isDriverExist?.id,
        loadStatus: 'Assigned',
        $push: {
          statusTimeline: {
            status: 'Assigned',
            timestamp: new Date(),
            notes: `Load assigned to driver ID: ${isDriverExist.id}`,
          },
        },
      },
      { new: true, session },
    );

    // 2️⃣ Update Driver directly
    const updatedDriver = await Driver.findByIdAndUpdate(
      isDriverExist?.id,
      {
        currentLoad: payload.loadId,
        availability: 'On Duty',
        $addToSet: { loads: payload?.loadId },
      },
      { new: true, session },
    ).populate('user');
    if (updatedDriver) {
      await notificationService.sendNotification({
        content: `Load ${updatedLoad?.loadId} has been assigned to you`,
        type: ENotificationType.LOAD_ASSIGNMENT,
        receiverId: (updatedDriver?.user as any)?.id,
        load: updatedLoad?.id,
        senderId: (isLoadExist?.companyId as any)?.user?.id,
      });
    }

    // ✅ Commit transaction
    await session.commitTransaction();
    session.endSession();
    return updatedLoad;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const addDriverToCompany = async (
  companyUserId: string,
  driverUserId: string,
  isApproved: boolean,
) => {
  const company = await Company.findOne({ user: companyUserId }).populate(
    'user',
  );
  if (!company) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'Company not found');
  }
  const driver = await Driver.findOne({ user: driverUserId }).populate('user');
  if (!driver) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'Driver not found');
  }
  if (company.drivers.includes(driver?.id)) {
    throw new ApppError(StatusCodes.BAD_REQUEST, 'Driver already added');
  }
  if (!isApproved) {
    if (!company?.requestedDrivers?.includes(driver?.id)) {
      throw new ApppError(StatusCodes.BAD_REQUEST, 'Driver already rejected');
    }

    await Company.findByIdAndUpdate(
      company.id,
      { $pull: { requestedDrivers: driver?.id } },
      { new: true },
    );
    await notificationService.sendNotification({
      content: `You have been rejected by company ${company?.companyName}`,
      type: ENotificationType.JOIN_REQUEST,
      receiverId: new Types.ObjectId(driver?.user?.id),
      senderId: new Types.ObjectId(company?.user?.id),
    });
    return driver;
  }
  const updatedCompany = await Company.findByIdAndUpdate(
    company.id,
    {
      $addToSet: { drivers: driver?.id },
      $pull: { requestedDrivers: driver?.id },
    },
    { new: true },
  );
  const updatedDriver = await Driver.findByIdAndUpdate(
    driver?.id,
    { company: updatedCompany?.id },
    { new: true },
  );
  await notificationService.sendNotification({
    content: `You have been added to company ${updatedCompany?.companyName}`,
    type: ENotificationType.JOIN_REQUEST,
    receiverId: new Types.ObjectId(driver?.user?.id),
    senderId: new Types.ObjectId(company?.user?.id),
  });

  return updatedDriver;
};

export const companyService = {
  getAllCompanyFromDb,
  getSingleCompany,
  updateCompany,
  getAllCompanyLoad,
  companyStat,
  sendNotificationToSuggestedDrivers,
  getCompanyEarning,
  addDriverToCompany,
  acceptLoadRequest,
  updateCompanyLogo,
};
