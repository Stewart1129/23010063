"use client";

import { useEffect, useMemo, useState } from "react";

const today = new Date().toISOString().slice(0, 10);
const nextMonth = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10);

const routePairs = [
  ["NZNE", "YSSY"],
  ["YSSY", "NZNE"],
  ["NZNE", "NZRO"],
  ["NZRO", "NZNE"],
  ["NZNE", "NZGB"],
  ["NZGB", "NZNE"],
  ["NZNE", "NZCI"],
  ["NZCI", "NZNE"],
  ["NZNE", "NZTL"],
  ["NZTL", "NZNE"]
];

function formatAirportTime(value, airport) {
  const shifted = new Date(new Date(value).getTime() + airport.tzOffsetMinutes * 60000);
  return `${new Intl.DateTimeFormat("en-NZ", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
    timeZone: "UTC"
  }).format(shifted)} ${airport.code}`;
}

export default function Home() {
  const [airports, setAirports] = useState([]);
  const [query, setQuery] = useState({ orig: "NZNE", dest: "YSSY", date1: today, date2: nextMonth });
  const [flights, setFlights] = useState([]);
  const [selected, setSelected] = useState(null);
  const [booking, setBooking] = useState(null);
  const [cancelRef, setCancelRef] = useState("");
  const [lookupEmail, setLookupEmail] = useState("");
  const [passengerTrips, setPassengerTrips] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const airportByCode = useMemo(() => Object.fromEntries(airports.map((airport) => [airport.code, airport])), [airports]);
  const availableDestinations = useMemo(
    () => routePairs.filter(([orig]) => orig === query.orig).map(([, dest]) => dest),
    [query.orig]
  );

  useEffect(() => {
    fetch("/api/airports").then((res) => res.json()).then(setAirports);
    fetch("/api/passengers").then((res) => res.json()).then((data) => setPassengers(data.passengers || []));
  }, []);

  async function searchFlights(event, options = {}) {
    event?.preventDefault();
    setBusy(true);
    setMessage("");
    const params = new URLSearchParams(query);
    const res = await fetch(`/api/schedules?${params}`);
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Flight search could not be completed.");
      setBusy(false);
      return;
    }
    setFlights(data.schedules || []);
    setSelected(null);
    if (!options.keepBooking) setBooking(null);
    setBusy(false);
  }

  function updateOrigin(orig) {
    const dest = routePairs.find(([routeOrig]) => routeOrig === orig)?.[1] || "";
    setQuery({ ...query, orig, dest });
  }

  async function createBooking(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      scheduleId: selected.id,
      title: form.get("title"),
      firstName: form.get("firstName"),
      lastName: form.get("lastName"),
      email: form.get("email")
    };
    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) setMessage(data.error || "Booking could not be completed.");
    if (res.ok) {
      await searchFlights(undefined, { keepBooking: true });
      setBooking(data);
      setMessage(`Booking ${data.reference} confirmed.`);
    }
    setBusy(false);
  }

  async function cancelBooking(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference: cancelRef })
    });
    const data = await res.json();
    setMessage(res.ok ? `Booking ${data.reference} has been cancelled.` : data.error);
    if (res.ok) await searchFlights(undefined, { keepBooking: true });
    setBusy(false);
  }

  async function lookupPassenger(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const res = await fetch(`/api/passenger?email=${encodeURIComponent(lookupEmail)}`);
    const data = await res.json();
    setPassengerTrips(data.bookings || []);
    setBusy(false);
  }

  return (
    <main>
      <section className="hero">
        <div className="heroText">
          <p className="eyebrow">NZNE private jet booking</p>
          <h1>Dairy Flat Air</h1>
          <p>Point-to-point scheduled services from Dairy Flat to Sydney, Rotorua, Great Barrier, the Chathams, and Lake Tekapo.</p>
        </div>
        <form className="searchPanel" onSubmit={searchFlights}>
          <label>
            From
            <select value={query.orig} onChange={(e) => updateOrigin(e.target.value)}>
              {[...new Set(routePairs.map(([orig]) => orig))].map((code) => (
                <option key={code} value={code}>
                  {airportByCode[code]?.name || code} ({code})
                </option>
              ))}
            </select>
          </label>
          <label>
            To
            <select value={query.dest} onChange={(e) => setQuery({ ...query, dest: e.target.value })}>
              {availableDestinations.map((code) => (
                <option key={code} value={code}>
                  {airportByCode[code]?.name || code} ({code})
                </option>
              ))}
            </select>
          </label>
          <label>
            Earliest
            <input type="date" value={query.date1} onChange={(e) => setQuery({ ...query, date1: e.target.value })} />
          </label>
          <label>
            Latest
            <input type="date" value={query.date2} onChange={(e) => setQuery({ ...query, date2: e.target.value })} />
          </label>
          <button disabled={busy}>{busy ? "Working..." : "Search flights"}</button>
        </form>
      </section>

      {message && <p className="notice">{message}</p>}

      <section className="contentGrid">
        <div>
          <div className="sectionTitle">
            <h2>Scheduled flights</h2>
            <span>{flights.length} matching services</span>
          </div>
          <div className="flightList">
            {flights.map((flight) => (
              <button className="flightCard" key={flight.id} onClick={() => setSelected(flight)}>
                <span className="flightNo">{flight.flightNo}</span>
                <strong>{flight.origin.city} to {flight.destination.city}</strong>
                <span>{formatAirportTime(flight.departureUtc, flight.origin)} to {formatAirportTime(flight.arrivalUtc, flight.destination)}</span>
                <span>{flight.aircraft.name} | {flight.remainingSeats} seats left | ${flight.price}</span>
              </button>
            ))}
            {!flights.length && <p className="empty">Search a date range to see available services.</p>}
          </div>
        </div>

        <aside className="sideStack">
          <section className="tool">
            <h2>Book selected flight</h2>
            {selected ? (
              <form onSubmit={createBooking}>
                <p className="selectedLine">{selected.flightNo} | {selected.origin.city} to {selected.destination.city}</p>
                <div className="row">
                  <label>Title<input name="title" defaultValue="Ms" required /></label>
                  <label>First name<input name="firstName" required /></label>
                </div>
                <label>Last name<input name="lastName" required /></label>
                <label>Email<input name="email" type="email" list="samplePassengers" required /></label>
                <datalist id="samplePassengers">
                  {passengers.map((passenger) => (
                    <option key={passenger.id} value={passenger.email}>
                      {passenger.title} {passenger.firstName} {passenger.lastName}
                    </option>
                  ))}
                </datalist>
                <button disabled={busy}>Confirm booking</button>
              </form>
            ) : (
              <p className="empty">Select a flight to make a booking.</p>
            )}
          </section>

          {booking && (
            <section className="invoice">
              <h2>Invoice</h2>
              <p><strong>Reference:</strong> {booking.reference}</p>
              <p><strong>Passenger:</strong> {booking.passenger.firstName} {booking.passenger.lastName}</p>
              <p><strong>Flight:</strong> {booking.schedule.flightNo}</p>
              <p><strong>Depart:</strong> {formatAirportTime(booking.schedule.departureUtc, booking.schedule.origin)}</p>
              <p><strong>Arrive:</strong> {formatAirportTime(booking.schedule.arrivalUtc, booking.schedule.destination)}</p>
              <p><strong>Total:</strong> ${booking.schedule.price}</p>
            </section>
          )}

          <section className="tool">
            <h2>Cancel booking</h2>
            <form onSubmit={cancelBooking}>
              <label>Booking reference<input value={cancelRef} onChange={(e) => setCancelRef(e.target.value)} placeholder="DFA-..." required /></label>
              <button disabled={busy}>Cancel</button>
            </form>
          </section>

          <section className="tool">
            <h2>Passenger lookup</h2>
            <form onSubmit={lookupPassenger}>
              <label>Email<input type="email" list="samplePassengers" value={lookupEmail} onChange={(e) => setLookupEmail(e.target.value)} placeholder="ella.lee@blobmail.com" required /></label>
              <button disabled={busy}>Find bookings</button>
            </form>
            <div className="miniList">
              {passengerTrips.map((trip) => (
                <p key={trip.reference}>{trip.reference}: {trip.schedule.flightNo} on {formatAirportTime(trip.schedule.departureUtc, trip.schedule.origin)}</p>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
