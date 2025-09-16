import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import reformZodError from '../error/zoodError';
import mongoseErrorHandeller from '../error/mongooseErrorHandler';
import dublicateErrorHandellerr from '../error/duplicateError';
import { TErrorSource } from '../constents';
import ApppError from '../error/AppError';

const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // setting default value

  let statusCode = err.statusCode || 500;
  let message = err.message || 'something Went Wrong';
  let errorSource: TErrorSource = [
    {
      path: '',
      message: 'something went wrong',
    },
  ];

  if (err instanceof ZodError) {
    const handaleZoderror = reformZodError(err);
    statusCode = 400;
    message = handaleZoderror.message;
    errorSource = handaleZoderror.errorSource;
  } else if (err?.name === 'ValidationError') {
    const mongoseErrorHandellerr = mongoseErrorHandeller(err);
    statusCode = mongoseErrorHandellerr?.statusCode;
    errorSource = mongoseErrorHandellerr?.errorSource;
    message = mongoseErrorHandellerr.message;
  } else if (err?.errorResponse?.code === 11000) {
    const dublicateErrorHandeller = dublicateErrorHandellerr(err);
    statusCode = dublicateErrorHandeller.statuscode;
    message = dublicateErrorHandeller.message;
    errorSource = dublicateErrorHandeller.errorSource;
  } else if (err instanceof ApppError) {
    statusCode = err?.statusCode;
    message = err.message;
    errorSource = [
      {
        path: '',
        message: err?.message,
      },
    ];
  } else if (err instanceof Error) {
    statusCode = 500;
    message = err.message;
    errorSource = [
      {
        path: '',
        message: err?.message,
      },
    ];
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    errorSource,
    theError: err.stack,
    error: err,
    // stack: config.nodeEnv === 'development' ? err.stack : null,
  });
};

export default globalErrorHandler;
