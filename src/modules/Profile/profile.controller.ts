import { Request, Response } from 'express';

import { profileService } from './profile.service';
import { StatusCodes } from 'http-status-codes';

const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id; // assuming you attach user from auth middleware
    const { role } = req.user; // role also from user JWT/session
    const extra = req.body;

    if (!userId || !role) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: 'User or role missing' });
    }

    const roleDoc = await profileService.updateProfileIntoDb(
      userId,
      role,
      extra,
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Profile updated successfully',
      data: roleDoc,
    });
  } catch (error: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Something went wrong',
    });
  }
};

export const profileController = {
  updateProfile,
};
