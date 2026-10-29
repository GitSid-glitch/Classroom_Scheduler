import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";
import type { CourseOffering, Room, Section, Teacher } from "@/types/domain";

export class AcademicRepository {
  private readonly apiClient: SchedulerApiClient;

  public constructor(apiClient: SchedulerApiClient = new SchedulerApiClient()) {
    this.apiClient = apiClient;
  }

  public async getRooms(): Promise<Room[]> {
    try {
      return await this.apiClient.getRooms();
    } catch {
      return [];
    }
  }

  public async getTeachers(): Promise<Teacher[]> {
    try {
      return await this.apiClient.getTeachers();
    } catch {
      return [];
    }
  }

  public async getSections(): Promise<Section[]> {
    try {
      return await this.apiClient.getSections();
    } catch {
      return [];
    }
  }

  public async getCourseOfferings(): Promise<CourseOffering[]> {
    try {
      return await this.apiClient.getCourseOfferings();
    } catch {
      return [];
    }
  }
}
