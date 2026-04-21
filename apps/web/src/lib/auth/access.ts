export type AppRole = "ADMIN" | "COORDINATOR" | "FACULTY" | "STUDENT";

export interface AuthIdentity {
  username: string;
  displayName: string;
  role: AppRole;
}

export const authSessionCookieName = "scheduler_session";

function getSessionSecret() {
  return process.env.AUTH_SESSION_SECRET ?? "development-session-secret";
}

function toBase64Url(value: string) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf8").toString("base64url");
  }

  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "base64url").toString("utf8");
  }

  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodePayload(identity: AuthIdentity) {
  return toBase64Url(JSON.stringify(identity));
}

function decodePayload(value: string): AuthIdentity | null {
  try {
    return JSON.parse(fromBase64Url(value)) as AuthIdentity;
  } catch {
    return null;
  }
}

async function signPayload(payload: string) {
  const data = new TextEncoder().encode(`${payload}.${getSessionSecret()}`);
  const digest = await crypto.subtle.digest("SHA-256", data);

  if (typeof Buffer !== "undefined") {
    return Buffer.from(digest).toString("base64url");
  }

  const bytes = Array.from(new Uint8Array(digest));
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function createSignedSessionValue(identity: AuthIdentity) {
  const payload = encodePayload(identity);
  const signature = await signPayload(payload);
  return `${payload}.${signature}`;
}

export async function readIdentityFromSessionValue(value: string | undefined) {
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = await signPayload(payload);
  if (signature !== expectedSignature) {
    return null;
  }

  return decodePayload(payload);
}

export function canAccessPath(role: AppRole, pathname: string): boolean {
  if (pathname.startsWith("/setup")) {
    return role === "ADMIN";
  }

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/scheduler") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/ai-assistant")
  ) {
    return role === "ADMIN" || role === "COORDINATOR";
  }

  if (pathname.startsWith("/published-timetable")) {
    return true;
  }

  return true;
}

export function roleLabel(role: AppRole): string {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "COORDINATOR":
      return "Coordinator";
    case "FACULTY":
      return "Faculty";
    case "STUDENT":
      return "Student";
    default:
      return role;
  }
}
