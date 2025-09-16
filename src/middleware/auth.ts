import { NextFunction, Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import authUtill from '../modules/auth/auth.utill';
import catchAsync from '../util/catchAsync';
import { TUserRole } from '../constents';
import { User } from '../modules/user/user.model';
import idConverter from '../util/idConvirter';
import ApppError from '../error/AppError';
import { StatusCodes } from 'http-status-codes';

const auth = (...requeredUserRole: TUserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const authorizationToken = req?.headers?.authorization;
    if (!authorizationToken) {
      throw new ApppError(
        StatusCodes.UNAUTHORIZED,
        'Unauthorized User: Missing Authorization Token',
      );
    }

    const decoded = authUtill.decodeAuthorizationToken(authorizationToken);

    if (!decoded) {
      throw new ApppError(
        StatusCodes.UNAUTHORIZED,
        'Unauthorized User: Invalid Authorization Token',
      );
    }

    const { id, role } = decoded as JwtPayload;

    // Check if the user's role is allowed
    if (requeredUserRole.length && !requeredUserRole.includes(role)) {
      throw new ApppError(
        StatusCodes.FORBIDDEN,
        'Unauthorized User: Role not permitted',
      );
    }

    // Find the user in the database
    const isUserExist = await User.findOne({
      _id: idConverter(id),
    });

    if (!isUserExist) {
      throw new ApppError(
        StatusCodes.NOT_FOUND,
        'Unauthorized User: Forbidden Access',
      );
    }

    if (isUserExist.isBlocked || isUserExist.isDeleted) {
      throw new ApppError(StatusCodes.FORBIDDEN, 'This user is blocked');
    }
    req.user = decoded as JwtPayload;
    next();
  });
};

export default auth;
