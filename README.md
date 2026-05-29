# Dairy Flat Air

Next.js booking application for the Assignment 2 airline brief.

## Features

- Landing page and flight search by origin, destination, and real date range
- Multi-week generated schedule for Sydney, Rotorua, Great Barrier, Chatham Islands, and Lake Tekapo routes
- Timezone-aware scheduled departure and arrival times
- Seat capacity checks by aircraft type
- Booking creation with unique references and invoice summary
- Booking cancellation by reference
- Passenger booking lookup by email
- Uses `randomnames.csv` for sample passenger suggestions
- Uses MongoDB Atlas when `MONGODB_URI` is configured, with an in-memory fallback for preview/testing

## Vercel deployment

1. Import this folder into Vercel as a Next.js project.
2. Add environment variables:
   - `MONGODB_URI`
   - `MONGODB_DB=dairy_flat_air`
3. Deploy, then submit the short Vercel URL in the portal comments.

For local testing with MongoDB Atlas, copy `.env.example` to `.env.local`, replace `<db_password>` with the database user's password, then restart `npm.cmd run dev`.
