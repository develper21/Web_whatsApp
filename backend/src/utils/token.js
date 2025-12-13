import jwt from "jsonwebtoken";

function assertSecret(secret, name) {
  if (!secret) {
    throw new Error(`${name} is not defined in environment variables`);
  }
}

export const generateAccessToken = (payload) => {
  const secret = process.env.JWT_ACCESS_SECRET;
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRY;
  assertSecret(secret, "JWT_ACCESS_SECRET");
  return jwt.sign(payload, secret, { expiresIn });
};

export const generateRefreshToken = (payload) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRY;
  assertSecret(secret, "JWT_REFRESH_SECRET");
  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyAccessToken = (token) => {
  const secret = process.env.JWT_ACCESS_SECRET;
  assertSecret(secret, "JWT_ACCESS_SECRET");
  return jwt.verify(token, secret);
};

export const verifyRefreshToken = (token) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  assertSecret(secret, "JWT_REFRESH_SECRET");
  return jwt.verify(token, secret);
};
