import { Holiday, IHoliday, HolidayType } from "../models/Holiday";

const DEFAULT_HOLIDAYS_2026: Array<{
  name: string;
  date: string;
  day: string;
  type: HolidayType;
  description: string;
}> = [
  {
    name: "New Year's Day",
    date: "2026-01-01",
    day: "Thursday",
    type: "MANDATORY",
    description: "Global celebration of the start of the year 2026",
  },
  {
    name: "Republic Day",
    date: "2026-01-26",
    day: "Monday",
    type: "MANDATORY",
    description: "National celebration of the Constitution of India",
  },
  {
    name: "Maha Shivratri",
    date: "2026-02-16",
    day: "Monday",
    type: "OPTIONAL",
    description: "Hindu festival celebrated annually in honour of Lord Shiva",
  },
  {
    name: "Holi",
    date: "2026-03-04",
    day: "Wednesday",
    type: "MANDATORY",
    description: "Festival of colors and spring celebration",
  },
  {
    name: "Eid-ul-Fitr",
    date: "2026-03-21",
    day: "Saturday",
    type: "MANDATORY",
    description: "Islamic celebration marking the end of Ramadan",
  },
  {
    name: "Good Friday",
    date: "2026-04-03",
    day: "Friday",
    type: "MANDATORY",
    description: "Christian holiday commemorating the passion and resurrection",
  },
  {
    name: "Maharashtra Day / Labour Day",
    date: "2026-05-01",
    day: "Friday",
    type: "MANDATORY",
    description: "International Workers' Day and State foundation day",
  },
  {
    name: "Independence Day",
    date: "2026-08-15",
    day: "Saturday",
    type: "MANDATORY",
    description: "National celebration of Independence",
  },
  {
    name: "Ganesh Chaturthi",
    date: "2026-09-14",
    day: "Monday",
    type: "MANDATORY",
    description: "Festival celebrating the arrival of Lord Ganesha",
  },
  {
    name: "Mahatma Gandhi Jayanti",
    date: "2026-10-02",
    day: "Friday",
    type: "MANDATORY",
    description: "National holiday commemorating Mahatma Gandhi's birthday",
  },
  {
    name: "Dussehra (Vijayadashami)",
    date: "2026-10-20",
    day: "Tuesday",
    type: "MANDATORY",
    description: "Celebration of the victory of good over evil",
  },
  {
    name: "Diwali (Deepavali)",
    date: "2026-11-08",
    day: "Sunday",
    type: "MANDATORY",
    description: "Festival of lights",
  },
  {
    name: "Guru Nanak Jayanti",
    date: "2026-11-24",
    day: "Tuesday",
    type: "OPTIONAL",
    description: "Birth anniversary of Guru Nanak Dev Ji",
  },
  {
    name: "Christmas Day",
    date: "2026-12-25",
    day: "Friday",
    type: "MANDATORY",
    description: "Annual Christian festival celebrating the birth of Jesus Christ",
  },
];

export const seedDefaultHolidaysIfEmpty = async (year: number): Promise<void> => {
  const count = await Holiday.countDocuments({ year });
  if (count === 0 && year === 2026) {
    for (const h of DEFAULT_HOLIDAYS_2026) {
      await Holiday.create({
        name: h.name,
        date: new Date(h.date),
        day: h.day,
        type: h.type,
        description: h.description,
        year: 2026,
      });
    }
  }
};

export const getHolidays = async (query: {
  year?: number;
  type?: HolidayType;
}): Promise<{
  holidays: IHoliday[];
  nextHoliday: IHoliday | null;
  totalMandatory: number;
  totalOptional: number;
}> => {
  const year = query.year || 2026;
  await seedDefaultHolidaysIfEmpty(year);

  const filter: any = { year };
  if (query.type) {
    filter.type = query.type;
  }

  const holidays = await Holiday.find(filter).sort({ date: 1 });

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcoming = await Holiday.findOne({
    date: { $gte: now },
  }).sort({ date: 1 });

  const totalMandatory = await Holiday.countDocuments({ year, type: "MANDATORY" });
  const totalOptional = await Holiday.countDocuments({ year, type: "OPTIONAL" });

  return {
    holidays,
    nextHoliday: upcoming || null,
    totalMandatory,
    totalOptional,
  };
};

export const createHoliday = async (input: {
  name: string;
  date: string;
  type?: HolidayType;
  description?: string;
}): Promise<IHoliday> => {
  const d = new Date(input.date);
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const day = dayNames[d.getDay()];
  const year = d.getFullYear();

  const holiday = new Holiday({
    name: input.name.trim(),
    date: d,
    day,
    type: input.type || "MANDATORY",
    description: input.description?.trim(),
    year,
  });

  await holiday.save();
  return holiday;
};
