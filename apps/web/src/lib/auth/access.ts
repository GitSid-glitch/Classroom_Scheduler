export type AppRole = "ADMIN" | "COORDINATOR" | "FACULTY" | "STUDENT";

export interface AuthIdentity {
  username: string;
  displayName: string;
  role: AppRole;
  assignedTeacher?: string | null;
  assignedSection?: string | null;
}

export const authSessionCookieName = "scheduler_session";

function getSessionSecret() {
  const configuredSecret = process.env.AUTH_SESSION_SECRET;
  if (configuredSecret) return configuredSecret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SESSION_SECRET must be configured in production.");
  }
  return "local-development-only-change-before-deploy";
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
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));

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
  const payload = encodePayload({
    ...identity,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
  } as AuthIdentity);
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
  if (signature.length !== expectedSignature.length) {
    return null;
  }

  let mismatch = 0;
  for (let index = 0; index < signature.length; index += 1) {
    mismatch |= signature.charCodeAt(index) ^ expectedSignature.charCodeAt(index);
  }
  if (mismatch !== 0) return null;

  const identity = decodePayload(payload) as (AuthIdentity & { expiresAt?: number }) | null;
  if (
    !identity ||
    !identity.username ||
    !identity.displayName ||
    !["ADMIN", "COORDINATOR", "FACULTY", "STUDENT"].includes(identity.role) ||
    typeof identity.expiresAt !== "number" ||
    identity.expiresAt <= Date.now()
  ) {
    return null;
  }
  return {
    username: identity.username,
    displayName: identity.displayName,
    role: identity.role,
    assignedTeacher: typeof identity.assignedTeacher === "string" ? identity.assignedTeacher : null,
    assignedSection: typeof identity.assignedSection === "string" ? identity.assignedSection : null,
  };
}

export function canAccessPath(role: AppRole, pathname: string): boolean {
  if (pathname === "/portal/student" || pathname.startsWith("/portal/student/")) return role === "STUDENT";
  if (pathname === "/portal/faculty" || pathname.startsWith("/portal/faculty/")) return role === "FACULTY";

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
