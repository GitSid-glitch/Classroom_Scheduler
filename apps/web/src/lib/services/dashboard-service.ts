import {
  courseOfferings,
  dashboardSnapshot,
  rooms,
  sections,
  teachers,
} from "@/lib/mock-data/university";
import type { DashboardSnapshot } from "@/types/domain";

interface PortfolioSummary {
  roomCount: number;
  teacherCount: number;
  sectionCount: number;
  offeringCount: number;
}

export class DashboardService {
  public getSnapshot(): DashboardSnapshot {
    return dashboardSnapshot;
  }

  public getPortfolioSummary(): PortfolioSummary {
    return {
      roomCount: rooms.length,
      teacherCount: teachers.length,
      sectionCount: sections.length,
      offeringCount: courseOfferings.length,
    };
  }
}
