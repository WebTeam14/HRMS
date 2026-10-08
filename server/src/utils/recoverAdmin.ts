import "../config/env";
import bcrypt from "bcryptjs";
import { connectDatabase } from "../config/database";
import { User } from "../models/User";
import { Employee } from "../models/Employee";
import { Department } from "../models/Department";
import { Designation } from "../models/Designation";
import { ROLES } from "./roles";

export const recoverAdminAccounts = async () => {
  try {
    console.log("Connecting to database for Admin recovery...");
    await connectDatabase();

    // 1. Recover/Ensure Administration Department
    let adminDept = await Department.findOne({ code: "ADMIN" });
    if (!adminDept) {
      adminDept = await Department.create({
        name: "Administration",
        code: "ADMIN",
        description: "Facility operations, executive governance, and general corporate administration",
      });
      console.log("✓ Created Administration Department");
    }

    // 2. Recover/Ensure CEO Designation
    let ceoDesignation = await Designation.findOne({ code: "CEO" });
    if (!ceoDesignation) {
      ceoDesignation = await Designation.create({
        name: "Chief Executive Officer",
        code: "CEO",
        departmentId: adminDept._id,
        description: "Executive strategic leadership and organizational vision",
      });
      console.log("✓ Created CEO Designation");
    }

    // 3. Recover/Ensure Admin Designation
    let adminDesignation = await Designation.findOne({ code: "ADMO" });
    if (!adminDesignation) {
      adminDesignation = await Designation.create({
        name: "Admin Officer",
        code: "ADMO",
        departmentId: adminDept._id,
        description: "Administration and workplace management",
      });
      console.log("✓ Created Admin Officer Designation");
    }

    // 4. Password Hashes
    const ceoPasswordPlain = "Ganesh@Techno";
    const ceoPwdHash = await bcrypt.hash(ceoPasswordPlain, 12);

    const adminPasswordPlain = "Admin@Technoriya123";
    const adminPwdHash = await bcrypt.hash(adminPasswordPlain, 12);

    // 5. Recover CEO/Admin User: neeraj@technoriya.com
    let ceoUser = await User.findOne({ email: "neeraj@technoriya.com" });
    if (!ceoUser) {
      ceoUser = await User.create({
        email: "neeraj@technoriya.com",
        passwordHash: ceoPwdHash,
        role: ROLES.CEO,
        isActive: true,
      });
      console.log("✓ Created CEO/Admin User: neeraj@technoriya.com");
    } else {
      ceoUser.passwordHash = ceoPwdHash;
      ceoUser.role = ROLES.CEO;
      ceoUser.isActive = true;
      await ceoUser.save();
      console.log("✓ Restored & reactivated existing CEO/Admin User: neeraj@technoriya.com");
    }

    // 6. Recover Dedicated Admin User: admin@technoriya.com
    let adminUser = await User.findOne({ email: "admin@technoriya.com" });
    if (!adminUser) {
      adminUser = await User.create({
        email: "admin@technoriya.com",
        passwordHash: adminPwdHash,
        role: ROLES.ADMIN,
        isActive: true,
      });
      console.log("✓ Created Dedicated Admin User: admin@technoriya.com");
    } else {
      adminUser.passwordHash = adminPwdHash;
      adminUser.role = ROLES.ADMIN;
      adminUser.isActive = true;
      await adminUser.save();
      console.log("✓ Restored & reactivated existing Admin User: admin@technoriya.com");
    }

    // 7. Ensure Employee link for EMP-1001 (Rajesh Mehta / CEO)
    let ceoEmployee = await Employee.findOne({ employeeCode: "EMP-1001" });
    if (!ceoEmployee) {
      ceoEmployee = await Employee.create({
        userId: ceoUser._id,
        employeeCode: "EMP-1001",
        firstName: "Rajesh",
        lastName: "Mehta",
        phone: "+91 98765 43210",
        departmentId: adminDept._id,
        designation: "Chief Executive Officer",
        joiningDate: new Date("2020-01-01"),
        employmentType: "FULL_TIME",
        status: "ACTIVE",
        workLocation: "Headquarters (Mumbai)",
        monthlySalary: 150000,
        annualCtc: 1800000,
      });
      console.log("✓ Created Employee Profile EMP-1001 (Rajesh Mehta - CEO)");
    } else {
      ceoEmployee.userId = ceoUser._id;
      ceoEmployee.status = "ACTIVE";
      await ceoEmployee.save();
      console.log("✓ Re-linked Employee Profile EMP-1001 to restored CEO account");
    }

    // 8. Ensure Employee link for EMP-1000 (System Admin)
    let adminEmployee = await Employee.findOne({ employeeCode: "EMP-1000" });
    if (!adminEmployee) {
      adminEmployee = await Employee.create({
        userId: adminUser._id,
        employeeCode: "EMP-1000",
        firstName: "System",
        lastName: "Administrator",
        phone: "+91 98000 00001",
        departmentId: adminDept._id,
        designation: "System Administrator",
        joiningDate: new Date("2020-01-01"),
        employmentType: "FULL_TIME",
        status: "ACTIVE",
        workLocation: "Headquarters (Mumbai)",
        monthlySalary: 120000,
        annualCtc: 1440000,
      });
      console.log("✓ Created Employee Profile EMP-1000 (System Administrator)");
    } else {
      adminEmployee.userId = adminUser._id;
      adminEmployee.status = "ACTIVE";
      await adminEmployee.save();
      console.log("✓ Re-linked Employee Profile EMP-1000 to restored Admin account");
    }

    console.log("\n=======================================================");
    console.log("ADMIN ACCOUNT RECOVERY COMPLETED SUCCESSFULLY!");
    console.log("No other data was deleted or modified.");
    console.log("=======================================================");
    console.log("You can now log in using either of the following accounts:\n");
    console.log("OPTION 1 — CEO / Executive Admin Account:");
    console.log("  • Email:       neeraj@technoriya.com  (or Employee ID: EMP-1001)");
    console.log(`  • Password:    ${ceoPasswordPlain}`);
    console.log("  • Role:        CEO (Full Administrative Privileges)\n");
    console.log("OPTION 2 — Dedicated Administrator Account:");
    console.log("  • Email:       admin@technoriya.com   (or Employee ID: EMP-1000)");
    console.log(`  • Password:    ${adminPasswordPlain}`);
    console.log("  • Role:        ADMIN (Full Administrative Privileges)\n");
    console.log("=======================================================");

    process.exit(0);
  } catch (error) {
    console.error("Recovery failed with error:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  recoverAdminAccounts();
}
