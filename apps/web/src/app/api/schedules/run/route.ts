import { NextResponse } from "next/server";

import { canAccessPath } from "@/lib/auth/access";
import { getCurrentIdentity } from "@/lib/auth/server-session";
import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";

const apiClient = new SchedulerApiClient();

export async function POST() {
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessPath(identity.role, "/scheduler/run")) {
    return NextResponse.json({ error: "You do not have permission to generate schedules." }, { status: 403 });
  }

  try {
    const schedule = await apiClient.runOptimizedSchedule();
    return NextResponse.json({ id: schedule.id, status: schedule.status }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Schedule generation failed." },
      { status: 502 },
    );
  }
}
