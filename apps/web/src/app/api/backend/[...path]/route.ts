import { cookies } from "next/headers";

import { AppConfig } from "@/lib/config/app-config";
import type { AppRole } from "@/lib/auth/access";
import { authSessionCookieName, readIdentityFromSessionValue } from "@/lib/auth/access";

const config = new AppConfig();
const serviceToken = () => process.env.BACKEND_SERVICE_TOKEN ?? "";
const coordinatorRoles: AppRole[] = ["ADMIN", "COORDINATOR"];
const consumerRoles: AppRole[] = ["FACULTY", "STUDENT"];

type RouteContext = { params: Promise<{ path: string[] }> };
type SchedulePayload = {
  id: number;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "PUBLISHED" | "SUPERSEDED";
  submitted_at?: string | null;
  approved_at?: string | null;
  reviewed_by?: string;
  approval_note?: string;
  assignments: Array<{ class_session: number; room: number }>;
};

function publicSchedule(schedule: SchedulePayload) {
  const published = { ...schedule };
  delete published.submitted_at;
  delete published.approved_at;
  delete published.reviewed_by;
  delete published.approval_note;
  return published;
}

function isAllowed(role: AppRole, method: string, path: string[]) {
  const resource = path[0];

  if (resource === "academic-terms") {
    if (method === "GET" && (path.length === 1 || (path.length === 2 && /^\d+$/.test(path[1])))) return true;
    if (path.length === 3 && path[2] === "activate") return method === "POST" && role === "ADMIN";
    if (path.length === 3 && path[2] === "copy-courses") return method === "POST" && role === "ADMIN";
    return role === "ADMIN" && (
      (method === "POST" && path.length === 1) ||
      (["PUT", "PATCH", "DELETE"].includes(method) && path.length === 2 && /^\d+$/.test(path[1]))
    );
  }

  if (["rooms", "teachers", "sections"].includes(resource)) {
    if (method !== "GET") return role === "ADMIN";
    if (["teachers", "sections"].includes(resource)) return coordinatorRoles.includes(role);
    return true;
  }

  if (resource === "classes") {
    if (method === "GET") return true;
    if (["PUT", "PATCH"].includes(method)) return coordinatorRoles.includes(role);
    return role === "ADMIN";
  }

  if (resource === "audit-events") {
    return method === "GET" && coordinatorRoles.includes(role);
  }

  if (resource === "assignments") {
    return coordinatorRoles.includes(role) && (method === "GET" || role === "ADMIN");
  }

  if (resource !== "schedules") return false;

  if (["assistant", "analytics", "analyze"].includes(path[1])) {
    return method === "GET" && coordinatorRoles.includes(role);
  }
  if (["run_optimized", "run_heap", "run_dp"].includes(path[1])) {
    return method === "POST" && coordinatorRoles.includes(role);
  }
  if (path.length === 3 && ["submit_for_approval", "revise", "move_assignment"].includes(path[2])) {
    return method === "POST" && coordinatorRoles.includes(role);
  }
  if (path.length === 3 && ["approve", "request_changes", "publish", "unpublish", "restore"].includes(path[2])) {
    return method === "POST" && role === "ADMIN";
  }
  if (path.length === 3 && path[2] === "export_csv") return method === "GET";
  if (method === "GET" && (path.length === 1 || (path.length === 2 && /^\d+$/.test(path[1])))) return true;
  return coordinatorRoles.includes(role) && method === "POST" && path.length === 1;
}

function backendUrl(path: string, search: string) {
  return `${config.backendBaseUrl}/${path}/${search}`;
}

async function callBackend(path: string, search = "", init: RequestInit = {}) {
  const token = serviceToken();
  if (!token) throw new Error("Backend service authentication is not configured.");
  const headers = new Headers(init.headers);
  headers.set("X-Scheduler-Service-Token", token);
  return fetch(backendUrl(path, search), { ...init, headers, cache: "no-store" });
}

async function getPublishedSchedules(): Promise<SchedulePayload[]> {
  const response = await callBackend("schedules");
  if (!response.ok) return [];
  const payload = (await response.json()) as SchedulePayload[];
  return payload.filter((schedule) => schedule.status === "PUBLISHED");
}

async function filterConsumerResponse(path: string[], response: Response) {
  if (!response.ok) return response;
  const schedules = await getPublishedSchedules();
  if (path[0] === "schedules") {
    const scheduleId = path[1] && /^\d+$/.test(path[1]) ? Number(path[1]) : null;
    const published = scheduleId
      ? schedules.find((schedule) => schedule.id === scheduleId)
      : schedules;
    if (!published) return Response.json({ detail: "Not found." }, { status: 404 });
    return Response.json(Array.isArray(published) ? published.map(publicSchedule) : publicSchedule(published));
  }

  const ids = new Set(
    schedules.flatMap((schedule) =>
      schedule.assignments.map((assignment) => path[0] === "classes" ? assignment.class_session : assignment.room),
    ),
  );
  const payload = (await response.json()) as { id?: number } | Array<{ id: number }>;
  if (Array.isArray(payload)) {
    return Response.json(payload.filter((row) => ids.has(row.id)));
  }
  if (typeof payload.id === "number" && ids.has(payload.id)) {
    return Response.json(payload);
  }
  return Response.json({ detail: "Not found." }, { status: 404 });
}

async function handle(request: Request, context: RouteContext) {
  const identity = await readIdentityFromSessionValue(
    (await cookies()).get(authSessionCookieName)?.value,
  );
  if (!identity) return Response.json({ error: "Sign in to continue." }, { status: 401 });

  const { path: segments } = await context.params;
  if (!segments.length || segments.some((segment) => !/^[A-Za-z0-9_-]+$/.test(segment))) {
    return Response.json({ error: "Invalid API path." }, { status: 400 });
  }
  const path = segments.join("/");
  const method = request.method.toUpperCase();
  if (!isAllowed(identity.role, method, segments)) {
    return Response.json({ error: "You do not have permission to perform this action." }, { status: 403 });
  }
  const url = new URL(request.url);
  const search = url.search;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  headers.set("X-Scheduler-Actor", identity.username);
  headers.set("X-Scheduler-Role", identity.role);
  const body = ["GET", "HEAD"].includes(method) ? undefined : await request.arrayBuffer();

  try {
    const response = await callBackend(path, search, {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(20_000),
    });

    if (consumerRoles.includes(identity.role) && method === "GET") {
      if (path[0] === "schedules" && (path.length === 1 || (path.length === 2 && /^\d+$/.test(path[1])))) {
        return filterConsumerResponse(segments, response);
      }
      if (["classes", "rooms"].includes(path[0]) && (path.length === 1 || (path.length === 2 && /^\d+$/.test(path[1])))) {
        return filterConsumerResponse(segments, response);
      }
      if (path[0] === "schedules" && path[2] === "export_csv") {
        const published = (await getPublishedSchedules()).some((schedule) => schedule.id === Number(path[1]));
        if (!published) return Response.json({ detail: "Not found." }, { status: 404 });
      }
    }

    const responseHeaders = new Headers();
    for (const name of ["content-type", "content-disposition", "cache-control"]) {
      const value = response.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new Response(await response.arrayBuffer(), {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json({ error: "The scheduling service is temporarily unavailable." }, { status: 502 });
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
