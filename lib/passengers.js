import { readFile } from "fs/promises";
import path from "path";

let cachedPassengers;

export async function getPassengers() {
  if (cachedPassengers) return cachedPassengers;

  try {
    const file = await readFile(path.join(process.cwd(), "randomnames.csv"), "utf8");
    cachedPassengers = file
      .trim()
      .split(/\r?\n/)
      .slice(0, 250)
      .map((line) => {
        const [id, title, firstName, lastName, gender, email] = line.split(",");
        return { id, title, firstName, lastName, gender, email };
      });
  } catch {
    cachedPassengers = [];
  }

  return cachedPassengers;
}
