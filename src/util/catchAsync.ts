// import { NextFunction, Request, RequestHandler, Response } from 'express';

// const catchAsync = (fn: RequestHandler) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     Promise.resolve(fn(req, res, next)).catch((err) => {
//       next(err);
//     });
//   };
// };

// export default catchAsync;

import { Request, Response, NextFunction } from "express";

const catchAsync = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

export default catchAsync;
