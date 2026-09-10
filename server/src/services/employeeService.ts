import { Employee } from "../models/Employee";

export const getEmployeeById = async (employeeId: string) => {
  const employee = await Employee.findById(employeeId)
    .populate("departmentId")
    .populate("managerId");

  return employee;
};
