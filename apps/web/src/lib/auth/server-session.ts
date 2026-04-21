import { cookies } from "next/headers";

import { readIdentityFromSessionValue } from "@/lib/auth/access";

export async function getCurrentIdentity() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get("scheduler_session")?.value;
  return readIdentityFromSessionValue(sessionValue);
}
