import jwt, { Secret } from 'jsonwebtoken';
import config from '../../config';

const createToken = (
  tokenizeData: Record<string, any>,
  tokenSecret: string,
  expiresIn: any,
): string => {
  if (!tokenSecret) {
    throw new Error('Token secret is missing.');
  }

  return jwt.sign(tokenizeData, tokenSecret, { expiresIn });
};

const decodeToken = (token: string, secret: Secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null; // Handle invalid token gracefully
  }
};

const decodeAuthorizationToken = (token: string) =>
  decodeToken(token, config.jwt_token_secret);
const decodeRefreshToken = (token: string) =>
  decodeToken(token, config.jwt_refresh_Token_secret);

const authUtil = {
  createToken,
  decodeAuthorizationToken,
  decodeRefreshToken,
};

export default authUtil;
