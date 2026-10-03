import { getSettings } from "@/lib/settings";
import { listSessionsForMonth } from "@/lib/workouts";
import { dayKey, monthKey, nowInTz } from "@/lib/dates";
import GymTabs from "@/components/GymTabs";
import GymCalendar from "@/components/GymCalendar";

export const dynamic = "force-dynamic";

export default async function GimnasioCalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const settings = await getSettings();
  const today = nowInTz(settings.timezone);
  const targetMonthKey = month && /^\d{4}-\d{2}$/.test(month) ? month : monthKey(today);

  const sessionsByDate = await listSessionsForMonth(targetMonthKey);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-[26px] font-bold tracking-tight text-text">Gimnasio</h1>
        <p className="text-sm text-text-muted">Tus rutinas y entrenamientos.</p>
      </header>

      <GymTabs active="calendario" />

      <GymCalendar
        monthKey={targetMonthKey}
        todayKey={dayKey(today)}
        sessionsByDate={Object.fromEntries(sessionsByDate)}
      />
    </div>
  );
}
