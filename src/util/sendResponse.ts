import { Response } from 'express';

const sendResponse = <T>(
  res: Response,
  data: {
    statusCode: number;
    success: boolean;
    message?: string;
    data: T;
    meta?: {
      page: number;
      limit: number;
      total: number;
      totalPage: number;
    };
  },
) => {
  res.status(data.statusCode).json({
    statusCode: data.statusCode,
    success: data.success,
    message: data.message,
    data: data.data,
    meta: data.meta,
  });
};

export default sendResponse;
