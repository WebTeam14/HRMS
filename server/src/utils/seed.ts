import "../config/env";

import bcrypt from "bcryptjs";
import { connectDatabase } from "../config/database";
import { User } from "../models/User";
import { Department } from "../models/Department";
import { Employee } from "../models/Employee";
import { ROLES } from "./roles";

const seed = async () => {
  try {
    await connectDatabase();

    console.log("Clearing existing seed data...");

    await Employee.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash(
      "Demo@12345",
      12
    );

    // Create users
    const ceoUser = await User.create({
      email: "ceo@hrms-demo.com",
      passwordHash,
      role: ROLES.CEO,
    });

    const hrUser = await User.create({
      email: "hr@hrms-demo.com",
      passwordHash,
      role: ROLES.HR,
    });

    const managerUser = await User.create({
      email: "manager@hrms-demo.com",
      passwordHash,
      role: ROLES.MANAGER,
    });

    const accountsUser = await User.create({
      email: "accounts@hrms-demo.com",
      passwordHash,
      role: ROLES.ACCOUNTS,
    });

    const employeeUser = await User.create({
      email: "employee@hrms-demo.com",
      passwordHash,
      role: ROLES.EMPLOYEE,
    });

    // Departments
    const itDepartment = await Department.create({
      name: "Information Technology",
      code: "IT",
      description: "Software and technology department",
    });

    const hrDepartment = await Department.create({
      name: "Human Resources",
      code: "HR",
      description: "Human resources department",
    });

    const accountsDepartment = await Department.create({
      name: "Accounts & Finance",
      code: "ACCOUNTS",
      description: "Finance and accounts department",
    });

    const adminDepartment = await Department.create({
      name: "Administration",
      code: "ADMIN",
      description: "Administration department",
    });

    const operationsDepartment = await Department.create({
      name: "Operations",
      code: "OPERATIONS",
      description: "Operations department",
    });

    const backOfficeDepartment = await Department.create({
      name: "Back Office",
      code: "BACK_OFFICE",
      description: "Back office department",
    });

    // Employees
    const ceoEmployee = await Employee.create({
      userId: ceoUser._id,
      employeeCode: "EMP-1001",
      firstName: "Demo",
      lastName: "CEO",
      designation: "Chief Executive Officer",
      joiningDate: new Date("2020-01-01"),
      employmentType: "FULL_TIME",
      status: "ACTIVE",
    });

    const hrEmployee = await Employee.create({
      userId: hrUser._id,
      employeeCode: "EMP-1002",
      firstName: "Demo",
      lastName: "HR",
      departmentId: hrDepartment._id,
      managerId: ceoEmployee._id,
      designation: "HR Manager",
      joiningDate: new Date("2021-01-01"),
      employmentType: "FULL_TIME",
      status: "ACTIVE",
    });

    const managerEmployee = await Employee.create({
      userId: managerUser._id,
      employeeCode: "EMP-1003",
      firstName: "Demo",
      lastName: "Manager",
      departmentId: itDepartment._id,
      managerId: ceoEmployee._id,
      designation: "IT Manager",
      joiningDate: new Date("2021-06-01"),
      employmentType: "FULL_TIME",
      status: "ACTIVE",
    });

    await Employee.create({
      userId: accountsUser._id,
      employeeCode: "EMP-1004",
      firstName: "Demo",
      lastName: "Accounts",
      departmentId: accountsDepartment._id,
      managerId: ceoEmployee._id,
      designation: "Accounts Manager",
      joiningDate: new Date("2022-01-01"),
      employmentType: "FULL_TIME",
      status: "ACTIVE",
    });

    await Employee.create({
      userId: employeeUser._id,
      employeeCode: "EMP-1005",
      firstName: "Demo",
      lastName: "Employee",
      departmentId: itDepartment._id,
      managerId: managerEmployee._id,
      designation: "Software Developer",
      joiningDate: new Date("2025-01-15"),
      employmentType: "FULL_TIME",
      status: "ACTIVE",
    });

    console.log("Seed completed successfully");

    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
};

seed();