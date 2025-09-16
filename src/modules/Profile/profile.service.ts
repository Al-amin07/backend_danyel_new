import { ICompany } from '../Company/company.interface';
import { Company } from '../Company/company.model';
import { IDriver } from '../Driver/driver.interface';
import { Driver } from '../Driver/driver.model';
import { User } from '../user/user.model';

const updateProfileIntoDb = async (
  userId: string,
  role: string,
  extra: ICompany | IDriver,
) => {
  let roleDoc;

  if (role === 'company') {
    roleDoc = await Company.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          companyName: (extra as ICompany).companyName,
          companyAddress: (extra as ICompany).companyAddress,
        },
      },
      { upsert: true, new: true },
    );
  }

  if (role === 'driver') {
    roleDoc = await Driver.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          licenseNumber: (extra as IDriver).licenseNumber,
          vehicleType: (extra as IDriver).vehicleType,
          vehiclePlate: (extra as IDriver).vehicleModel,
          company: (extra as IDriver).companyId,
        },
      },
      { upsert: true, new: true },
    );
  }

  // if (role === "admin") {
  //     roleDoc = await Admin.findOneAndUpdate(
  //         { user: userId },
  //         {
  //             $set: {
  //                 superAdmin: (extra as TAdminExtra).superAdmin ?? false,
  //             },
  //         },
  //         { upsert: true, new: true }
  //     );
  // }

  // Mark profile as updated in User collection
  await User.findByIdAndUpdate(userId, { isProfileUpdate: true });

  return roleDoc;
};

export const profileService = {
  updateProfileIntoDb,
};
