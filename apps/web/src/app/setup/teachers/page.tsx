import { AppShell } from "@/components/layout/app-shell";
import { SummaryCards } from "@/components/setup/summary-cards";
import { TeacherManager } from "@/components/setup/teacher-manager";
import { AcademicRepository } from "@/lib/repositories/academic-repository";

const repository = new AcademicRepository();

export default async function TeachersPage() {
  const teachers = await repository.getTeachers();

  return (
    <AppShell
      eyebrow="Setup / Teachers"
      title="Faculty workload and availability controls"
      description="A real scheduling product needs teacher-level constraints so the timetable engine can reason about fairness, overload, and non-working days."
    >
      <SummaryCards
        cards={[
          {
            label: "Faculty Profiles",
            value: String(teachers.length),
            detail: "Teachers participating in the current academic term.",
          },
          {
            label: "Avg Max Daily Load",
            value:
              teachers.length > 0
                ? (
                    teachers.reduce((sum, teacher) => sum + teacher.maxDailyLoad, 0) /
                    teachers.length
                  ).toFixed(1)
                : "0",
            detail: "Useful for fairness and fatigue-aware scheduling.",
          },
          {
            label: "Constrained Teachers",
            value: String(
              teachers.filter((teacher) => teacher.unavailableDayCodes.length > 0).length,
            ),
            detail: "These profiles already include explicit availability rules.",
          },
          {
            label: "Departments",
            value: String(new Set(teachers.map((teacher) => teacher.department)).size),
            detail: "Supports department-scoped planning and analytics.",
          },
        ]}
      />
      <TeacherManager initialTeachers={teachers} />
    </AppShell>
  );
}
