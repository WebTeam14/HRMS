import mongoose from "mongoose";
import { RelievingRequest, RelievingStatus } from "../models/RelievingRequest";
import { ClearanceChecklist, IClearanceItem } from "../models/ClearanceChecklist";
import { FnFSettlement, IFnFEarnings, IFnFDeductions } from "../models/FnFSettlement";
import { Employee } from "../models/Employee";
import { User } from "../models/User";
import { Department } from "../models/Department";

const STANDARD_CLEARANCE_ITEMS = [
  { departmentCode: "IT", item: "Laptop, Charger & Accessories Return" },
  { departmentCode: "IT", item: "Corporate Email & VPN Access Revocation" },
  { departmentCode: "ACCOUNTS", item: "Expense & Travel Reimbursement Audit" },
  { departmentCode: "ACCOUNTS", item: "Company Credit Card & Advance Dues Clearance" },
  { departmentCode: "ADMIN", item: "ID Badge & Biometric Access Revocation" },
  { departmentCode: "ADMIN", item: "Locker Key & Physical Facility Return" },
  { departmentCode: "HR", item: "Exit Interview & Feedback Documentation" },
  { departmentCode: "HR", item: "Knowledge Transfer (KT) Signoff from Manager" },
];

export const initiateRelieving = async (
  employeeId: string,
  input: {
    lastWorkingDay: string;
    reason: string;
    handoverNotes?: string;
    personalEmail?: string;
    contactPhone?: string;
  },
  userId?: string
) => {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new Error("INVALID_EMPLOYEE_ID");
  }

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new Error("EMPLOYEE_NOT_FOUND");
  }

  const existing = await RelievingRequest.findOne({
    employeeId,
    status: { $nin: ["RELIEVED"] },
  });

  if (existing) {
    throw new Error("ACTIVE_RELIEVING_REQUEST_EXISTS");
  }

  const request = await RelievingRequest.create({
    employeeId: new mongoose.Types.ObjectId(employeeId),
    resignationDate: new Date(),
    lastWorkingDay: new Date(input.lastWorkingDay),
    reason: input.reason,
    handoverNotes: input.handoverNotes,
    personalEmail: input.personalEmail,
    contactPhone: input.contactPhone,
    status: "INITIATED",
  });

  // Create clearance checklist
  const items: IClearanceItem[] = STANDARD_CLEARANCE_ITEMS.map((item) => ({
    departmentCode: item.departmentCode,
    item: item.item,
    status: "PENDING",
  }));

  await ClearanceChecklist.create({
    relievingId: request._id,
    employeeId: new mongoose.Types.ObjectId(employeeId),
    items,
    allCleared: false,
  });

  // Update employee status to NOTICE_PERIOD
  await Employee.findByIdAndUpdate(employeeId, { status: "NOTICE_PERIOD" });

  return getRelievingById(request._id.toString());
};

export const getRelievingById = async (relievingId: string) => {
  if (!mongoose.Types.ObjectId.isValid(relievingId)) {
    throw new Error("INVALID_RELIEVING_ID");
  }

  const request = await RelievingRequest.findById(relievingId)
    .populate({
      path: "employeeId",
      select: "firstName lastName employeeCode designation phone workLocation joiningDate monthlySalary departmentId userId status",
      populate: [
        { path: "departmentId", select: "name code" },
        { path: "userId", select: "email role isActive" },
      ],
    })
    .populate("approvedBy", "email");

  if (!request) {
    throw new Error("RELIEVING_NOT_FOUND");
  }

  const clearance = await ClearanceChecklist.findOne({ relievingId })
    .populate("items.clearedBy", "email");

  const settlement = await FnFSettlement.findOne({ relievingId })
    .populate("settledBy", "email");

  return {
    request,
    clearance,
    settlement,
  };
};

export const getRelievingByEmployeeId = async (employeeId: string) => {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new Error("INVALID_EMPLOYEE_ID");
  }

  const request = await RelievingRequest.findOne({ employeeId })
    .sort({ createdAt: -1 });

  if (!request) {
    return null;
  }

  return getRelievingById(request._id.toString());
};

export const listRelievingRequests = async (query: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const { status, search, page = 1, limit = 10 } = query;
  const filter: any = {};

  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;

  if (search && search.trim()) {
    const s = search.trim();
    const emps = await Employee.find({
      $or: [
        { firstName: { $regex: s, $options: "i" } },
        { lastName: { $regex: s, $options: "i" } },
        { employeeCode: { $regex: s, $options: "i" } },
      ],
    }).select("_id");
    filter.employeeId = { $in: emps.map((e) => e._id) };
  }

  const [requests, total] = await Promise.all([
    RelievingRequest.find(filter)
      .populate({
        path: "employeeId",
        select: "firstName lastName employeeCode designation departmentId joiningDate status",
        populate: { path: "departmentId", select: "name code" },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    RelievingRequest.countDocuments(filter),
  ]);

  return {
    data: requests,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const approveRelieving = async (
  relievingId: string,
  approvalRemarks: string | undefined,
  userId: string
) => {
  const request = await RelievingRequest.findById(relievingId);
  if (!request) {
    throw new Error("RELIEVING_NOT_FOUND");
  }

  // Strict state machine: INITIATED -> APPROVED / CLEARANCE_PENDING
  if (request.status !== "INITIATED") {
    throw new Error(`INVALID_STATE_TRANSITION: Cannot approve a request in status '${request.status}'`);
  }

  request.status = "CLEARANCE_PENDING";
  request.approvedBy = new mongoose.Types.ObjectId(userId);
  request.approvedAt = new Date();
  request.approvalRemarks = approvalRemarks;
  await request.save();

  return getRelievingById(relievingId);
};

export const updateClearanceItemStatus = async (
  relievingId: string,
  itemId: string,
  status: "PENDING" | "CLEARED" | "FLAGGED",
  remarks: string | undefined,
  user: { userId: string; role: string }
) => {
  const clearance = await ClearanceChecklist.findOne({ relievingId });
  if (!clearance) {
    throw new Error("CLEARANCE_NOT_FOUND");
  }

  const item = clearance.items.find((i) => i._id?.toString() === itemId);
  if (!item) {
    throw new Error("CLEARANCE_ITEM_NOT_FOUND");
  }

  // Department authorization check:
  // Non-admin/HR users can only clear their respective department items
  const isGlobalManager = ["HR", "ADMIN", "CEO"].includes(user.role);
  if (!isGlobalManager) {
    const employee = await Employee.findOne({ userId: user.userId }).populate("departmentId");
    const deptCode = (employee?.departmentId as any)?.code || "";
    if (deptCode.toUpperCase() !== item.departmentCode.toUpperCase()) {
      throw new Error(`UNAUTHORIZED_DEPARTMENT: You can only clear '${deptCode}' items, not '${item.departmentCode}'`);
    }
  }

  item.status = status;
  item.remarks = remarks;
  if (status === "CLEARED") {
    item.clearedBy = new mongoose.Types.ObjectId(user.userId);
    item.clearedAt = new Date();
  } else {
    item.clearedBy = undefined;
    item.clearedAt = undefined;
  }

  clearance.allCleared = clearance.items.every((i) => i.status === "CLEARED");
  await clearance.save();

  return getRelievingById(relievingId);
};

export const createOrUpdateFnFSettlement = async (
  relievingId: string,
  input: {
    earnings: IFnFEarnings;
    deductions: IFnFDeductions;
    remarks?: string;
  },
  userId: string
) => {
  const request = await RelievingRequest.findById(relievingId);
  if (!request) {
    throw new Error("RELIEVING_NOT_FOUND");
  }

  // Must be in CLEARANCE_PENDING or SETTLED
  if (!["APPROVED", "CLEARANCE_PENDING", "SETTLED"].includes(request.status)) {
    throw new Error(`INVALID_STATE_TRANSITION: Cannot settle request in status '${request.status}'`);
  }

  const e = input.earnings;
  const totalEarnings =
    (e.basic || 0) +
    (e.hra || 0) +
    (e.leaveEncashment || 0) +
    (e.bonus || 0) +
    (e.gratuity || 0) +
    (e.otherEarnings || 0);

  const d = input.deductions;
  const totalDeductions =
    (d.noticePayDeduction || 0) +
    (d.assetDamage || 0) +
    (d.pfDeduction || 0) +
    (d.taxDeduction || 0) +
    (d.otherDeductions || 0);

  const netPayable = Math.max(0, totalEarnings - totalDeductions);

  let settlement = await FnFSettlement.findOne({ relievingId });
  if (settlement) {
    settlement.earnings = { ...e, totalEarnings };
    settlement.deductions = { ...d, totalDeductions };
    settlement.netPayable = netPayable;
    settlement.remarks = input.remarks;
    settlement.settledBy = new mongoose.Types.ObjectId(userId);
    settlement.settledAt = new Date();
    settlement.status = "SETTLED";
    await settlement.save();
  } else {
    settlement = await FnFSettlement.create({
      relievingId: request._id,
      employeeId: request.employeeId,
      earnings: { ...e, totalEarnings },
      deductions: { ...d, totalDeductions },
      netPayable,
      remarks: input.remarks,
      settledBy: new mongoose.Types.ObjectId(userId),
      settledAt: new Date(),
      status: "SETTLED",
    });
  }

  // Transition request status to SETTLED
  request.status = "SETTLED";
  await request.save();

  return getRelievingById(relievingId);
};

export const finalizeRelief = async (relievingId: string, userId: string) => {
  const request = await RelievingRequest.findById(relievingId);
  if (!request) {
    throw new Error("RELIEVING_NOT_FOUND");
  }

  if (request.status !== "SETTLED") {
    throw new Error("CANNOT_RELIEVE_UNSETTLED: Full & Final settlement must be completed before relief");
  }

  request.status = "RELIEVED";
  request.relievedAt = new Date();
  await request.save();

  // Deactivate employee & platform user login access
  await Employee.findByIdAndUpdate(request.employeeId, { status: "INACTIVE" });
  const employee = await Employee.findById(request.employeeId);
  if (employee && employee.userId) {
    await User.findByIdAndUpdate(employee.userId, { isActive: false });
  }

  return getRelievingById(relievingId);
};

export const generateRelievingLetterData = async (relievingId: string) => {
  const details = await getRelievingById(relievingId);
  const employee = details.request.employeeId as any;

  return {
    referenceNumber: `TETPL/REL/${new Date().getFullYear()}/${employee.employeeCode}`,
    issueDate: new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    employeeName: `${employee.firstName} ${employee.lastName || ""}`.trim(),
    employeeCode: employee.employeeCode,
    designation: employee.designation || "Employee",
    department: employee.departmentId?.name || "Operations",
    joiningDate: new Date(employee.joiningDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    relievingDate: new Date(details.request.lastWorkingDay).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    companyName: "Technoriya eTechnologies Pvt Ltd",
    authorizedSignatory: "Head of Human Resources",
  };
};
