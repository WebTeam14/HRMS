import { LeaveType, ILeaveType } from "../models/LeaveType";

const DEFAULT_LEAVE_TYPES = [
  {
    name: "Casual Leave",
    code: "CASUAL",
    description: "Short leaves for personal or urgent matters",
    defaultDays: 12,
    isPaid: true,
    requiresApproval: true,
    isActive: true,
  },
  {
    name: "Sick Leave",
    code: "SICK",
    description: "Leave taken due to illness or medical treatment",
    defaultDays: 10,
    isPaid: true,
    requiresApproval: true,
    isActive: true,
  },
  {
    name: "Annual Leave",
    code: "ANNUAL",
    description: "Earned annual vacation leave",
    defaultDays: 18,
    isPaid: true,
    requiresApproval: true,
    isActive: true,
  },
  {
    name: "Unpaid Leave",
    code: "UNPAID",
    description: "Leave without pay for extended absence",
    defaultDays: 0,
    isPaid: false,
    requiresApproval: true,
    isActive: true,
  },
  {
    name: "Maternity Leave",
    code: "MATERNITY",
    description: "Leave for female employees during child birth",
    defaultDays: 180,
    isPaid: true,
    requiresApproval: true,
    isActive: true,
  },
  {
    name: "Paternity Leave",
    code: "PATERNITY",
    description: "Leave for male employees during child birth",
    defaultDays: 15,
    isPaid: true,
    requiresApproval: true,
    isActive: true,
  },
];

export const getLeaveTypes = async (onlyActive: boolean = false): Promise<ILeaveType[]> => {
  // If no leave types exist at all, seed defaults automatically
  const count = await LeaveType.countDocuments();
  if (count === 0) {
    try {
      await LeaveType.insertMany(DEFAULT_LEAVE_TYPES);
    } catch (e) {
      // If concurrent insert occurs, ignore
    }
  }

  const filter = onlyActive ? { isActive: true } : {};
  return LeaveType.find(filter).sort({ name: 1 });
};

export const getLeaveTypeById = async (id: string): Promise<ILeaveType | null> => {
  return LeaveType.findById(id);
};

export const createLeaveType = async (data: {
  name: string;
  code: string;
  description?: string;
  defaultDays: number;
  isPaid?: boolean;
  requiresApproval?: boolean;
  isActive?: boolean;
}): Promise<ILeaveType> => {
  const existingName = await LeaveType.findOne({
    name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") },
  });
  if (existingName) {
    throw new Error("A leave type with this name already exists");
  }

  const existingCode = await LeaveType.findOne({
    code: data.code.trim().toUpperCase(),
  });
  if (existingCode) {
    throw new Error("A leave type with this code already exists");
  }

  const leaveType = new LeaveType({
    ...data,
    name: data.name.trim(),
    code: data.code.trim().toUpperCase(),
  });

  return leaveType.save();
};

export const updateLeaveType = async (
  id: string,
  data: {
    name?: string;
    code?: string;
    description?: string;
    defaultDays?: number;
    isPaid?: boolean;
    requiresApproval?: boolean;
    isActive?: boolean;
  }
): Promise<ILeaveType | null> => {
  const leaveType = await LeaveType.findById(id);
  if (!leaveType) {
    return null;
  }

  if (data.name && data.name.trim().toLowerCase() !== leaveType.name.toLowerCase()) {
    const existing = await LeaveType.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") },
    });
    if (existing) {
      throw new Error("A leave type with this name already exists");
    }
  }

  if (data.code && data.code.trim().toUpperCase() !== leaveType.code) {
    const existing = await LeaveType.findOne({
      _id: { $ne: id },
      code: data.code.trim().toUpperCase(),
    });
    if (existing) {
      throw new Error("A leave type with this code already exists");
    }
  }

  if (data.name !== undefined) leaveType.name = data.name.trim();
  if (data.code !== undefined) leaveType.code = data.code.trim().toUpperCase();
  if (data.description !== undefined) leaveType.description = data.description.trim();
  if (data.defaultDays !== undefined) leaveType.defaultDays = data.defaultDays;
  if (data.isPaid !== undefined) leaveType.isPaid = data.isPaid;
  if (data.requiresApproval !== undefined) leaveType.requiresApproval = data.requiresApproval;
  if (data.isActive !== undefined) leaveType.isActive = data.isActive;

  return leaveType.save();
};

export const updateLeaveTypeStatus = async (
  id: string,
  isActive: boolean
): Promise<ILeaveType | null> => {
  return LeaveType.findByIdAndUpdate(
    id,
    { $set: { isActive } },
    { new: true }
  );
};
