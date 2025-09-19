import mongoose, { Types } from 'mongoose';
import config from '../../config';
import ApppError from '../../error/AppError';
import { IAddress, ILoad, IStatusTimeline } from './load.interface';
import { LoadModel } from './load.model';
import { Driver } from '../Driver/driver.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { Company } from '../Company/company.model';
import { StatusCodes } from 'http-status-codes';
import { getLoadNote } from './load.constant';

import { notificationService } from '../notification/notification.service';
import {
  ENotificationType,
  INotification,
} from '../notification/notification.interface';
import { getLatLon } from '../../util/getLayLon';

const createLoadToDB = async (
  userId: string,
  payload: ILoad,
  files: Express.Multer.File[],
) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApppError(StatusCodes.BAD_REQUEST, 'Invalid Company ID');
  }
  const isLoadExist = await LoadModel.findOne({ loadId: payload?.loadId });
  if (isLoadExist) {
    throw new ApppError(StatusCodes.BAD_REQUEST, 'Duplicate Load Id');
  }
  const isCompanyExist = await Company.findOne({ user: userId });
  if (!isCompanyExist) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'Company not found!!!');
  }
  payload.companyId = isCompanyExist._id.toString();

  payload.totalPayment = Number(
    (payload.totalDistance * payload.ratePerMile).toFixed(3),
  );

  if (!files || files.length === 0) {
    throw new ApppError(StatusCodes.NOT_FOUND, 'No files uploaded');
  }

  const notification: INotification = {
    type: ENotificationType.LOAD_ASSIGNMENT,
    content: `New load assigned by : ${isCompanyExist?.companyName}`,
  };

  const deliveryStr = `${payload?.deliveryAddress?.street + ', ' + payload?.deliveryAddress?.city + ', ' + payload?.deliveryAddress?.state + ' ' + payload?.deliveryAddress?.zipCode + ', ' + payload?.deliveryAddress?.country}`;
  const pickupStr = `${payload?.pickupAddress?.street + ', ' + payload?.pickupAddress?.city + ', ' + payload?.pickupAddress?.state + ' ' + payload?.pickupAddress?.zipCode + ', ' + payload?.pickupAddress?.country}`;

  const pickLocation = await getLatLon(pickupStr);
  if (!pickLocation) {
    throw new ApppError(
      StatusCodes.BAD_REQUEST,
      'Failed to fetch pickup location coordinates. Please check the address.',
    );
  }

  const delivaryLocation = await getLatLon(deliveryStr);
  console.log({ delivaryLocation, pickLocation });
  if (!delivaryLocation) {
    throw new ApppError(
      StatusCodes.BAD_REQUEST,
      'Failed to fetch delivary location coordinates. Please check the address.',
    );
  }
  payload.pickupAddress.location = {
    lat: parseFloat(pickLocation.lat),
    lng: parseFloat(pickLocation.lon),
  };

  payload.deliveryAddress.location = {
    lat: parseFloat(delivaryLocation.lat),
    lng: parseFloat(delivaryLocation.lon),
  };

  const documents = files.map((file) => ({
    type: file?.mimetype,
    name: file?.originalname,
    url: `${config.server_url}/uploads/${file?.filename}`,
  }));
  if (payload?.assignedDriver) {
    if (!mongoose.Types.ObjectId.isValid(payload?.assignedDriver)) {
      throw new ApppError(StatusCodes.BAD_REQUEST, 'Invalid driver ID');
    }
    const isDriverExist = await Driver.findById(
      payload?.assignedDriver,
    ).populate('user');
    if (!isDriverExist) {
      throw new ApppError(StatusCodes.NOT_FOUND, 'Driver not found');
    }
    notification.receiverId = new mongoose.Types.ObjectId(
      isDriverExist?.user?._id,
    );

    const statusTimeline: IStatusTimeline = {
      status: 'Assigned',
      timestamp: new Date(),
      notes: `Load assigned to ${(isDriverExist?.user as any)?.name}`,
    };
    payload.statusTimeline = [statusTimeline];
    payload.loadStatus = 'Assigned';
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await LoadModel.create([{ ...payload, documents }], {
      session,
    });
    if (payload?.assignedDriver) {
      const updatedDriver = await Driver.findByIdAndUpdate(
        payload?.assignedDriver,
        {
          $set: { currentLoad: result[0]._id, availability: 'On Duty' },
          $addToSet: { loads: result[0]._id },
        },
        { new: true, session },
      );
      notification.load = result[0];
      await notificationService.sendNotification(notification);
      await Company.findByIdAndUpdate(
        payload?.companyId,
        { $addToSet: { loads: result[0]._id, drivers: updatedDriver?._id } },
        { new: true, session },
      );
    } else {
      await Company.findByIdAndUpdate(
        payload?.companyId,
        { $addToSet: { loads: result[0]._id } },
        { new: true, session },
      );
    }

    await session.commitTransaction();
    session.endSession();

    console.log({ resulttt: result[0] });
    return result[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getAllLoad = async (query: Record<string, unknown>) => {
  const loadQuery = new QueryBuilder(LoadModel.find(), query)
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
  const result = await loadQuery.modelQuery
    .populate({
      path: 'assignedDriver',

      populate: { path: 'user', select: 'name email profileImage role' },
    })
    .populate({
      path: 'companyId',
      populate: { path: 'user', select: 'name email profileImage role' },
    });
  const meta = await loadQuery.getMetaData();
  return {
    result,
    meta,
  };
};

const getAllLoadsByDriver = async (
  driverId: string,
  query: Record<string, unknown>,
) => {
  if (!mongoose.Types.ObjectId.isValid(driverId)) {
    throw new ApppError(StatusCodes.BAD_REQUEST, 'Invalid driver ID');
  }
  const isDriverExist = await Driver.findOne({ user: driverId }).populate(
    'user',
  );
  console.log({ isDriverExist });
  const loadQuery = new QueryBuilder(
    LoadModel.find({
      loadStatus: 'Pending Assignment',
      _id: { $nin: isDriverExist?.declinedLoads || [] },
    }),
    query,
  );
  const result = await loadQuery.modelQuery.populate({
    path: 'companyId',
    populate: { path: 'user', select: 'name email profileImage role _id' },
  });
  const meta = await loadQuery.getMetaData();
  return {
    result,
    meta,
  };
  //
};

const getSingleLoad = async (id: string) => {
  const result = await LoadModel.findById(id)
    .populate({
      path: 'assignedDriver',

      populate: {
        path: 'user',
        select: 'name email profileImage role _id phone',
      },
    })
    .populate({
      path: 'companyId',
      populate: { path: 'user', select: 'name email profileImage role _id' },
    })
    .populate({ path: 'requestedDrivers', populate: 'user' });
  if (!result) {
    throw new ApppError(404, 'Load not found');
  }
  return result;
};

const updateLoadToDB = async (
  id: string,
  payload: Partial<ILoad>,
  files: Express.Multer.File[],
) => {
  const {
    pickupAddress,
    deliveryAddress,
    customer,

    ...loadData
  } = payload;

  const isLoadExist = (await LoadModel.findById(id).populate({
    path: 'assignedDriver',
    populate: { path: 'user' },
  })) as ILoad;
  if (!isLoadExist) {
    throw new ApppError(404, 'Load not found');
  }
  const newDistance = payload.totalDistance ?? isLoadExist.totalDistance;
  const newRate = payload.ratePerMile ?? isLoadExist.ratePerMile;
  const updatedLoad: Record<string, unknown> = { ...loadData };
  updatedLoad.totalPayment = newDistance * newRate;
  if (pickupAddress) {
    (Object.keys(pickupAddress) as (keyof IAddress)[]).forEach((key) => {
      updatedLoad[`pickupAddress.${key}`] = pickupAddress[key];
    });
  }
  if (deliveryAddress) {
    (Object.keys(deliveryAddress) as (keyof IAddress)[]).forEach((key) => {
      updatedLoad[`deliveryAddress.${key}`] = deliveryAddress[key];
    });
  }
  if (customer) {
    (Object.keys(customer) as (keyof {})[]).forEach((key) => {
      updatedLoad[`customer.${key}`] = customer[key];
    });
  }

  let documents: { type: string; url: string }[] = [];
  if (files.length > 0) {
    documents = files.map((file) => {
      return {
        type: file?.mimetype,
        url: `${config.server_url}/uploads/${file?.filename}`,
        createdAt: new Date(),
      };
    });
  }

  // console.log({ documents });

  const result = await LoadModel.findByIdAndUpdate(
    id,
    {
      $set: {
        ...updatedLoad,
      },
      $push: { documents },
    },
    { new: true },
  ).populate({ path: 'assignedDriver', populate: { path: 'user' } });
  if (isLoadExist?.assignedDriver) {
    console.log({ isLoadExist });
    await notificationService.sendNotification({
      content: `Load ${isLoadExist?.loadId} has been updated by dispatcher, please check again`,
      type: ENotificationType.LOAD_STATUS_UPDATE,
      receiverId: (result?.assignedDriver as any)?.user?.id,
      load: result?.id,
    });
  }

  return result;
};

const assignDriver = async (loadId: string, payload: { driverId: string }) => {
  if (!mongoose.Types.ObjectId.isValid(loadId)) {
    throw new ApppError(400, 'Invalid load ID');
  }
  const isLoadExist = await LoadModel.findById(loadId)
    .populate('companyId')
    .lean();
  console.log({ isLoadExist });
  if (!isLoadExist) {
    throw new ApppError(404, 'Load not found');
  }

  if (!mongoose.Types.ObjectId.isValid(payload?.driverId)) {
    throw new ApppError(400, 'Invalid driver ID');
  }
  const isDriverExist = await Driver.findById(payload?.driverId)
    .lean()
    .populate({ path: 'user', select: 'name email id' });
  if (!isDriverExist) {
    throw new ApppError(404, 'Driver not found');
  }
  if (
    isDriverExist?.loads &&
    isDriverExist.loads.length > 0 &&
    isDriverExist.loads.some((id: mongoose.Types.ObjectId) => id.equals(loadId))
  ) {
    throw new ApppError(400, 'This load is already assigned to this driver');
  }

  const statusTimeline = {
    status: 'Assigned',
    timestamp: new Date(),
    notes: `Load assigned to ${(isDriverExist?.user as any)?.name}`,
  };
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await LoadModel.findByIdAndUpdate(
      loadId,
      {
        assignedDriver: payload?.driverId,
        loadStatus: 'Assigned',
        $push: { statusTimeline },
      },
      { new: true, session },
    ).populate({
      path: 'assignedDriver',
      populate: { path: 'user', select: 'name email profileImage' },
    });
    await Driver.findByIdAndUpdate(
      payload?.driverId,
      {
        $set: { currentLoad: loadId, availability: 'On Duty' },
        $addToSet: { loads: loadId },
      },
      { session },
    ).populate('companyId');
    const sendNotification = await notificationService.sendNotification({
      receiverId: new mongoose.Types.ObjectId(isDriverExist?.user?._id),
      type: ENotificationType.LOAD_ASSIGNMENT,
      content: `New load assigned by : ${(isLoadExist?.companyId as any)?.companyName}`,
      load: isLoadExist,
    });
    await session.commitTransaction();
    session.endSession();
    return result;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const updateLoadStatus = async (loadId: string, payload: Partial<ILoad>) => {
  if (!mongoose.Types.ObjectId.isValid(loadId)) {
    throw new ApppError(StatusCodes.BAD_REQUEST, 'Invalid load ID');
  }
  if (!payload?.loadStatus && !payload?.paymentStatus) {
    throw new ApppError(
      StatusCodes.BAD_REQUEST,
      'Enter Load Status or Payment Status',
    );
  }

  const isLoadExist = await LoadModel.findById(loadId)
    .lean()
    .populate({
      path: 'assignedDriver',
      populate: { path: 'user', select: 'name' },
    });
  if (!isLoadExist) {
    throw new ApppError(StatusCodes.BAD_REQUEST, 'Load not found');
  }
  if (isLoadExist.loadStatus === payload?.loadStatus) {
    throw new ApppError(
      400,
      `Load is already in ${payload?.loadStatus} status`,
    );
  }

  if (payload?.paymentStatus === 'PAID') {
    payload.paymentDate = new Date();
  }
  if (payload?.loadStatus) {
    const statusTimeline: IStatusTimeline = {
      status: payload?.loadStatus,
      timestamp: new Date(),
      notes: getLoadNote(
        payload?.loadStatus,
        (isLoadExist.assignedDriver as any).name,
      ),
    };
    if (payload?.loadStatus === 'In Transit') {
      statusTimeline.expectedDeliveryDate = new Date(
        new Date().getTime() + 12 * 60 * 60 * 1000,
      );
    }
    const result = await LoadModel.findByIdAndUpdate(
      loadId,
      { ...payload, $push: { statusTimeline } },
      { new: true },
    );
    return result;
  }

  const result = await LoadModel.findByIdAndUpdate(
    loadId,
    { ...payload },
    { new: true },
  );
  return result;
};

const changedDriver = async (loadId: string, driverId: string) => {
  const isLoadExist = await LoadModel.findById(loadId).populate({
    path: 'assignedDriver',
  });
  if (!isLoadExist) {
    throw new ApppError(StatusCodes.BAD_REQUEST, 'Load not found');
  }
  const isDriverExist = await Driver.findById(driverId).populate('user');
  console.log({ driverId, isDriverExist });
  if (!isDriverExist) {
    throw new ApppError(StatusCodes.BAD_REQUEST, 'Driver not found');
  }
  if (isLoadExist?.assignedDriver) {
    await Driver.findByIdAndUpdate(isLoadExist?.assignedDriver?._id, {
      $set: { currentLoad: null, availability: 'Available' },
      $pull: { loads: loadId },
    });
  }

  const updatedLoad = await LoadModel.findByIdAndUpdate(
    loadId,
    { $set: { assignedDriver: isDriverExist._id, loadStatus: 'Assigned' } },
    { new: true },
  ).populate({ path: 'assignedDriver', populate: { path: 'user' } });
  await Driver.findByIdAndUpdate(driverId, {
    $set: { currentLoad: loadId, availability: 'On Duty' },
    $addToSet: { loads: loadId },
  });
  await notificationService.sendNotification({
    content: `Load ${isLoadExist?.loadId} has been assigned to you`,
    type: ENotificationType.LOAD_ASSIGNMENT,
    receiverId: (updatedLoad?.assignedDriver as any)?.user?.id,
    load: updatedLoad?.id,
  });
};
const cancelLoadByDriver = async (loadId: string) => {
  const isLoadExist = await LoadModel.findById(loadId).populate({
    path: 'assignedDriver',
    populate: { path: 'user' },
  });

  if (!isLoadExist) {
    throw new ApppError(StatusCodes.BAD_REQUEST, 'Load not found');
  }
  const statusTimeline: IStatusTimeline = {
    status: 'Cancelled',
    timestamp: new Date(),
    notes: getLoadNote('Cancelled'),
  };
  const updatedLoad = await LoadModel.findByIdAndUpdate(
    loadId,
    { $set: { loadStatus: 'Cancelled' }, $push: { statusTimeline } },
    { new: true },
  ).populate({ path: 'assignedDriver', populate: { path: 'user' } });
  const updatedDriver = await Driver.findByIdAndUpdate(
    isLoadExist?.assignedDriver?._id,
    { $set: { currentLoad: null, availability: 'Available' } },
    { new: true },
  );
  console.log({ updatedDriver });
  const isCompanyExist = await Company.findById(
    isLoadExist?.companyId,
  ).populate('user');

  // console.log({ loadId, updatedLoad });
  if (isLoadExist?.assignedDriver) {
    console.log('fsfggf');
    await notificationService.sendNotification({
      content: `Load ${isLoadExist?.loadId} has been cancelled`,
      type: ENotificationType.LOAD_STATUS_UPDATE,
      receiverId: (isCompanyExist?.user as any)?.id,
      load: updatedLoad?.id,
    });
  }
  return updatedLoad;
};

// Function to generate random load ID
async function generateLoadId(): Promise<string> {
  const numbers = Math.floor(100 + Math.random() * 900); // 3 random digits
  const letters = Array.from(
    { length: 2 },
    () => String.fromCharCode(65 + Math.floor(Math.random() * 26)), // 2 random uppercase letters
  ).join('');
  const moreNumbers = Math.floor(1000 + Math.random() * 9000); // 4 random digits

  return `#${numbers}${letters}${moreNumbers}`;
}

export const loadService = {
  createLoadToDB,
  getAllLoad,
  getSingleLoad,
  updateLoadToDB,
  assignDriver,
  generateLoadId,
  updateLoadStatus,
  changedDriver,
  cancelLoadByDriver,
  getAllLoadsByDriver,
};
