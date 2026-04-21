export type AppRole = "ADMIN" | "COORDINATOR" | "FACULTY" | "STUDENT";

export interface AuthIdentity {
  username: string;
  displayName: string;
  role: AppRole;
}

export const authCookieKeys = {
  username: "scheduler_username",
  displayName: "scheduler_display_name",
  role: "scheduler_role",
} as const;

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
