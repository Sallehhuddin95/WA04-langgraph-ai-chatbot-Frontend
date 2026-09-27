export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (raw !== undefined && raw.length > 0) return raw.replace(/\/$/, "");
  return "http://localhost:8000";
}
