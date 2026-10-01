import type { Equipment, MuscleGroup, SetType } from "@/generated/prisma/client";

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  CHEST: "Pecho",
  BACK: "Espalda",
  SHOULDERS: "Hombros",
  BICEPS: "Bíceps",
  TRICEPS: "Tríceps",
  LEGS: "Piernas",
  GLUTES: "Glúteos",
  CORE: "Core",
  FOREARMS: "Antebrazos",
  FULL_BODY: "Cuerpo completo",
  OTHER: "Otro",
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  BARBELL: "Barra",
  DUMBBELL: "Mancuernas",
  MACHINE: "Máquina",
  CABLE: "Polea",
  BODYWEIGHT: "Peso corporal",
  KETTLEBELL: "Kettlebell",
  BAND: "Banda",
  OTHER: "Otro",
};

export const SET_TYPE_LABELS: Record<SetType, string> = {
  WARMUP: "Calentamiento",
  NORMAL: "Normal",
  TOP_SET: "Top Set",
  BACK_OFF: "Back-off",
};

export const SET_TYPE_SHORT: Record<SetType, string> = {
  WARMUP: "Calent.",
  NORMAL: "Normal",
  TOP_SET: "Top",
  BACK_OFF: "Back-off",
};

export const WEEKDAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export function formatWeekdays(weekdays: number[]): string {
  return [...weekdays].sort((a, b) => a - b).map((d) => WEEKDAY_NAMES[d - 1]).join(", ");
}

export const MUSCLE_ORDER: MuscleGroup[] = [
  "CHEST",
  "BACK",
  "SHOULDERS",
  "BICEPS",
  "TRICEPS",
  "LEGS",
  "GLUTES",
  "CORE",
  "FOREARMS",
  "FULL_BODY",
  "OTHER",
];
