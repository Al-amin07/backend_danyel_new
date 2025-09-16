import { ZodError, ZodIssue } from 'zod';

const reformZodError = (err: ZodError) => {
  const errorSource = err.issues.map((issue: ZodIssue) => {
    return {
      path: issue.path[issue.path.length - 1],
      message: issue.message,
    };
  });
  const errorMessage = errorSource.map((err) => `${err.path}`).join(', ');
  return {
    message: `Validation Error : ${errorMessage} is required`,
    errorSource,
  };
};

export default reformZodError;
