export const ATTENDANCE_CONFIG = {
  officeStartTime: "09:30",
  officeEndTime: "18:30",
  lateAfter: "09:45",
  halfDayAfter: "13:30",
  timezone: "Asia/Kolkata",
  timezoneOffsetHours: 5.5,
};

/**
 * Returns normalized UTC date for start of today in IST (00:00:00.000 IST).
 * E.g., for 2026-09-15 in IST, returns 2026-09-15T00:00:00.000Z normalized.
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
 * Determines check-in status (PRESENT or LATE) based on office timing in IST.
 */
export const determineCheckInStatus = (
  checkInTime: Date = new Date()
): "PRESENT" | "LATE" => {
  const istOffsetMs = ATTENDANCE_CONFIG.timezoneOffsetHours * 60 * 60 * 1000;
  const istDate = new Date(checkInTime.getTime() + istOffsetMs);

  const hours = istDate.getUTCHours();
  const minutes = istDate.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;

  const [lateHours, lateMinutes] = ATTENDANCE_CONFIG.lateAfter
    .split(":")
    .map(Number);
  const lateThresholdMinutes = lateHours * 60 + lateMinutes;

  return totalMinutes <= lateThresholdMinutes ? "PRESENT" : "LATE";
};
