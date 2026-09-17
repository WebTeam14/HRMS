import "../config/env";

import bcrypt from "bcryptjs";
import { connectDatabase } from "../config/database";
import { User } from "../models/User";
import { Department } from "../models/Department";
import { Designation } from "../models/Designation";
import { Employee } from "../models/Employee";
import { Attendance } from "../models/Attendance";
import { LeaveType } from "../models/LeaveType";
import { LeaveBalance } from "../models/LeaveBalance";
import { LeaveRequest } from "../models/LeaveRequest";
import { WorkUpdate } from "../models/WorkUpdate";
import { HelpdeskTicket } from "../models/HelpdeskTicket";
import { Holiday } from "../models/Holiday";
import { seedSamplePayslipsIfEmpty } from "../services/payrollService";
import { seedDefaultHolidaysIfEmpty } from "../services/holidayService";
import { ROLES } from "./roles";

const seed = async () => {
  try {
    await connectDatabase();

    console.log("Clearing existing database collections for clean seed...");

    await HelpdeskTicket.deleteMany({});
    await WorkUpdate.deleteMany({});
    await LeaveRequest.deleteMany({});
    await LeaveBalance.deleteMany({});
    await LeaveType.deleteMany({});
    await Attendance.deleteMany({});
    await Employee.deleteMany({});
    await Designation.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});
    await Holiday.deleteMany({});

    // Individual password hashes per user
    const ceoPwdHash      = await bcrypt.hash("Ganesh@Techno", 12);
    const hrPwdHash       = await bcrypt.hash("Laxmi@TETPL", 12);
    const managerPwdHash  = await bcrypt.hash("Mitali@123", 12);
    const accountsPwdHash = await bcrypt.hash("Neha@TETPL", 12);
    const employeePwdHash = await bcrypt.hash("Shubhasmita@TETPL", 12);

    // 1. Create Users
    // CEO also acts as Admin (same email/password)
    const ceoUser = await User.create({
      email: "neeraj@technoriya.com",
      passwordHash: ceoPwdHash,
      role: ROLES.CEO,
    });

    const hrUser = await User.create({
      email: "hr@technoriya.com",
      passwordHash: hrPwdHash,
      role: ROLES.HR,
    });

    const managerUser = await User.create({
      email: "webadmin@technoriya.com",
      passwordHash: managerPwdHash,
      role: ROLES.MANAGER,
    });

    const accountsUser = await User.create({
      email: "accounts@technoriya.com",
      passwordHash: accountsPwdHash,
      role: ROLES.ACCOUNTS,
    });

    // Admin shares same account as CEO (neeraj@technoriya.com)
    const adminUser = ceoUser;

    const employeeUser = await User.create({
      email: "web.technoriya@gmail.com",
      passwordHash: employeePwdHash,
      role: ROLES.EMPLOYEE,
    });

    // 2. Create Departments
    const itDepartment = await Department.create({
      name: "Information Technology",
      code: "IT",
      description: "Software engineering, cloud infrastructure, and technical operations",
    });

    const hrDepartment = await Department.create({
      name: "Human Resources",
      code: "HR",
      description: "Talent acquisition, employee engagement, payroll, and company culture",
    });

    const accountsDepartment = await Department.create({
      name: "Accounts & Finance",
      code: "ACCOUNTS",
      description: "Corporate financial management, bookkeeping, budgeting, and tax compliance",
    });

    const adminDepartment = await Department.create({
      name: "Administration",
      code: "ADMIN",
      description: "Facility operations, executive governance, and general corporate administration",
    });

    const operationsDepartment = await Department.create({
      name: "Operations",
      code: "OPERATIONS",
      description: "Day-to-day service delivery, resource logistics, and operational workflows",
    });

    // 3. Create Designations
    await Designation.create({
      name: "Chief Executive Officer",
      code: "CEO",
      departmentId: adminDepartment._id,
      description: "Executive strategic leadership and organizational vision",
    });

    await Designation.create({
      name: "HR Manager",
      code: "HRM",
      departmentId: hrDepartment._id,
      description: "Human resources leadership and management",
    });

    await Designation.create({
      name: "IT Manager",
      code: "ITM",
      departmentId: itDepartment._id,
      description: "Engineering team leadership and software delivery",
    });

    await Designation.create({
      name: "Accounts Manager",
      code: "ACTM",
      departmentId: accountsDepartment._id,
      description: "Financial management, audits, and compensation oversight",
    });

    await Designation.create({
      name: "Admin Officer",
      code: "ADMO",
      departmentId: adminDepartment._id,
      description: "Administration and workplace management",
    });

    await Designation.create({
      name: "Senior Software Developer",
      code: "SDE",
      departmentId: itDepartment._id,
      description: "Full stack web application development and system architecture",
    });

    // 4. Create Employees
    const ceoEmployee = await Employee.create({
      userId: ceoUser._id,
      employeeCode: "EMP-1001",
      firstName: "Rajesh",
      lastName: "Mehta",
      phone: "+91 98765 43210",
      departmentId: adminDepartment._id,
      designation: "Chief Executive Officer",
      joiningDate: new Date("2020-01-01"),
      employmentType: "FULL_TIME",
      status: "ACTIVE",
      workLocation: "Headquarters (Mumbai)",
    });

    const hrEmployee = await Employee.create({
      userId: hrUser._id,
      employeeCode: "EMP-1002",
      firstName: "Pooja",
      lastName: "Sharma",
      phone: "+91 98234 56789",
      departmentId: hrDepartment._id,
      managerId: ceoEmployee._id,
      designation: "HR Manager",
      joiningDate: new Date("2021-01-01"),
      employmentType: "FULL_TIME",
      status: "ACTIVE",
      workLocation: "Headquarters (Mumbai)",
    });

    const managerEmployee = await Employee.create({
      userId: managerUser._id,
      employeeCode: "EMP-1003",
      firstName: "Vikram",
      lastName: "Patel",
      phone: "+91 98345 67890",
      departmentId: itDepartment._id,
      managerId: ceoEmployee._id,
      designation: "IT Manager",
      joiningDate: new Date("2021-06-01"),
      employmentType: "FULL_TIME",
      status: "ACTIVE",
      workLocation: "Tech Park (Bengaluru)",
    });

    const accountsEmployee = await Employee.create({
      userId: accountsUser._id,
      employeeCode: "EMP-1004",
      firstName: "Suresh",
      lastName: "Iyer",
      phone: "+91 98456 78901",
      departmentId: accountsDepartment._id,
      managerId: ceoEmployee._id,
      designation: "Accounts Manager",
      joiningDate: new Date("2022-01-01"),
      employmentType: "FULL_TIME",
      status: "ACTIVE",
      workLocation: "Headquarters (Mumbai)",
    });

    // Admin is same as CEO (Neeraj) — no separate employee record needed
    const adminEmployee = ceoEmployee;


    const developerEmployee = await Employee.create({
      userId: employeeUser._id,
      employeeCode: "EMP-1005",
      firstName: "Rahul",
      lastName: "Verma",
      phone: "+91 98678 90123",
      departmentId: itDepartment._id,
      managerId: managerEmployee._id,
      designation: "Senior Software Developer",
      joiningDate: new Date("2025-01-15"),
      employmentType: "FULL_TIME",
      status: "ACTIVE",
      workLocation: "Tech Park (Bengaluru)",
    });

    // 5. Update Department Managers
    itDepartment.managerId = managerEmployee._id;
    await itDepartment.save();

    hrDepartment.managerId = hrEmployee._id;
    await hrDepartment.save();

    accountsDepartment.managerId = accountsEmployee._id;
    await accountsDepartment.save();

    adminDepartment.managerId = adminEmployee._id;
    await adminDepartment.save();

    // 6. Create Leave Types & Balances
    const cl = await LeaveType.create({
      name: "Casual Leave",
      code: "CL",
      defaultDays: 12,
      isPaid: true,
      description: "For personal emergencies and short breaks",
    });

    const sl = await LeaveType.create({
      name: "Sick Leave",
      code: "SL",
      defaultDays: 10,
      isPaid: true,
      description: "For medical illness and recovery",
    });

    const pl = await LeaveType.create({
      name: "Privilege / Annual Leave",
      code: "PL",
      defaultDays: 18,
      isPaid: true,
      description: "Annual planned vacation time",
    });

    // adminEmployee === ceoEmployee, so exclude to avoid duplicate leave balances
    const allEmps = [ceoEmployee, hrEmployee, managerEmployee, accountsEmployee, developerEmployee];

    for (const emp of allEmps) {
      await LeaveBalance.create({
        employeeId: emp._id,
        leaveTypeId: cl._id,
        year: 2026,
        allocatedDays: 12,
        usedDays: 2,
        pendingDays: 1,
        remainingDays: 9,
      });
      await LeaveBalance.create({
        employeeId: emp._id,
        leaveTypeId: sl._id,
        year: 2026,
        allocatedDays: 10,
        usedDays: 1,
        pendingDays: 0,
        remainingDays: 9,
      });
      await LeaveBalance.create({
        employeeId: emp._id,
        leaveTypeId: pl._id,
        year: 2026,
        allocatedDays: 18,
        usedDays: 0,
        pendingDays: 0,
        remainingDays: 18,
      });
    }

    // 7. Seed Sample Leave Requests
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 3);

    await LeaveRequest.create({
      employeeId: developerEmployee._id,
      leaveTypeId: cl._id,
      startDate: tomorrow,
      endDate: dayAfter,
      totalDays: 2,
      reason: "Family function in hometown",
      status: "PENDING",
    });

    // 8. Seed Sample Today's Attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const punchIn = new Date();
    punchIn.setHours(9, 15, 0, 0);

    for (const emp of [ceoEmployee, hrEmployee, managerEmployee, developerEmployee]) {
      await Attendance.create({
        employeeId: emp._id,
        date: today,
        checkIn: punchIn,
        status: "PRESENT",
        checkInSource: "WEB",
        totalWorkingMinutes: 240,
      });
    }

    // 9. Seed Sample Work Update
    await WorkUpdate.create({
      employeeId: developerEmployee._id,
      date: today,
      summary: "Implemented RESTful API endpoints and integrated UI components.",
      accomplishments: "Completed backend controllers for HRMS and connected frontend views.",
      blockers: "None",
      nextDayPlan: "Perform end-to-end integration testing and optimize payload serialization.",
      totalHours: 7.5,
      status: "SUBMITTED",
    });

    // 10. Seed Sample Helpdesk Tickets
    await HelpdeskTicket.create([
      {
        ticketNumber: "REQ-84912",
        employeeId: developerEmployee._id,
        category: "IT",
        subject: "Secondary Monitor Request for Dual-Screen Setup",
        description: "Requesting a 27-inch 4K monitor for development workstation at Bengaluru tech park.",
        priority: "MEDIUM",
        status: "OPEN",
      },
      {
        ticketNumber: "REQ-93810",
        employeeId: developerEmployee._id,
        category: "PAYROLL",
        subject: "Tax Exemption Declaration Verification",
        description: "Submitted rent receipts for HRA exemption. Please verify and confirm before monthly payroll cycle.",
        priority: "LOW",
        status: "RESOLVED",
        resolutionNotes: "Rent receipts verified. HRA tax rebate applied to current fiscal cycle.",
        resolvedAt: new Date(),
      },
    ]);

    // 11. Seed Payslips & Holidays
    for (const emp of allEmps) {
      await seedSamplePayslipsIfEmpty(emp._id);
    }
    await seedDefaultHolidaysIfEmpty(2026);

    console.log("==================================================");
    console.log("SEEDING COMPLETED SUCCESSFULLY!");
    console.log("TECHNORIYA eTECHNOLOGIES PVT LTD — Login Accounts:");
    console.log("==================================================");
    console.log("1. CEO / Admin:       neeraj@technoriya.com      (Password: Ganesh@Techno)");
    console.log("2. HR Department:     hr@technoriya.com          (Password: Laxmi@TETPL)");
    console.log("3. IT Manager:        webadmin@technoriya.com    (Password: Mitali@123)");
    console.log("4. Accounts:          accounts@technoriya.com    (Password: Neha@TETPL)");
    console.log("5. Employee:          web.technoriya@gmail.com   (Password: Shubhasmita@TETPL)");
    console.log("==================================================");

    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
};

seed();