import { Request } from 'express';
import geoip from 'geoip-lite';
import useragent from 'useragent';
import { LoginLog } from '../modules/auth/auth.model';
export const logLogin = async (
  success: boolean,
  userId: string,
  req: Request,
) => {
  try {
    const ip =
      req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
    const geo = geoip.lookup(ip as string);
    const location = geo ? `${geo.city}, ${geo.country}` : 'Unknown';

    const agent = useragent.parse(req.headers['user-agent'] || '');
    const device = agent.toString();

    await LoginLog.create({
      userId,
      ip,
      location,
      device,
      success,
    });
  } catch (err) {
    console.error('Login logging error:', err);
  }
};
