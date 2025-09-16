import mongoose from "mongoose";

export const idConverter = (id: string) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    console.error("Invalid ObjectId:", id); // Debugging log
    return null; // Return `null` instead of throwing an error
  }

  return new mongoose.Types.ObjectId(id);
};

export default idConverter;