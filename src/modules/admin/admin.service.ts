import { Company } from '../Company/company.model';
import { Driver } from '../Driver/driver.model';
import { LoadModel } from '../load/load.model';
import { User } from '../user/user.model';

const getAdminState = async () => {
  const totalDriver = await Driver.countDocuments();
  const totalCompany = await Company.countDocuments();
  const totalLoad = await LoadModel.countDocuments();
  const activeLoad = await LoadModel.countDocuments({
    loadStatus: { $nin: ['Delivered', 'Cancelled'] },
  });
  const pendingLoad = await LoadModel.countDocuments({
    loadStatus: 'Pending Assignment',
  });
  const cancelledLoad = await LoadModel.countDocuments({
    loadStatus: 'Cancelled',
  });
  const deliveredLoad = await LoadModel.countDocuments({
    loadStatus: 'Delivered',
  });
  const totalAmount = await LoadModel.aggregate([
    { $match: { loadStatus: 'Delivered' } },
    { $group: { _id: null, total: { $sum: '$totalPayment' } } },
  ]);
  const loads = await LoadModel.find({})
    .limit(3)
    .populate('assignedDriver')
    .lean();
  const users = await User.find().limit(3).lean();
  return {
    totalDriver,
    totalCompany,
    totalLoad,
    activeLoad,
    pendingLoad,
    cancelledLoad,
    deliveredLoad,
    totalEarnings: totalAmount[0]?.total || 0,
    loads,
    users,
  };
};

export const adminService = {
  getAdminState,
};
