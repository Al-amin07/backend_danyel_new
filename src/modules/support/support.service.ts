import { ISupport } from './support.interface';
import { Support } from './support.model';

const createSupport = async (payload: ISupport) => {
  const result = await Support.create(payload);
  return result;
};

const getSupports = async () => {
  const result = await Support.find({});
  return result;
};

const getSingleSupport = async (id: string) => {
  const result = await Support.findById(id);
  return result;
};

export const supportService = {
  createSupport,
  getSingleSupport,
  getSupports,
};
