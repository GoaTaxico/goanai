export type Holiday = {
  date: string;
  end?: string;
  label: string;
  name: string;
  where: "India" | "Goa school";
};

/** National dates are the 2026 central government holiday list. Goa breaks are the Directorate of Education calendar for 2026–27. */
export const HOLIDAYS: Holiday[] = [
  { date: "2026-01-26", label: "26 Jan", name: "Republic Day", where: "India" },
  { date: "2026-03-04", label: "4 Mar", name: "Holi", where: "India" },
  { date: "2026-03-21", label: "21 Mar", name: "Id-ul-Fitr", where: "India" },
  { date: "2026-03-26", label: "26 Mar", name: "Ram Navami", where: "India" },
  { date: "2026-03-31", label: "31 Mar", name: "Mahavir Jayanti", where: "India" },
  { date: "2026-04-03", label: "3 Apr", name: "Good Friday", where: "India" },
  { date: "2026-05-01", end: "2026-06-05", label: "1 May–5 Jun", name: "Summer vacation", where: "Goa school" },
  { date: "2026-05-01", label: "1 May", name: "Buddha Purnima", where: "India" },
  { date: "2026-05-27", label: "27 May", name: "Id-ul-Zuha (Bakrid)", where: "India" },
  { date: "2026-06-06", label: "6 Jun", name: "Classes I–V and XI reopen", where: "Goa school" },
  { date: "2026-06-26", label: "26 Jun", name: "Muharram", where: "India" },
  { date: "2026-08-15", label: "15 Aug", name: "Independence Day", where: "India" },
  { date: "2026-08-26", label: "26 Aug", name: "Id-e-Milad", where: "India" },
  { date: "2026-09-04", label: "4 Sep", name: "Janmashtami", where: "India" },
  { date: "2026-09-14", end: "2026-09-19", label: "14–19 Sep", name: "Ganesh Chaturthi break", where: "Goa school" },
  { date: "2026-10-02", label: "2 Oct", name: "Gandhi Jayanti", where: "India" },
  { date: "2026-10-10", label: "10 Oct", name: "First term ends", where: "Goa school" },
  { date: "2026-10-12", label: "12 Oct", name: "Second term begins", where: "Goa school" },
  { date: "2026-10-20", label: "20 Oct", name: "Dussehra", where: "India" },
  { date: "2026-11-02", end: "2026-11-21", label: "2–21 Nov", name: "Diwali vacation", where: "Goa school" },
  { date: "2026-11-08", label: "8 Nov", name: "Diwali", where: "India" },
  { date: "2026-11-24", label: "24 Nov", name: "Guru Nanak Jayanti", where: "India" },
  { date: "2026-12-19", label: "19 Dec", name: "Goa Liberation Day", where: "Goa school" },
  { date: "2026-12-24", end: "2027-01-02", label: "24 Dec–2 Jan", name: "Christmas vacation", where: "Goa school" },
  { date: "2026-12-25", label: "25 Dec", name: "Christmas", where: "India" },
];

export const HOLIDAY_NOTE =
  "National dates follow the 2026 central government holiday list. Goa school breaks follow the Directorate of Education calendar for 2026-27.";

function istDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function upcomingHolidays(now = new Date()) {
  const today = istDate(now);
  return HOLIDAYS.filter((holiday) => (holiday.end ?? holiday.date) >= today);
}
