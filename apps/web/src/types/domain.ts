export type RoomType = "THEORY" | "LAB" | "AUDITORIUM";

export type DayCode = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";

export interface Room {
  id: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  roomType: RoomType;
  features: string[];
  isActive: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  department: string;
  maxDailyLoad: number;
  unavailableDayCodes: DayCode[];
}

export interface Section {
  id: string;
  name: string;
  program: string;
  semester: number;
  size: number;
}

export interface CourseOffering {
  id: string;
  courseCode: string;
  title: string;
  department: string;
  teacherId: string;
  teacherRecordId?: string | null;
  teacherName?: string;
  sectionId: string;
  sectionRecordId?: string | null;
  sectionName?: string;
  dayCode: DayCode;
  startTime: string;
  endTime: string;
  requiredCapacity: number;
  requiredRoomType: RoomType | "ANY";
  deliveryType: "LECTURE" | "LAB" | "TUTORIAL";
  priorityScore: number;
  isLocked: boolean;
  teacherUnavailableDays: DayCode[];
  requiredFeatures: string[];
}

export interface ScheduleExplanation {
  type: string;
  message: string;
  class_session?: number;
}

export interface SchedulingInsight {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
}

export interface SchedulingMetric {
  label: string;
  value: string;
  change: string;
}

export interface DashboardSnapshot {
  metrics: SchedulingMetric[];
  insights: SchedulingInsight[];
}
