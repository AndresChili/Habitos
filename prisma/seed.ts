import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, MuscleGroup, Equipment } from "../src/generated/prisma/client";

// Global exercise library (userId: null) — seeded once, available to every
// user. Idempotent: skips names that already exist as global exercises so
// this can be re-run safely after adding new entries to the list.
const EXERCISES: { name: string; primaryMuscle: MuscleGroup; secondaryMuscles?: MuscleGroup[]; equipment: Equipment }[] = [
  // Pecho
  { name: "Press banca", primaryMuscle: "CHEST", secondaryMuscles: ["TRICEPS"], equipment: "BARBELL" },
  { name: "Press banca inclinado", primaryMuscle: "CHEST", secondaryMuscles: ["SHOULDERS"], equipment: "BARBELL" },
  { name: "Press banca con mancuernas", primaryMuscle: "CHEST", equipment: "DUMBBELL" },
  { name: "Press inclinado con mancuernas", primaryMuscle: "CHEST", equipment: "DUMBBELL" },
  { name: "Aperturas con mancuernas", primaryMuscle: "CHEST", equipment: "DUMBBELL" },
  { name: "Press en máquina", primaryMuscle: "CHEST", equipment: "MACHINE" },
  { name: "Cruces en polea", primaryMuscle: "CHEST", equipment: "CABLE" },
  { name: "Fondos en paralelas", primaryMuscle: "CHEST", secondaryMuscles: ["TRICEPS"], equipment: "BODYWEIGHT" },

  // Espalda
  { name: "Jalón al pecho", primaryMuscle: "BACK", secondaryMuscles: ["BICEPS"], equipment: "CABLE" },
  { name: "Dominadas", primaryMuscle: "BACK", secondaryMuscles: ["BICEPS"], equipment: "BODYWEIGHT" },
  { name: "Remo con barra", primaryMuscle: "BACK", secondaryMuscles: ["BICEPS"], equipment: "BARBELL" },
  { name: "Remo con mancuerna", primaryMuscle: "BACK", equipment: "DUMBBELL" },
  { name: "Remo en máquina", primaryMuscle: "BACK", equipment: "MACHINE" },
  { name: "Remo en polea baja", primaryMuscle: "BACK", equipment: "CABLE" },
  { name: "Pullover", primaryMuscle: "BACK", secondaryMuscles: ["CHEST"], equipment: "DUMBBELL" },
  { name: "Peso muerto", primaryMuscle: "BACK", secondaryMuscles: ["LEGS", "GLUTES"], equipment: "BARBELL" },

  // Hombros
  { name: "Press militar", primaryMuscle: "SHOULDERS", secondaryMuscles: ["TRICEPS"], equipment: "BARBELL" },
  { name: "Press de hombros con mancuernas", primaryMuscle: "SHOULDERS", equipment: "DUMBBELL" },
  { name: "Elevaciones laterales", primaryMuscle: "SHOULDERS", equipment: "DUMBBELL" },
  { name: "Elevaciones frontales", primaryMuscle: "SHOULDERS", equipment: "DUMBBELL" },
  { name: "Pájaros (elevación posterior)", primaryMuscle: "SHOULDERS", equipment: "DUMBBELL" },
  { name: "Press Arnold", primaryMuscle: "SHOULDERS", equipment: "DUMBBELL" },
  { name: "Face pull", primaryMuscle: "SHOULDERS", equipment: "CABLE" },

  // Bíceps
  { name: "Curl con barra", primaryMuscle: "BICEPS", equipment: "BARBELL" },
  { name: "Curl con mancuernas", primaryMuscle: "BICEPS", equipment: "DUMBBELL" },
  { name: "Curl martillo", primaryMuscle: "BICEPS", equipment: "DUMBBELL" },
  { name: "Curl inclinado", primaryMuscle: "BICEPS", equipment: "DUMBBELL" },
  { name: "Curl en polea", primaryMuscle: "BICEPS", equipment: "CABLE" },
  { name: "Curl en banco Scott", primaryMuscle: "BICEPS", equipment: "BARBELL" },

  // Tríceps
  { name: "Press francés", primaryMuscle: "TRICEPS", equipment: "BARBELL" },
  { name: "Extensión de tríceps en polea", primaryMuscle: "TRICEPS", equipment: "CABLE" },
  { name: "Extensión de tríceps con mancuerna", primaryMuscle: "TRICEPS", equipment: "DUMBBELL" },
  { name: "Fondos de tríceps", primaryMuscle: "TRICEPS", equipment: "BODYWEIGHT" },
  { name: "Patada de tríceps", primaryMuscle: "TRICEPS", equipment: "DUMBBELL" },

  // Piernas
  { name: "Sentadilla", primaryMuscle: "LEGS", secondaryMuscles: ["GLUTES"], equipment: "BARBELL" },
  { name: "Sentadilla frontal", primaryMuscle: "LEGS", equipment: "BARBELL" },
  { name: "Prensa de piernas", primaryMuscle: "LEGS", equipment: "MACHINE" },
  { name: "Zancadas", primaryMuscle: "LEGS", secondaryMuscles: ["GLUTES"], equipment: "DUMBBELL" },
  { name: "Extensión de cuádriceps", primaryMuscle: "LEGS", equipment: "MACHINE" },
  { name: "Curl femoral", primaryMuscle: "LEGS", equipment: "MACHINE" },
  { name: "Peso muerto rumano", primaryMuscle: "LEGS", secondaryMuscles: ["GLUTES"], equipment: "BARBELL" },
  { name: "Elevación de talones (gemelos)", primaryMuscle: "LEGS", equipment: "MACHINE" },

  // Glúteos
  { name: "Hip thrust", primaryMuscle: "GLUTES", equipment: "BARBELL" },
  { name: "Patada de glúteo en polea", primaryMuscle: "GLUTES", equipment: "CABLE" },

  // Core
  { name: "Plancha", primaryMuscle: "CORE", equipment: "BODYWEIGHT" },
  { name: "Crunch abdominal", primaryMuscle: "CORE", equipment: "BODYWEIGHT" },
  { name: "Elevación de piernas", primaryMuscle: "CORE", equipment: "BODYWEIGHT" },
  { name: "Rueda abdominal", primaryMuscle: "CORE", equipment: "OTHER" },

  // Antebrazos
  { name: "Curl de muñeca", primaryMuscle: "FOREARMS", equipment: "BARBELL" },
];

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const existing = await prisma.exercise.findMany({
    where: { userId: null },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((e) => e.name));

  const toCreate = EXERCISES.filter((e) => !existingNames.has(e.name));
  if (toCreate.length === 0) {
    console.log("Nothing to seed, global library already up to date.");
  } else {
    await prisma.exercise.createMany({
      data: toCreate.map((e) => ({
        name: e.name,
        primaryMuscle: e.primaryMuscle,
        secondaryMuscles: e.secondaryMuscles ?? [],
        equipment: e.equipment,
        userId: null,
      })),
    });
    console.log(`Seeded ${toCreate.length} new exercises (${existingNames.size} already present).`);
  }

  await prisma.$disconnect();
}

main();
