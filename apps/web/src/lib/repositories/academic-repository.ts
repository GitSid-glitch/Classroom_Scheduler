import { courseOfferings, rooms, sections, teachers } from "@/lib/mock-data/university";
import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";
import type { CourseOffering, Room, Section, Teacher } from "@/types/domain";

export class AcademicRepository {
  private readonly apiClient: SchedulerApiClient;

  public constructor(apiClient: SchedulerApiClient = new SchedulerApiClient()) {
    this.apiClient = apiClient;
  }

  public async getRooms(): Promise<Room[]> {
    try {
      const payload = await this.apiClient.getRooms();
      return payload.length > 0 ? payload : rooms;
    } catch {
      return rooms;
    }
  }

  public async getTeachers(): Promise<Teacher[]> {
    try {
      const payload = await this.apiClient.getTeachers();
      return payload.length > 0 ? payload : teachers;
    } catch {
      return teachers;
    }
  }

  public async getSections(): Promise<Section[]> {
    try {
      const payload = await this.apiClient.getSections();
      return payload.length > 0 ? payload : sections;
    } catch {
      return sections;
    }
  }

  public async getCourseOfferings(): Promise<CourseOffering[]> {
    try {
      const payload = await this.apiClient.getCourseOfferings();
      return payload.length > 0 ? payload : courseOfferings;
    } catch {
      return courseOfferings;
    }
  }
}
