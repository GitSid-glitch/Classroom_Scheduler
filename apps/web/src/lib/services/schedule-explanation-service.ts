import { courseOfferings, rooms, teachers } from "@/lib/mock-data/university";

export interface ExplanationCard {
  heading: string;
  body: string;
}

export class ScheduleExplanationService {
  public buildHighlights(): ExplanationCard[] {
    const lockedCount = courseOfferings.filter((offering) => offering.isLocked).length;
    const labCount = rooms.filter((room) => room.roomType === "LAB").length;
    const fridayRestrictedTeachers = teachers.filter((teacher) =>
      teacher.unavailableDayCodes.includes("FRI"),
    ).length;

    return [
      {
        heading: "Constraint-aware scheduling",
        body: `${lockedCount} sessions are treated as fixed anchors before auto-allocation runs, which mirrors how coordinators protect non-negotiable classes.`,
      },
      {
        heading: "Capacity and room-type matching",
        body: `The engine can reason over ${labCount} active lab spaces separately from lecture rooms, which is essential for university-grade scheduling.`,
      },
      {
        heading: "AI-ready decision summaries",
        body: `${fridayRestrictedTeachers} teachers already carry explicit availability constraints, which gives the future AI layer structured facts to explain scheduling tradeoffs.`,
      },
    ];
  }
}
