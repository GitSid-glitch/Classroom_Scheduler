import { AppConfig } from "@/lib/config/app-config";
import type { AuthIdentity } from "@/lib/auth/access";
import type {
  AuditEvent,
  CourseOffering,
  Room,
  RoomType,
  ScheduleExplanation,
  Section,
  Teacher,
} from "@/types/domain";

export interface ScheduleRunResponse {
  id: number;
  term: number;
  name: string;
  created_at: string;
  max_value: number;
  min_rooms: number;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "PUBLISHED" | "SUPERSEDED";
  published_at: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  reviewed_by: string;
  approval_note: string;
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
    subject_snapshot: string;
    teacher_snapshot: string;
    batch_snapshot: string;
    day_of_week_snapshot: CourseOffering["dayCode"];
    start_time_snapshot: string;
    end_time_snapshot: string;
    room_name_snapshot: string;
  }>;
}

export interface CsvImportResult {
  dry_run: boolean;
  created: number;
  updated: number;
  failed: number;
  rows: number;
}

export class SchedulerApiError extends Error {
  public readonly payload: unknown;

  public constructor(message: string, payload: unknown) {
    super(message);
    this.name = "SchedulerApiError";
    this.payload = payload;
  }
}

export interface AcademicTerm {
  id: number;
  name: string;
  starts_on: string | null;
  ends_on: string | null;
  is_current: boolean;
  created_at: string;
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
  term: number;
  subject: string;
  teacher: string;
  batch: string;
  fixed_room: number | null;
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

type ApiAuthIdentity = {
  username: string;
  display_name: string;
  role: AuthIdentity["role"];
};

type ApiAuditEvent = {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  summary: string;
  metadata: Record<string, string | number | boolean | null>;
  created_at: string;
};

function formatApiError(payload: unknown): string | null {
  if (typeof payload === "string") return payload;
  if (Array.isArray(payload)) {
    return payload.map(formatApiError).filter((value): value is string => Boolean(value)).join(" · ") || null;
  }
  if (!payload || typeof payload !== "object") return null;

  const entries = Object.entries(payload as Record<string, unknown>);
  const preferred = entries.find(([key]) => key === "error" || key === "detail");
  if (preferred) return formatApiError(preferred[1]);
  return entries
    .map(([field, value]) => {
      const message = formatApiError(value);
      if (!message) return null;
      const label = field.replaceAll("_", " ");
      return field === "non_field_errors" ? message : `${label}: ${message}`;
    })
    .filter((value): value is string => Boolean(value))
    .join(" · ") || null;
}

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

  public async listAcademicTerms(): Promise<AcademicTerm[]> {
    return this.request<AcademicTerm[]>("/academic-terms/");
  }

  public async createAcademicTerm(payload: {
    name: string;
    starts_on: string | null;
    ends_on: string | null;
  }): Promise<AcademicTerm> {
    return this.request<AcademicTerm>("/academic-terms/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  public async updateAcademicTerm(
    termId: number,
    payload: { name: string; starts_on: string | null; ends_on: string | null },
  ): Promise<AcademicTerm> {
    return this.request<AcademicTerm>(`/academic-terms/${termId}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  public async activateAcademicTerm(termId: number): Promise<AcademicTerm> {
    return this.request<AcademicTerm>(`/academic-terms/${termId}/activate/`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  public async copyAcademicTermCourses(
    destinationTermId: number,
    sourceTermId: number,
  ): Promise<{ created: number; skipped: number; source: string; destination: string }> {
    return this.request(`/academic-terms/${destinationTermId}/copy-courses/`, {
      method: "POST",
      body: JSON.stringify({ source_term_id: sourceTermId }),
    });
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

  public async uploadRoomsCsv(file: File, dryRun = false, headerMapping?: Record<string, string>): Promise<CsvImportResult> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("dry_run", String(dryRun));
    if (headerMapping) formData.append("header_mapping", JSON.stringify(headerMapping));

    return this.request("/rooms/upload/", {
      method: "POST",
      body: formData,
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
    fixedRoomId?: string | null;
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
        fixed_room: payload.fixedRoomId ? Number(payload.fixedRoomId) : null,
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
      fixedRoomId?: string | null;
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
        fixed_room: payload.fixedRoomId ? Number(payload.fixedRoomId) : null,
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

  public async uploadCourseOfferingsCsv(
    file: File,
    dryRun = false,
    headerMapping?: Record<string, string>,
  ): Promise<CsvImportResult> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("dry_run", String(dryRun));
    if (headerMapping) formData.append("header_mapping", JSON.stringify(headerMapping));

    return this.request("/classes/upload/", {
      method: "POST",
      body: formData,
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

  public async submitScheduleForApproval(scheduleId: number): Promise<ScheduleRunResponse> {
    return this.request<ScheduleRunResponse>(`/schedules/${scheduleId}/submit_for_approval/`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  public async approveSchedule(scheduleId: number, note = ""): Promise<ScheduleRunResponse> {
    return this.request<ScheduleRunResponse>(`/schedules/${scheduleId}/approve/`, {
      method: "POST",
      body: JSON.stringify({ note }),
    });
  }

  public async requestScheduleChanges(scheduleId: number, note: string): Promise<ScheduleRunResponse> {
    return this.request<ScheduleRunResponse>(`/schedules/${scheduleId}/request_changes/`, {
      method: "POST",
      body: JSON.stringify({ note }),
    });
  }

  public async reviseSchedule(scheduleId: number): Promise<ScheduleRunResponse> {
    return this.request<ScheduleRunResponse>(`/schedules/${scheduleId}/revise/`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  public async restoreSchedule(scheduleId: number): Promise<ScheduleRunResponse> {
    return this.request<ScheduleRunResponse>(`/schedules/${scheduleId}/restore/`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  public async moveScheduleAssignment(
    scheduleId: number,
    assignmentId: number,
    placement: {
      day_of_week: CourseOffering["dayCode"];
      start_time: string;
      end_time: string;
      room: number;
    },
  ): Promise<ScheduleRunResponse> {
    return this.request<ScheduleRunResponse>(`/schedules/${scheduleId}/move_assignment/`, {
      method: "POST",
      body: JSON.stringify({ assignment_id: assignmentId, ...placement }),
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
    source?: "rules" | "groq";
    model?: string;
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

  public async getAuditEvents(): Promise<AuditEvent[]> {
    const payload = await this.request<ApiAuditEvent[]>("/audit-events/");
    return payload.map((event) => ({
      id: String(event.id),
      entityType: event.entity_type,
      entityId: event.entity_id,
      action: event.action,
      summary: event.summary,
      createdAt: event.created_at,
      metadata: event.metadata ?? {},
    }));
  }

  public getScheduleExportUrl(scheduleId: number): string {
    return `/api/backend/schedules/${scheduleId}/export_csv/`;
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

  public async uploadTeachersCsv(
    file: File,
    dryRun = false,
    headerMapping?: Record<string, string>,
  ): Promise<CsvImportResult> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("dry_run", String(dryRun));
    if (headerMapping) formData.append("header_mapping", JSON.stringify(headerMapping));

    return this.request("/teachers/upload/", {
      method: "POST",
      body: formData,
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

  public async uploadSectionsCsv(
    file: File,
    dryRun = false,
    headerMapping?: Record<string, string>,
  ): Promise<CsvImportResult> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("dry_run", String(dryRun));
    if (headerMapping) formData.append("header_mapping", JSON.stringify(headerMapping));

    return this.request("/sections/upload/", {
      method: "POST",
      body: formData,
    });
  }

  public async authenticateUser(payload: {
    username: string;
    password: string;
  }): Promise<AuthIdentity> {
    const identity = await this.request<ApiAuthIdentity>("/auth/login/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      username: identity.username,
      displayName: identity.display_name,
      role: identity.role,
    };
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const isBrowser = typeof window !== "undefined";
    const headers = new Headers(init?.headers);
    if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (!isBrowser && process.env.BACKEND_SERVICE_TOKEN) {
      headers.set("X-Scheduler-Service-Token", process.env.BACKEND_SERVICE_TOKEN);
    }
    const baseUrl = isBrowser ? "/api/backend" : this.config.backendBaseUrl;

    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      let detail = `API request failed: ${response.status} ${response.statusText}`;
      let payload: unknown = null;

      try {
        payload = (await response.json()) as unknown;
      } catch {
        // Keep the status-based message when the API did not return JSON.
      }
      detail = formatApiError(payload) ?? detail;
      throw new SchedulerApiError(detail, payload);
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
      fixedRoomId: session.fixed_room ? String(session.fixed_room) : null,
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
