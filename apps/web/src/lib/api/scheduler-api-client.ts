import { AppConfig } from "@/lib/config/app-config";
import type {
  CourseOffering,
  Room,
  RoomType,
  ScheduleExplanation,
  Section,
  Teacher,
} from "@/types/domain";

interface ScheduleRunResponse {
  id: number;
  name: string;
  created_at: string;
  max_value: number;
  min_rooms: number;
  status: "DRAFT" | "PUBLISHED";
  published_at: string | null;
  scheduled_class_ids: number[];
  unscheduled: Array<{
    class_session: number;
    subject: string;
    teacher: string;
    batch: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    reason: string;
  }>;
  conflicts: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    title: string;
    description: string;
  }>;
  explanations: ScheduleExplanation[];
  assignments: Array<{
    id: number;
    class_session: number;
    room: number;
    schedule: number;
  }>;
}

type ApiRoom = {
  id: number;
  name: string;
  capacity: number;
  room_type: "THEORY" | "LAB";
  features: string;
};

type ApiClassSession = {
  id: number;
  subject: string;
  teacher: string;
  batch: string;
  teacher_record: number | null;
  section_record: number | null;
  day_of_week: CourseOffering["dayCode"];
  start_time: string;
  end_time: string;
  required_capacity: number;
  required_type: CourseOffering["requiredRoomType"];
  value: number;
  teacher_unavailable_days: string;
  is_locked: boolean;
  required_features: string;
};

type ApiTeacher = {
  id: number;
  name: string;
  department: string;
  max_daily_load: number;
  unavailable_days: string;
};

type ApiSection = {
  id: number;
  name: string;
  program: string;
  semester: number;
  size: number;
};

export class SchedulerApiClient {
  private readonly config: AppConfig;

  public constructor(config: AppConfig = new AppConfig()) {
    this.config = config;
  }

  public async getRooms(): Promise<Room[]> {
    const payload = await this.request<ApiRoom[]>("/rooms/");

    return payload.map((room) => ({
      id: String(room.id),
      name: room.name,
      building: "Main Campus",
      floor: 1,
      capacity: room.capacity,
      roomType: room.room_type,
      features: room.features
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      isActive: true,
    }));
  }

  public async createRoom(payload: {
    name: string;
    capacity: number;
    roomType: Extract<RoomType, "THEORY" | "LAB">;
    features: string[];
  }): Promise<Room> {
    const room = await this.request<ApiRoom>("/rooms/", {
      method: "POST",
      body: JSON.stringify({
        name: payload.name,
        capacity: payload.capacity,
        room_type: payload.roomType,
        features: payload.features.join(","),
      }),
    });

    return this.mapRoom(room);
  }

  public async updateRoom(
    roomId: string,
    payload: {
      name: string;
      capacity: number;
      roomType: Extract<RoomType, "THEORY" | "LAB">;
      features: string[];
    },
  ): Promise<Room> {
    const room = await this.request<ApiRoom>(`/rooms/${roomId}/`, {
      method: "PUT",
      body: JSON.stringify({
        name: payload.name,
        capacity: payload.capacity,
        room_type: payload.roomType,
        features: payload.features.join(","),
      }),
    });

    return this.mapRoom(room);
  }

  public async deleteRoom(roomId: string): Promise<void> {
    await this.request<void>(`/rooms/${roomId}/`, {
      method: "DELETE",
    });
  }

  public async getCourseOfferings(): Promise<CourseOffering[]> {
    const payload = await this.request<ApiClassSession[]>("/classes/");

    return payload.map((session) => this.mapCourseOffering(session));
  }

  public async createCourseOffering(payload: {
    title: string;
    teacher: string;
    teacherRecordId?: string | null;
    batch: string;
    sectionRecordId?: string | null;
    dayCode: CourseOffering["dayCode"];
    startTime: string;
    endTime: string;
    requiredCapacity: number;
    requiredRoomType: CourseOffering["requiredRoomType"];
    priorityScore: number;
    isLocked: boolean;
    teacherUnavailableDays: CourseOffering["teacherUnavailableDays"];
    requiredFeatures: string[];
  }): Promise<CourseOffering> {
    const session = await this.request<ApiClassSession>("/classes/", {
      method: "POST",
      body: JSON.stringify({
        subject: payload.title,
        teacher: payload.teacher,
        batch: payload.batch,
        teacher_record: payload.teacherRecordId ? Number(payload.teacherRecordId) : null,
        section_record: payload.sectionRecordId ? Number(payload.sectionRecordId) : null,
        day_of_week: payload.dayCode,
        start_time: payload.startTime,
        end_time: payload.endTime,
        required_capacity: payload.requiredCapacity,
        required_type: payload.requiredRoomType,
        value: payload.priorityScore,
        is_locked: payload.isLocked,
        teacher_unavailable_days: payload.teacherUnavailableDays.join(","),
        required_features: payload.requiredFeatures.join(","),
      }),
    });

    return this.mapCourseOffering(session);
  }

  public async updateCourseOffering(
    courseId: string,
    payload: {
      title: string;
      teacher: string;
      teacherRecordId?: string | null;
      batch: string;
      sectionRecordId?: string | null;
      dayCode: CourseOffering["dayCode"];
      startTime: string;
      endTime: string;
      requiredCapacity: number;
      requiredRoomType: CourseOffering["requiredRoomType"];
      priorityScore: number;
      isLocked: boolean;
      teacherUnavailableDays: CourseOffering["teacherUnavailableDays"];
      requiredFeatures: string[];
    },
  ): Promise<CourseOffering> {
    const session = await this.request<ApiClassSession>(`/classes/${courseId}/`, {
      method: "PUT",
      body: JSON.stringify({
        subject: payload.title,
        teacher: payload.teacher,
        batch: payload.batch,
        teacher_record: payload.teacherRecordId ? Number(payload.teacherRecordId) : null,
        section_record: payload.sectionRecordId ? Number(payload.sectionRecordId) : null,
        day_of_week: payload.dayCode,
        start_time: payload.startTime,
        end_time: payload.endTime,
        required_capacity: payload.requiredCapacity,
        required_type: payload.requiredRoomType,
        value: payload.priorityScore,
        is_locked: payload.isLocked,
        teacher_unavailable_days: payload.teacherUnavailableDays.join(","),
        required_features: payload.requiredFeatures.join(","),
      }),
    });

    return this.mapCourseOffering(session);
  }

  public async deleteCourseOffering(courseId: string): Promise<void> {
    await this.request<void>(`/classes/${courseId}/`, {
      method: "DELETE",
    });
  }

  public async runOptimizedSchedule(): Promise<ScheduleRunResponse> {
    return this.request<ScheduleRunResponse>("/schedules/run_optimized/", {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  public async listSchedules(): Promise<ScheduleRunResponse[]> {
    return this.request<ScheduleRunResponse[]>("/schedules/");
  }

  public async publishSchedule(scheduleId: number): Promise<ScheduleRunResponse> {
    return this.request<ScheduleRunResponse>(`/schedules/${scheduleId}/publish/`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  public async unpublishSchedule(scheduleId: number): Promise<ScheduleRunResponse> {
    return this.request<ScheduleRunResponse>(`/schedules/${scheduleId}/unpublish/`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  public async analyzeScheduleInputs(): Promise<{
    conflicts: Array<{
      type: string;
      severity: "low" | "medium" | "high";
      title: string;
      description: string;
    }>;
  }> {
    return this.request("/schedules/analyze/");
  }

  public async getAssistantInsights(classSessionId?: string): Promise<{
    suggestion: {
      title: string;
      suggestion: string;
    };
    explanation: {
      class_session: number;
      subject: string;
      explanation: string;
      action_hint: string;
    } | null;
    explanations: ScheduleExplanation[];
  }> {
    const query = classSessionId ? `?class_session=${classSessionId}` : "";
    return this.request(`/schedules/assistant/${query}`);
  }

  public async getAnalytics(): Promise<{
    room_utilization: Array<{
      room_id: number;
      room_name: string;
      scheduled_minutes: number;
      utilization_score: number;
    }>;
    teacher_load: Array<{
      teacher: string;
      scheduled_sessions: number;
      scheduled_minutes: number;
    }>;
    quality: {
      coverage_ratio: number;
      value_capture_ratio: number;
      scheduled_count: number;
      unscheduled_count: number;
    };
  }> {
    return this.request("/schedules/analytics/");
  }

  public async getTeachers(): Promise<Teacher[]> {
    const payload = await this.request<ApiTeacher[]>("/teachers/");
    return payload.map((teacher) => ({
      id: String(teacher.id),
      name: teacher.name,
      department: teacher.department,
      maxDailyLoad: teacher.max_daily_load,
      unavailableDayCodes: teacher.unavailable_days
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean) as Teacher["unavailableDayCodes"],
    }));
  }

  public async getSections(): Promise<Section[]> {
    const payload = await this.request<ApiSection[]>("/sections/");
    return payload.map((section) => ({
      id: String(section.id),
      name: section.name,
      program: section.program,
      semester: section.semester,
      size: section.size,
    }));
  }

  public async createTeacher(payload: {
    name: string;
    department: string;
    maxDailyLoad: number;
    unavailableDayCodes: Teacher["unavailableDayCodes"];
  }): Promise<Teacher> {
    const teacher = await this.request<ApiTeacher>("/teachers/", {
      method: "POST",
      body: JSON.stringify({
        name: payload.name,
        department: payload.department,
        max_daily_load: payload.maxDailyLoad,
        unavailable_days: payload.unavailableDayCodes.join(","),
      }),
    });

    return {
      id: String(teacher.id),
      name: teacher.name,
      department: teacher.department,
      maxDailyLoad: teacher.max_daily_load,
      unavailableDayCodes: teacher.unavailable_days
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean) as Teacher["unavailableDayCodes"],
    };
  }

  public async updateTeacher(
    teacherId: string,
    payload: {
      name: string;
      department: string;
      maxDailyLoad: number;
      unavailableDayCodes: Teacher["unavailableDayCodes"];
    },
  ): Promise<Teacher> {
    const teacher = await this.request<ApiTeacher>(`/teachers/${teacherId}/`, {
      method: "PUT",
      body: JSON.stringify({
        name: payload.name,
        department: payload.department,
        max_daily_load: payload.maxDailyLoad,
        unavailable_days: payload.unavailableDayCodes.join(","),
      }),
    });

    return {
      id: String(teacher.id),
      name: teacher.name,
      department: teacher.department,
      maxDailyLoad: teacher.max_daily_load,
      unavailableDayCodes: teacher.unavailable_days
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean) as Teacher["unavailableDayCodes"],
    };
  }

  public async deleteTeacher(teacherId: string): Promise<void> {
    await this.request<void>(`/teachers/${teacherId}/`, {
      method: "DELETE",
    });
  }

  public async createSection(payload: {
    name: string;
    program: string;
    semester: number;
    size: number;
  }): Promise<Section> {
    const section = await this.request<ApiSection>("/sections/", {
      method: "POST",
      body: JSON.stringify({
        name: payload.name,
        program: payload.program,
        semester: payload.semester,
        size: payload.size,
      }),
    });

    return {
      id: String(section.id),
      name: section.name,
      program: section.program,
      semester: section.semester,
      size: section.size,
    };
  }

  public async updateSection(
    sectionId: string,
    payload: {
      name: string;
      program: string;
      semester: number;
      size: number;
    },
  ): Promise<Section> {
    const section = await this.request<ApiSection>(`/sections/${sectionId}/`, {
      method: "PUT",
      body: JSON.stringify({
        name: payload.name,
        program: payload.program,
        semester: payload.semester,
        size: payload.size,
      }),
    });

    return {
      id: String(section.id),
      name: section.name,
      program: section.program,
      semester: section.semester,
      size: section.size,
    };
  }

  public async deleteSection(sectionId: string): Promise<void> {
    await this.request<void>(`/sections/${sectionId}/`, {
      method: "DELETE",
    });
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.config.backendBaseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private mapRoom(room: ApiRoom): Room {
    return {
      id: String(room.id),
      name: room.name,
      building: "Main Campus",
      floor: 1,
      capacity: room.capacity,
      roomType: room.room_type,
      features: room.features
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      isActive: true,
    };
  }

  private mapCourseOffering(session: ApiClassSession): CourseOffering {
    return {
      id: String(session.id),
      courseCode: session.subject.slice(0, 8).toUpperCase(),
      title: session.subject,
      department: "Academic Scheduling",
      teacherId: session.teacher,
      teacherRecordId: session.teacher_record ? String(session.teacher_record) : null,
      teacherName: session.teacher,
      sectionId: session.batch,
      sectionRecordId: session.section_record ? String(session.section_record) : null,
      sectionName: session.batch,
      dayCode: session.day_of_week,
      startTime: session.start_time,
      endTime: session.end_time,
      requiredCapacity: session.required_capacity,
      requiredRoomType: session.required_type,
      deliveryType: session.required_type === "LAB" ? "LAB" : "LECTURE",
      priorityScore: session.value,
      isLocked: session.is_locked,
      teacherUnavailableDays: session.teacher_unavailable_days
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean) as CourseOffering["teacherUnavailableDays"],
      requiredFeatures: session.required_features
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    };
  }
}

export type { ScheduleRunResponse };
