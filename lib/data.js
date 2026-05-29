export const airports = [
  { code: "NZNE", name: "Dairy Flat Airport", city: "Dairy Flat", tzOffsetMinutes: 12 * 60 },
  { code: "YSSY", name: "Sydney Airport", city: "Sydney", tzOffsetMinutes: 10 * 60 },
  { code: "NZRO", name: "Rotorua Airport", city: "Rotorua", tzOffsetMinutes: 12 * 60 },
  { code: "NZGB", name: "Claris Airport", city: "Great Barrier", tzOffsetMinutes: 12 * 60 },
  { code: "NZCI", name: "Tuuta Airport", city: "Chatham Islands", tzOffsetMinutes: 12 * 60 + 45 },
  { code: "NZTL", name: "Lake Tekapo Airport", city: "Lake Tekapo", tzOffsetMinutes: 12 * 60 }
];

const aircraft = {
  SJ30I: { name: "SyberJet SJ30i", capacity: 6 },
  SF50: { name: "Cirrus SF50", capacity: 4 },
  HONDA: { name: "HondaJet Elite", capacity: 5 }
};

const routeTemplates = [
  { no: "DFA101", orig: "NZNE", dest: "YSSY", day: 5, time: "10:20", mins: 210, aircraft: "SJ30I", price: 1390 },
  { no: "DFA102", orig: "YSSY", dest: "NZNE", day: 0, time: "15:10", mins: 195, aircraft: "SJ30I", price: 1390 },
  { no: "DFA210", orig: "NZNE", dest: "NZRO", days: [1, 2, 3, 4, 5], time: "07:25", mins: 45, aircraft: "SF50", price: 260 },
  { no: "DFA211", orig: "NZRO", dest: "NZNE", days: [1, 2, 3, 4, 5], time: "08:35", mins: 50, aircraft: "SF50", price: 260 },
  { no: "DFA214", orig: "NZNE", dest: "NZRO", days: [1, 2, 3, 4, 5], time: "16:20", mins: 45, aircraft: "SF50", price: 280 },
  { no: "DFA215", orig: "NZRO", dest: "NZNE", days: [1, 2, 3, 4, 5], time: "17:30", mins: 50, aircraft: "SF50", price: 280 },
  { no: "DFA320", orig: "NZNE", dest: "NZGB", days: [1, 3, 5], time: "09:15", mins: 35, aircraft: "SF50", price: 230 },
  { no: "DFA321", orig: "NZGB", dest: "NZNE", days: [2, 4, 6], time: "10:10", mins: 35, aircraft: "SF50", price: 230 },
  { no: "DFA430", orig: "NZNE", dest: "NZCI", days: [2, 5], time: "09:40", mins: 150, aircraft: "HONDA", price: 820 },
  { no: "DFA431", orig: "NZCI", dest: "NZNE", days: [3, 6], time: "13:05", mins: 165, aircraft: "HONDA", price: 820 },
  { no: "DFA540", orig: "NZNE", dest: "NZTL", day: 1, time: "11:30", mins: 95, aircraft: "HONDA", price: 540 },
  { no: "DFA541", orig: "NZTL", dest: "NZNE", day: 2, time: "10:30", mins: 105, aircraft: "HONDA", price: 540 }
];

function airport(code) {
  return airports.find((item) => item.code === code);
}

function localToUtc(date, time, offsetMinutes) {
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hours, minutes) - offsetMinutes * 60000);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

export function generateSchedules(weeks = 10) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());

  const schedules = [];
  for (let week = 0; week < weeks; week += 1) {
    for (const template of routeTemplates) {
      const days = template.days || [template.day];
      for (const day of days) {
        const localDate = new Date(start);
        localDate.setUTCDate(start.getUTCDate() + week * 7 + day);
        const origin = airport(template.orig);
        const destination = airport(template.dest);
        const departureUtc = localToUtc(localDate, template.time, origin.tzOffsetMinutes);
        const arrivalUtc = addMinutes(departureUtc, template.mins);
        const idDate = localDate.toISOString().slice(0, 10).replaceAll("-", "");
        schedules.push({
          id: `${template.no}-${idDate}`,
          flightNo: template.no,
          origin,
          destination,
          departureUtc: departureUtc.toISOString(),
          arrivalUtc: arrivalUtc.toISOString(),
          aircraft: aircraft[template.aircraft],
          price: template.price,
          bookings: []
        });
      }
    }
  }

  return schedules.sort((a, b) => new Date(a.departureUtc) - new Date(b.departureUtc));
}

export function publicSchedule(schedule) {
  return {
    ...schedule,
    remainingSeats: schedule.aircraft.capacity - (schedule.bookings || []).filter((b) => !b.cancelled).length,
    bookings: undefined
  };
}
