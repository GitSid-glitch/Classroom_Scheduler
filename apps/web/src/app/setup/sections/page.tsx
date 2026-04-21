import { AppShell } from "@/components/layout/app-shell";
import { EntityTable } from "@/components/setup/entity-table";
import { SummaryCards } from "@/components/setup/summary-cards";
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

      <EntityTable
        title="Academic sections"
        description="This should eventually pair with student-experience analytics such as idle gaps, lecture density, and lab clustering."
        items={sections}
        columns={[
          { key: "name", header: "Section", render: (section) => section.name },
          { key: "program", header: "Program", render: (section) => section.program },
          { key: "semester", header: "Semester", render: (section) => section.semester },
          { key: "size", header: "Size", render: (section) => section.size },
        ]}
      />
    </AppShell>
  );
}
