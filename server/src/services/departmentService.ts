import { Department } from "../models/Department";

export const getDepartments = async () => {
  return Department.find({
    isActive: true,
  }).sort({ name: 1 });
};

