import mongoose from "mongoose";
import { OnboardingChecklist, IOnboardingChecklist, OnboardingStatus } from "../models/OnboardingChecklist";
import { OnboardingDocument, DocumentType, DocumentVerificationStatus } from "../models/OnboardingDocument";
import { Employee } from "../models/Employee";
import { User } from "../models/User";

const DEFAULT_ONBOARDING_TASKS = [
  { title: "Verify Government ID & Address Proof", assigneeRole: "HR" },
  { title: "Educational & Prior Experience Verification", assigneeRole: "HR" },
  { title: "IT Asset Provisioning & Corporate Email Setup", assigneeRole: "IT" },
  { title: "Bank Account & Compensation Structure Setup", assigneeRole: "ACCOUNTS" },
  { title: "Company Policies & Code of Conduct Sign-off", assigneeRole: "HR" },
  { title: "Team Introduction & Project Orientation", assigneeRole: "MANAGER" },
];

export const initiateOnboarding = async (
  employeeId: string,
  data: { notes?: string; templateTasks?: Array<{ title: string; assigneeRole?: string; departmentId?: string; dueDate?: string }> },
  initiatedByUserId?: string
) => {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new Error("INVALID_EMPLOYEE_ID");
  }

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new Error("EMPLOYEE_NOT_FOUND");
  }

  const existing = await OnboardingChecklist.findOne({ employeeId });
  if (existing) {
    throw new Error("ONBOARDING_ALREADY_INITIATED");
  }

  const tasks = (data.templateTasks && data.templateTasks.length > 0)
    ? data.templateTasks.map((t) => ({
        title: t.title,
        assigneeRole: t.assigneeRole || "HR",
        departmentId: t.departmentId ? new mongoose.Types.ObjectId(t.departmentId) : undefined,
        status: "PENDING" as const,
        dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
      }))
    : DEFAULT_ONBOARDING_TASKS.map((t) => ({
        title: t.title,
        assigneeRole: t.assigneeRole,
        departmentId: employee.departmentId,
        status: "PENDING" as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      }));

  const checklist = await OnboardingChecklist.create({
    employeeId: new mongoose.Types.ObjectId(employeeId),
    status: "INVITED",
    tasks,
    notes: data.notes,
  });

  return getOnboardingByEmployeeId(employeeId);
};

export const getOnboardingByEmployeeId = async (employeeId: string) => {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new Error("INVALID_EMPLOYEE_ID");
  }

  const checklist = await OnboardingChecklist.findOne({ employeeId })
    .populate({
      path: "employeeId",
      select: "firstName lastName employeeCode designation phone workLocation joiningDate departmentId userId status",
      populate: [
        { path: "departmentId", select: "name code" },
        { path: "userId", select: "email role isActive" },
      ],
    })
    .populate("tasks.departmentId", "name code")
    .populate("tasks.completedBy", "email");

  if (!checklist) {
    throw new Error("ONBOARDING_NOT_FOUND");
  }

  const documents = await OnboardingDocument.find({ employeeId })
    .populate("verifiedBy", "email")
    .sort({ createdAt: -1 });

  return {
    checklist,
    documents,
  };
};

export const listOnboardings = async (query: {
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

  let employeeIdsMatchingSearch: mongoose.Types.ObjectId[] | null = null;
  if (search && search.trim()) {
    const s = search.trim();
    const emps = await Employee.find({
      $or: [
        { firstName: { $regex: s, $options: "i" } },
        { lastName: { $regex: s, $options: "i" } },
        { employeeCode: { $regex: s, $options: "i" } },
        { designation: { $regex: s, $options: "i" } },
      ],
    }).select("_id");
    employeeIdsMatchingSearch = emps.map((e) => e._id as mongoose.Types.ObjectId);
    filter.employeeId = { $in: employeeIdsMatchingSearch };
  }

  const [items, total] = await Promise.all([
    OnboardingChecklist.find(filter)
      .populate({
        path: "employeeId",
        select: "firstName lastName employeeCode designation departmentId joiningDate status",
        populate: { path: "departmentId", select: "name code" },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    OnboardingChecklist.countDocuments(filter),
  ]);

  return {
    data: items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const updateOnboardingTaskStatus = async (
  employeeId: string,
  taskId: string,
  status: "PENDING" | "COMPLETED",
  userId: string
) => {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new Error("INVALID_EMPLOYEE_ID");
  }

  const checklist = await OnboardingChecklist.findOne({ employeeId });
  if (!checklist) {
    throw new Error("ONBOARDING_NOT_FOUND");
  }

  const task = checklist.tasks.find((t) => t._id?.toString() === taskId);
  if (!task) {
    throw new Error("TASK_NOT_FOUND");
  }

  task.status = status;
  if (status === "COMPLETED") {
    task.completedAt = new Date();
    task.completedBy = new mongoose.Types.ObjectId(userId);
  } else {
    task.completedAt = undefined;
    task.completedBy = undefined;
  }

  // If currently INVITED and tasks are being completed, transition to DOCS_PENDING
  if (checklist.status === "INVITED") {
    checklist.status = "DOCS_PENDING";
  }

  await checklist.save();
  await checkAndAdvanceOnboarding(checklist);

  return getOnboardingByEmployeeId(employeeId);
};

export const uploadOnboardingDocument = async (
  employeeId: string,
  input: {
    title: string;
    type: DocumentType;
    fileUrl: string;
    fileName?: string;
    fileSize?: number;
  }
) => {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new Error("INVALID_EMPLOYEE_ID");
  }

  const checklist = await OnboardingChecklist.findOne({ employeeId });
  if (!checklist) {
    throw new Error("ONBOARDING_NOT_FOUND");
  }

  const doc = await OnboardingDocument.create({
    employeeId: new mongoose.Types.ObjectId(employeeId),
    onboardingId: checklist._id,
    title: input.title,
    type: input.type,
    fileUrl: input.fileUrl,
    fileName: input.fileName,
    fileSize: input.fileSize,
    verificationStatus: "PENDING",
  });

  // Advance from INVITED to DOCS_PENDING if needed
  if (checklist.status === "INVITED") {
    checklist.status = "DOCS_PENDING";
    await checklist.save();
  }

  return doc;
};

export const verifyOnboardingDocument = async (
  docId: string,
  verificationStatus: "VERIFIED" | "REJECTED",
  rejectionReason: string | undefined,
  userId: string
) => {
  if (!mongoose.Types.ObjectId.isValid(docId)) {
    throw new Error("INVALID_DOCUMENT_ID");
  }

  const doc = await OnboardingDocument.findById(docId);
  if (!doc) {
    throw new Error("DOCUMENT_NOT_FOUND");
  }

  doc.verificationStatus = verificationStatus;
  doc.rejectionReason = verificationStatus === "REJECTED" ? rejectionReason : undefined;
  doc.verifiedBy = new mongoose.Types.ObjectId(userId);
  doc.verifiedAt = new Date();
  await doc.save();

  if (doc.onboardingId) {
    const checklist = await OnboardingChecklist.findById(doc.onboardingId);
    if (checklist) {
      await checkAndAdvanceOnboarding(checklist);
    }
  }

  return doc;
};

/**
 * Validates and advances state machine:
 * INVITED -> DOCS_PENDING -> VERIFIED -> ACTIVE
 */
export const checkAndAdvanceOnboarding = async (checklist: IOnboardingChecklist) => {
  const docs = await OnboardingDocument.find({ onboardingId: checklist._id });

  const allTasksDone = checklist.tasks.length > 0 && checklist.tasks.every((t) => t.status === "COMPLETED");
  const hasDocuments = docs.length > 0;
  const allDocsVerified = hasDocuments && docs.every((d) => d.verificationStatus === "VERIFIED");
  const anyDocsRejected = docs.some((d) => d.verificationStatus === "REJECTED");

  if (checklist.status === "INVITED" && (hasDocuments || checklist.tasks.some((t) => t.status === "COMPLETED"))) {
    checklist.status = "DOCS_PENDING";
  }

  if (checklist.status === "DOCS_PENDING" && allDocsVerified && !anyDocsRejected) {
    checklist.status = "VERIFIED";
  }

  if ((checklist.status === "VERIFIED" || checklist.status === "DOCS_PENDING") && allTasksDone && allDocsVerified) {
    checklist.status = "ACTIVE";
    checklist.activatedAt = new Date();

    // Auto-activate employee and user account
    await Employee.findByIdAndUpdate(checklist.employeeId, { status: "ACTIVE" });
    const emp = await Employee.findById(checklist.employeeId);
    if (emp && emp.userId) {
      await User.findByIdAndUpdate(emp.userId, { isActive: true });
    }
  }

  await checklist.save();
};
