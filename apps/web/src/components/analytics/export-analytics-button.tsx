"use client";

interface ExportAnalyticsButtonProps {
  analytics: {
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
  };
}

export function ExportAnalyticsButton({ analytics }: ExportAnalyticsButtonProps) {
  function handleExport() {
    const blob = new Blob([JSON.stringify(analytics, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "analytics-snapshot.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="rounded-full bg-sky-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-sky-200"
    >
      Export analytics
    </button>
  );
}
