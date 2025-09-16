import { NextFunction, Request, Response, RequestHandler } from "express";
import { AnyZodObject } from "zod";

const validator = (validationSchema: AnyZodObject): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            validationSchema.parse({ body: req.body });
            next(); // Proceed if validation passes
        } catch (error: any) {
            // Pass validation errors to the global error handler
            next(error);
        }
    };
};

export default validator;
