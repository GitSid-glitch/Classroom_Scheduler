import { AppShell } from "@/components/layout/app-shell";
import { RoomManager } from "@/components/setup/room-manager";
import { SummaryCards } from "@/components/setup/summary-cards";
import { AcademicRepository } from "@/lib/repositories/academic-repository";

const repository = new AcademicRepository();

export default async function RoomsPage() {
  const rooms = await repository.getRooms();
  const activeRooms = rooms.filter((room) => room.isActive);
  const labRooms = rooms.filter((room) => room.roomType === "LAB");

  return (
    <AppShell
      eyebrow="Setup / Rooms"
      title="Room inventory with operational metadata"
      description="Universities need more than room names and capacities. This structure leaves space for buildings, features, active status, and future blackout windows."
    >
      <SummaryCards
        cards={[
          {
            label: "Tracked Rooms",
            value: String(rooms.length),
            detail: "Rooms available to the scheduling engine.",
          },
          {
            label: "Active Inventory",
            value: String(activeRooms.length),
            detail: "Rooms currently eligible for scheduling runs.",
          },
          {
            label: "Lab Capacity",
            value: String(labRooms.length),
            detail: "Critical for practical and AI/ML lab scheduling.",
          },
          {
            label: "Feature-aware Rooms",
            value: String(rooms.filter((room) => room.features.length > 0).length),
            detail: "Supports projector, smart-board, and equipment constraints.",
          },
        ]}
      />
      <RoomManager initialRooms={rooms} />
    </AppShell>
  );
}
