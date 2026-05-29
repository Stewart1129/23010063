import { MongoClient } from "mongodb";
import { generateSchedules, publicSchedule } from "./data";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "dairy_flat_air";

let clientPromise;
const memory = globalThis.__DFA_MEMORY__ || { seeded: false, schedules: [] };
globalThis.__DFA_MEMORY__ = memory;

async function getCollection() {
  if (!uri) return null;
  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect();
  }
  const client = await clientPromise;
  return client.db(dbName).collection("schedules");
}

async function ensureSeeded() {
  const collection = await getCollection();
  if (!collection) {
    if (!memory.seeded) {
      memory.schedules = generateSchedules();
      memory.seeded = true;
    }
    return;
  }

  const count = await collection.countDocuments();
  if (count === 0) {
    await collection.insertMany(generateSchedules());
    await collection.createIndex({ id: 1 }, { unique: true });
    await collection.createIndex({ "bookings.reference": 1 });
    await collection.createIndex({ "bookings.email": 1 });
  }
}

export async function listSchedules({ orig, dest, date1, date2 }) {
  await ensureSeeded();
  if (!orig || !dest || !date1 || !date2) throw new Error("Origin, destination, and date range are required.");
  const start = new Date(`${date1}T00:00:00.000Z`);
  const end = new Date(`${date2}T23:59:59.999Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw new Error("Please provide a valid date range.");
  }
  const collection = await getCollection();

  const filter = {
    "origin.code": orig,
    "destination.code": dest,
    departureUtc: { $gte: start.toISOString(), $lte: end.toISOString() }
  };

  const schedules = collection
    ? await collection.find(filter).sort({ departureUtc: 1 }).toArray()
    : memory.schedules.filter((s) =>
        s.origin.code === orig &&
        s.destination.code === dest &&
        new Date(s.departureUtc) >= start &&
        new Date(s.departureUtc) <= end
      );

  return schedules.map(publicSchedule);
}

export async function bookSeat(scheduleId, passenger) {
  await ensureSeeded();
  const reference = `DFA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const booking = { ...passenger, email: passenger.email.toLowerCase(), reference, cancelled: false, createdAt: new Date().toISOString() };
  const collection = await getCollection();

  if (!collection) {
    const schedule = memory.schedules.find((item) => item.id === scheduleId);
    if (!schedule) throw new Error("Flight not found.");
    const active = schedule.bookings.filter((item) => !item.cancelled).length;
    if (active >= schedule.aircraft.capacity) throw new Error("This flight is full.");
    schedule.bookings.push(booking);
    return { reference, passenger: booking, schedule: publicSchedule(schedule) };
  }

  const result = await collection.findOneAndUpdate(
    {
      id: scheduleId,
      $expr: {
        $lt: [
          {
            $size: {
              $filter: {
                input: { $ifNull: ["$bookings", []] },
                as: "booking",
                cond: { $ne: ["$$booking.cancelled", true] }
              }
            }
          },
          "$aircraft.capacity"
        ]
      }
    },
    { $push: { bookings: booking } },
    { returnDocument: "after" }
  );

  if (!result) {
    const schedule = await collection.findOne({ id: scheduleId });
    if (!schedule) throw new Error("Flight not found.");
    throw new Error("This flight is full.");
  }

  return { reference, passenger: booking, schedule: publicSchedule(result) };
}

export async function cancelBooking(reference) {
  await ensureSeeded();
  const collection = await getCollection();

  if (!collection) {
    for (const schedule of memory.schedules) {
      const booking = schedule.bookings.find((item) => item.reference === reference);
      if (booking && !booking.cancelled) {
        booking.cancelled = true;
        booking.cancelledAt = new Date().toISOString();
        return { reference };
      }
    }
    throw new Error("Booking reference was not found.");
  }

  const result = await collection.updateOne(
    { "bookings.reference": reference, "bookings.cancelled": false },
    { $set: { "bookings.$.cancelled": true, "bookings.$.cancelledAt": new Date().toISOString() } }
  );
  if (result.modifiedCount === 0) throw new Error("Booking reference was not found.");
  return { reference };
}

export async function findPassengerBookings(email) {
  await ensureSeeded();
  const normalized = email.toLowerCase();
  const collection = await getCollection();
  const schedules = collection
    ? await collection.find({ "bookings.email": normalized }).sort({ departureUtc: 1 }).toArray()
    : memory.schedules.filter((schedule) => schedule.bookings.some((booking) => booking.email === normalized));

  return schedules.flatMap((schedule) =>
    schedule.bookings
      .filter((booking) => booking.email === normalized && !booking.cancelled)
      .map((booking) => ({ ...booking, schedule: publicSchedule(schedule) }))
  );
}
