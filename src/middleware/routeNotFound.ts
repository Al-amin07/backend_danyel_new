import { Request, Response } from "express";

const routeNotFound = (req: Request, res: Response) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404).json({
    status: "fail",
    message: error.message,
  });
};

export default routeNotFound;
