import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const isProduction = process.env.NODE_ENV === "production";

export const env = {
  isProduction,
  port: Number(required("PORT", "4000")),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: required("JWT_EXPIRES_IN", "8h"),
  // On Render the site's own URL is provided as RENDER_EXTERNAL_URL.
  clientOrigin: required("CLIENT_ORIGIN", process.env.RENDER_EXTERNAL_URL ?? "http://localhost:5173"),
  cookieSecure: required("COOKIE_SECURE", isProduction ? "true" : "false") === "true",
  // Number of proxy hops to trust for client IPs (1 behind Render's load balancer).
  trustProxy: Number(required("TRUST_PROXY", "0")),
  // Optional: creates the first admin account on startup when no users exist.
  bootstrapAdmin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    fullName: process.env.ADMIN_NAME ?? "Administrator",
  },
};
