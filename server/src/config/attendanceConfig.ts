export const ATTENDANCE_CONFIG = {
  officeStartTime: "10:30",
  officeEndTime: "18:30",
  lateAfter: "10:35",
  halfDayCheckInAfter: "13:30",
  minHalfDayMinutes: 240, // 4 hours
  minFullDayMinutes: 420, // 7 hours
  timezone: "Asia/Kolkata",
  timezoneOffsetHours: 5.5,
};

/**
 * Returns normalized UTC date for start of today in IST (00:00:00.000 IST).
 */
export const getNormalizedDate = (date: Date = new Date()): Date => {
  const istOffsetMs = ATTENDANCE_CONFIG.timezoneOffsetHours * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffsetMs);
  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth();
  const day = istDate.getUTCDate();

  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
};

/**
 * Determines check-in status (PRESENT, LATE, or HALF_DAY) based on 10:30 AM office start.
 */
export const determineCheckInStatus = (
  checkInTime: Date = new Date()
): "PRESENT" | "LATE" | "HALF_DAY" => {
  const istOffsetMs = ATTENDANCE_CONFIG.timezoneOffsetHours * 60 * 60 * 1000;
  const istDate = new Date(checkInTime.getTime() + istOffsetMs);

  const hours = istDate.getUTCHours();
  const minutes = istDate.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;

  // 10:35 AM = 635 minutes
  const [lateHours, lateMinutes] = ATTENDANCE_CONFIG.lateAfter.split(":").map(Number);
  const lateThresholdMinutes = lateHours * 60 + lateMinutes;

  // 1:30 PM = 810 minutes
  const [halfDayHours, halfDayMinutes] = ATTENDANCE_CONFIG.halfDayCheckInAfter.split(":").map(Number);
  const halfDayThresholdMinutes = halfDayHours * 60 + halfDayMinutes;

  if (totalMinutes > halfDayThresholdMinutes) {
    return "HALF_DAY";
  }
  if (totalMinutes > lateThresholdMinutes) {
    return "LATE";
  }
  return "PRESENT";
};

/**
 * Recalculates status upon check-out considering 10:30 AM - 6:30 PM shift (8 hours).
 */
export const determineCheckOutStatus = (
  checkInTime: Date,
  checkOutTime: Date,
  currentStatus: "PRESENT" | "LATE" | "HALF_DAY"
): { status: "PRESENT" | "LATE" | "HALF_DAY"; note?: string } => {
  const diffMs = checkOutTime.getTime() - checkInTime.getTime();
  const workingMinutes = Math.max(0, Math.round(diffMs / 60000));

  const istOffsetMs = ATTENDANCE_CONFIG.timezoneOffsetHours * 60 * 60 * 1000;
  const checkOutIst = new Date(checkOutTime.getTime() + istOffsetMs);
  const checkOutHour = checkOutIst.getUTCHours();
  const checkOutMin = checkOutIst.getUTCMinutes();
  const totalOutMinutes = checkOutHour * 60 + checkOutMin;

  // 6:30 PM = 1110 minutes
  const [endHours, endMinutes] = ATTENDANCE_CONFIG.officeEndTime.split(":").map(Number);
  const officeEndMinutes = endHours * 60 + endMinutes;

  // Worked less than 4 hours -> HALF_DAY
  if (workingMinutes < ATTENDANCE_CONFIG.minHalfDayMinutes) {
    return {
      status: "HALF_DAY",
      note: `Half-day applied: Total working time (${Math.floor(workingMinutes / 60)}h ${workingMinutes % 60}m) is under 4 hours`,
    };
  }

  // Early logout before 6:30 PM with less than 7 hours -> HALF_DAY
  if (totalOutMinutes < officeEndMinutes && workingMinutes < ATTENDANCE_CONFIG.minFullDayMinutes) {
    return {
      status: "HALF_DAY",
      note: `Half-day applied: Checked out early at ${String(checkOutHour).padStart(2, '0')}:${String(checkOutMin).padStart(2, '0')} before 6:30 PM`,
    };
  }

  // Checked out early but completed >= 7 hours -> Keep status with early checkout note
  if (totalOutMinutes < officeEndMinutes) {
    return {
      status: currentStatus,
      note: `Early logout recorded at ${String(checkOutHour).padStart(2, '0')}:${String(checkOutMin).padStart(2, '0')}`,
    };
  }

  return { status: currentStatus };
};
