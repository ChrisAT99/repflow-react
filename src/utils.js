// Format a Date object to "YYYY-MM-DD HH:mm"
export function formatDate(date) {
  if (!(date instanceof Date)) date = new Date(date);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
}

// Format a Date object to "YYYY-MM-DD"
export function formatDateOnly(date) {
  if (!(date instanceof Date)) date = new Date(date);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Format a Date object to "HH:mm"
export function formatTimeOnly(date) {
  if (!(date instanceof Date)) date = new Date(date);
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

// Helper to filter workouts by timeframe (last workout, week, month, custom range)
export function filterWorkoutsByDate(date, timeframe, allWorkouts, customRange) {
  if (!(date instanceof Date)) date = new Date(date);

  const now = new Date();

  switch (timeframe) {
    case 'lastWorkout':
      if (!allWorkouts || allWorkouts.length === 0) return true;
      const sorted = allWorkouts
        .filter(w => w.date instanceof Date)
        .sort((a,b) => b.date - a.date);
      const lastWorkoutDate = sorted[0]?.date;
      return date >= lastWorkoutDate;

    case 'lastWeek': {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return date >= weekAgo && date <= now;
    }

    case 'lastMonth': {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      return date >= monthAgo && date <= now;
    }

    case 'custom':
      if (!customRange || !customRange.start || !customRange.end) return true;
      const start = new Date(customRange.start);
      const end = new Date(customRange.end);
      return date >= start && date <= end;

    default:
      return true;
  }
}

// Filter workouts by category or programId
export function filterWorkoutsByCategoryOrProgram(workouts, filterValue) {
  if (filterValue === 'all') return workouts;
  return workouts.filter(w => w.category === filterValue || w.programId === filterValue);
}
