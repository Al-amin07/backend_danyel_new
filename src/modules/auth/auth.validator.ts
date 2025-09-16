import { z } from 'zod';

export const logInValidator = z.object({
  body: z.object({
    email: z.string().email({ message: 'Valid email is required' }),
    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters' }),
  }),
});
