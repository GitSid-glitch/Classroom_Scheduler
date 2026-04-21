import { AppShell } from "@/components/layout/app-shell";
import { SummaryCards } from "@/components/setup/summary-cards";
import { SectionManager } from "@/components/setup/section-manager";
import { AcademicRepository } from "@/lib/repositories/academic-repository";

const repository = new AcademicRepository();

export default async function SectionsPage() {
  const sections = await repository.getSections();

  return (
    <AppShell
      eyebrow="Setup / Sections"
      title="Section and batch planning surface"
      description="Sections are a first-class unit in academic scheduling because student overlap and idle-gap quality depend on them."
    >
      <SummaryCards
        cards={[
          {
            label: "Sections",
            value: String(sections.length),
            detail: "Batches currently being scheduled.",
          },
          {
            label: "Total Students",
            value: String(sections.reduce((sum, section) => sum + section.size, 0)),
            detail: "Useful for aggregate capacity and utilization planning.",
          },
          {
            label: "Programs",
            value: String(new Set(sections.map((section) => section.program)).size),
            detail: "Supports department and curriculum breakdowns.",
          },
          {
            label: "Highest Semester",
            value: String(Math.max(...sections.map((section) => section.semester), 0)),
            detail: "Gives a quick sense of academic breadth covered.",
          },
        ]}
      />
      <SectionManager initialSections={sections} />
    </AppShell>
  );
}
