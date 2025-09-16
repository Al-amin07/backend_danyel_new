export type TUserRole = 'admin' | 'company' | 'driver' | 'super-admin';

export const userRole = {
  admin: 'admin',
  company: 'company',
  driver: 'driver',
  superAdmin: 'super-admin',
} as const;

export type TErrorSource = {
  path: string | number;
  message: string;
}[];
