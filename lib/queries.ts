import { mondayIndex } from "@/lib/dates";
import { all, get } from "@/lib/db";
import type { ExerciseLite, MuscleGroup, User, WorkoutSet } from "@/lib/types";

export function getUserGroups(): MuscleGroup[] {
  return all<MuscleGroup>("SELECT id, name FROM muscle_groups ORDER BY id");
}

export function getUserExercises(userId: number): ExerciseLite[] {
  return all<ExerciseLite>(
    "SELECT id, name, muscle_group_id FROM exercises WHERE user_id = ? ORDER BY name COLLATE NOCASE",
    userId,
  );
}

export function getActiveWorkout(userId: number) {
  return get<{ id: number; started_at: number; routine_day_id: number | null }>(
    "SELECT id, started_at, routine_day_id FROM workouts WHERE user_id = ? AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1",
    userId,
  );
}

export type TodayDay = {
  routine_day_id: number;
  routine_name: string;
  exercises: {
    exercise_id: number;
    exercise_name: string;
    muscle_group_id: number;
    target_sets: number | null;
  }[];
};

export function getRoutineDaysForWeekday(
  userId: number,
  weekday: number,
): TodayDay[] {
  const days = all<{
    routine_day_id: number;
    routine_name: string;
  }>(
    `SELECT rd.id AS routine_day_id, r.name AS routine_name
     FROM routine_days rd
     JOIN routines r ON r.id = rd.routine_id
     WHERE r.user_id = ? AND rd.weekday = ?
     ORDER BY r.created_at`,
    userId,
    weekday,
  );
  const res: TodayDay[] = [];
  for (const d of days) {
    const exercises = all<{
      exercise_id: number;
      exercise_name: string;
      muscle_group_id: number;
      target_sets: number | null;
    }>(
      `SELECT rex.exercise_id, e.name AS exercise_name, e.muscle_group_id, rex.target_sets
       FROM routine_exercises rex JOIN exercises e ON e.id = rex.exercise_id
       WHERE rex.routine_day_id = ? ORDER BY rex.position`,
      d.routine_day_id,
    );
    res.push({ ...d, exercises });
  }
  return res;
}

export function getNextTrainingDay(user: User): { weekday: number } | null {
  const start = mondayIndex(new Date());
  for (let i = 1; i <= 7; i++) {
    const wd = (start + i) % 7;
    const hit = get<{ routine_day_id: number }>(
      `SELECT rd.id AS routine_day_id FROM routine_days rd JOIN routines r ON r.id = rd.routine_id
       WHERE r.user_id = ? AND rd.weekday = ? LIMIT 1`,
      user.id,
      wd,
    );
    if (hit) return { weekday: wd };
  }
  return null;
}

export type WorkoutSummary = {
  id: number;
  started_at: number;
  ended_at: number | null;
  duration_seconds: number | null;
  volume: number;
  sets: number;
  exercises_count: number;
  title: string | null;
};

export function getRecentWorkouts(
  userId: number,
  limit = 10,
): WorkoutSummary[] {
  return all<WorkoutSummary>(
    `SELECT w.id, w.started_at, w.ended_at, w.duration_seconds, r.name AS title,
       (SELECT COALESCE(SUM(s.reps * s.weight), 0) FROM workout_sets s
        JOIN workout_exercises we ON we.id = s.workout_exercise_id WHERE we.workout_id = w.id) AS volume,
       (SELECT COUNT(*) FROM workout_sets s
        JOIN workout_exercises we ON we.id = s.workout_exercise_id WHERE we.workout_id = w.id) AS sets,
       (SELECT COUNT(*) FROM workout_exercises we WHERE we.workout_id = w.id) AS exercises_count
     FROM workouts w
     LEFT JOIN routine_days rd ON rd.id = w.routine_day_id
     LEFT JOIN routines r ON r.id = rd.routine_id
     WHERE w.user_id = ? AND w.ended_at IS NOT NULL
     ORDER BY w.ended_at DESC LIMIT ${limit}`,
    userId,
  );
}

export type WeightEntry = { id: number; date: string; weight: number };

export function getWeightEntries(userId: number): WeightEntry[] {
  return all<WeightEntry>(
    "SELECT id, date, weight FROM body_weights WHERE user_id = ? ORDER BY date ASC",
    userId,
  );
}

export function getWeightOnDate(userId: number, date: string): number | null {
  const row = get<{ weight: number }>(
    "SELECT weight FROM body_weights WHERE user_id = ? AND date = ?",
    userId,
    date,
  );
  return row?.weight ?? null;
}

export function getLastSetForExercise(
  userId: number,
  exerciseId: number,
): { reps: number; weight: number } | null {
  return (
    get<{ reps: number; weight: number }>(
      `SELECT s.reps, s.weight
       FROM workout_sets s
       JOIN workout_exercises we ON we.id = s.workout_exercise_id
       JOIN workouts w ON w.id = we.workout_id
       WHERE w.user_id = ? AND we.exercise_id = ? AND w.ended_at IS NOT NULL
       ORDER BY s.id DESC LIMIT 1`,
      userId,
      exerciseId,
    ) ?? null
  );
}

export function getWorkoutSets(workoutId: number): WorkoutSet[] {
  return all<WorkoutSet>(
    `SELECT s.id, s.workout_exercise_id, s.set_number, s.reps, s.weight
     FROM workout_sets s JOIN workout_exercises we ON we.id = s.workout_exercise_id
     WHERE we.workout_id = ? ORDER BY s.workout_exercise_id, s.set_number, s.id`,
    workoutId,
  );
}
