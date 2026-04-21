import { AppShell } from "@/components/layout/app-shell";
import { CourseManager } from "@/components/setup/course-manager";
import { SummaryCards } from "@/components/setup/summary-cards";
import { AcademicRepository } from "@/lib/repositories/academic-repository";

const repository = new AcademicRepository();

export default async function CoursesPage() {
  const offerings = await repository.getCourseOfferings();
  const teachers = await repository.getTeachers();
  const sections = await repository.getSections();

  return (
    <AppShell
      eyebrow="Setup / Courses"
      title="Course offerings that drive timetable generation"
      description="This is the core planning dataset: what needs to be scheduled, for whom, with what room type, and at what relative priority."
    >
      <SummaryCards
        cards={[
          {
            label: "Offerings",
            value: String(offerings.length),
            detail: "Sessions currently available for planning.",
          },
          {
            label: "Locked Anchors",
            value: String(offerings.filter((offering) => offering.isLocked).length),
            detail: "Fixed sessions should survive partial rescheduling.",
          },
          {
            label: "Teacher Constraints",
            value: String(
              offerings.filter((offering) => offering.teacherUnavailableDays.length > 0).length,
            ),
            detail: "Offerings with explicit faculty availability restrictions.",
          },
          {
            label: "Lab Sessions",
            value: String(offerings.filter((offering) => offering.deliveryType === "LAB").length),
            detail: "These depend on narrower room inventory.",
          },
        ]}
      />
      <CourseManager
        initialOfferings={offerings}
        teachers={teachers}
        sections={sections}
      />
    </AppShell>
  );
}
