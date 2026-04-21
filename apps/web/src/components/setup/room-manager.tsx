"use client";

import { useState, useTransition } from "react";

import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";
import type { Room } from "@/types/domain";

const apiClient = new SchedulerApiClient();

interface RoomManagerProps {
  initialRooms: Room[];
}

export function RoomManager({ initialRooms }: RoomManagerProps) {
  const [rooms, setRooms] = useState(initialRooms);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    capacity: "40",
    roomType: "THEORY" as "THEORY" | "LAB",
    features: "",
  });

  function resetForm() {
    setForm({
      name: "",
      capacity: "40",
      roomType: "THEORY",
      features: "",
    });
    setEditingId(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const payload = {
          name: form.name,
          capacity: Number(form.capacity),
          roomType: form.roomType,
          features: form.features
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
        };

        if (editingId) {
          const updated = await apiClient.updateRoom(editingId, payload);
          setRooms((current) => current.map((room) => (room.id === editingId ? updated : room)));
        } else {
          const created = await apiClient.createRoom(payload);
          setRooms((current) => [...current, created]);
        }

        resetForm();
      } catch (submissionError) {
        setError(submissionError instanceof Error ? submissionError.message : "Failed to save room.");
      }
    });
  }

  function handleEdit(room: Room) {
    setEditingId(room.id);
    setForm({
      name: room.name,
      capacity: String(room.capacity),
      roomType: room.roomType === "LAB" ? "LAB" : "THEORY",
      features: room.features.join(", "),
    });
  }

  function handleDelete(roomId: string) {
    setError(null);

    startTransition(async () => {
      try {
        await apiClient.deleteRoom(roomId);
        setRooms((current) => current.filter((room) => room.id !== roomId));
        if (editingId === roomId) {
          resetForm();
        }
      } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : "Failed to delete room.");
      }
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
        <h2 className="text-2xl font-semibold text-stone-50">
          {editingId ? "Edit room" : "Add room"}
        </h2>
        <p className="mt-2 text-sm leading-7 text-stone-300">
          Manage schedulable rooms, their capacity, and required equipment metadata.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm text-stone-200">
            Room name
            <input
              className="rounded-2xl border border-stone-600 bg-stone-950 px-4 py-3 text-stone-50"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="A-101"
              required
            />
          </label>

          <label className="grid gap-2 text-sm text-stone-200">
            Capacity
            <input
              className="rounded-2xl border border-stone-600 bg-stone-950 px-4 py-3 text-stone-50"
              type="number"
              min="1"
              value={form.capacity}
              onChange={(event) =>
                setForm((current) => ({ ...current, capacity: event.target.value }))
              }
              required
            />
          </label>

          <label className="grid gap-2 text-sm text-stone-200">
            Room type
            <select
              className="rounded-2xl border border-stone-600 bg-stone-950 px-4 py-3 text-stone-50"
              value={form.roomType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  roomType: event.target.value as "THEORY" | "LAB",
                }))
              }
            >
              <option value="THEORY">THEORY</option>
              <option value="LAB">LAB</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm text-stone-200">
            Features
            <input
              className="rounded-2xl border border-stone-600 bg-stone-950 px-4 py-3 text-stone-50"
              value={form.features}
              onChange={(event) =>
                setForm((current) => ({ ...current, features: event.target.value }))
              }
              placeholder="projector, smart board"
            />
          </label>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:opacity-60"
            >
              {editingId ? "Save room" : "Create room"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-stone-500 px-5 py-3 text-sm font-semibold text-stone-100 transition hover:border-stone-300 hover:bg-white/5"
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-[1.75rem] border border-stone-800 bg-stone-950 p-6">
        <h2 className="text-2xl font-semibold text-stone-50">Room registry</h2>
        <div className="mt-5 grid gap-3">
          {rooms.map((room) => (
            <article
              key={room.id}
              className="rounded-[1.25rem] border border-stone-700 bg-stone-900/70 p-4"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-base font-semibold text-stone-50">{room.name}</p>
                  <p className="mt-1 text-sm text-stone-300">
                    {room.roomType} • Capacity {room.capacity}
                  </p>
                  <p className="mt-2 text-sm text-stone-400">
                    {room.features.length > 0 ? room.features.join(", ") : "Standard room"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(room)}
                    className="rounded-full border border-stone-500 px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-stone-300 hover:bg-white/5"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(room.id)}
                    disabled={isPending}
                    className="rounded-full border border-rose-400/40 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/10 disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
