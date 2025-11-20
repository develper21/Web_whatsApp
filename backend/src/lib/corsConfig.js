import dotenv from "dotenv";

dotenv.config();

const normalizeOrigin = (origin) => origin?.replace(/\/$/, "");
const configuredOrigins = (process.env.CLIENT_URLS || "")
  .split(",")
  .map((origin) => normalizeOrigin(origin.trim()))
  .filter(Boolean);

export const allowedOrigins = configuredOrigins.length
  ? configuredOrigins
  : ["http://localhost:5173", "https://chattywhatapp.netlify.app"];

export const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const formattedOrigin = normalizeOrigin(origin);
  return allowedOrigins.includes(formattedOrigin);
};
