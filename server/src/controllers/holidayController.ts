import { Request, Response } from "express";
import * as holidayService from "../services/holidayService";

export const getHolidays = async (req: Request, res: Response): Promise<void> => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string, 10) : 2026;
    const type = req.query.type as any;

    const result = await holidayService.getHolidays({ year, type });

    res.status(200).json({
      success: true,
      data: result.holidays,
      nextHoliday: result.nextHoliday,
      meta: {
        totalMandatory: result.totalMandatory,
        totalOptional: result.totalOptional,
        total: result.holidays.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch holidays",
    });
  }
};

export const createHoliday = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, date, type, description } = req.body;
    if (!name || !date) {
      res.status(400).json({
        success: false,
        message: "Holiday name and date are required",
      });
      return;
    }

    const holiday = await holidayService.createHoliday({
      name,
      date,
      type,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Holiday created successfully",
      data: holiday,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create holiday",
    });
  }
};
