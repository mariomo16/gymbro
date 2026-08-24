export type User = { id: number; username: string; name: string | null };
export type MuscleGroup = { id: number; name: string };
export type ExerciseLite = {
  id: number;
  name: string;
  muscle_group_id: number;
};
export type RoutineDayRow = {
  weekday: number;
  rows: { exercise: ExerciseLite; targetSets: number | null }[];
};
export type WorkoutSet = {
  id: number;
  workout_exercise_id: number;
  set_number: number;
  reps: number;
  weight: number;
};
export type WorkoutExercise = {
  id: number;
  exercise_id: number;
  name: string;
  muscle_group_id: number;
  position: number;
  target_sets: number | null;
};
