import React, { useState, useEffect } from 'react';
import { formatDate, filterWorkoutsByDate } from './utils';
import './styles.css';

const presetWorkouts = {
  legs: ['Squats', 'Lunges', 'Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raises'],
  shoulders: ['Overhead Press', 'Lateral Raises', 'Front Raises', 'Shrugs', 'Reverse Fly'],
  biceps: ['Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Concentration Curl'],
  triceps: ['Triceps Pushdown', 'Skull Crushers', 'Dips', 'Overhead Triceps Extension'],
  back: ['Pull-Ups', 'Bent-over Row', 'Lat Pulldown', 'Deadlift', 'Seated Row'],
  chest: ['Bench Press', 'Push-ups', 'Chest Fly', 'Incline Bench Press'],
  core: ['Plank', 'Crunches', 'Leg Raises', 'Russian Twist', 'Sit-ups'],
  cardio: ['Running', 'Cycling', 'Jump Rope', 'Rowing', 'Swimming'],
  other: ['Yoga', 'Stretching', 'Foam Rolling']
};

const categories = Object.keys(presetWorkouts);

const timeframes = [
  { value: 'lastWorkout', label: 'Since Last Workout' },
  { value: 'lastWeek', label: 'Last Week' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'custom', label: 'Custom Range' }
];

function App() {
  const [workouts, setWorkouts] = useState([]);
  const [category, setCategory] = useState('');
  const [exercise, setExercise] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [editIndex, setEditIndex] = useState(null);

  const [filterCategory, setFilterCategory] = useState('all');
  const [timeframe, setTimeframe] = useState('lastWeek');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    const saved = localStorage.getItem('workouts');
    if (saved) {
      const parsed = JSON.parse(saved).map(w => ({
        ...w,
        date: new Date(w.date)
      }));
      setWorkouts(parsed);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('workouts', JSON.stringify(workouts));
  }, [workouts]);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const filteredWorkouts = workouts.filter(w => {
    if (filterCategory !== 'all' && w.category !== filterCategory) return false;

    if (timeframe === 'custom') {
      if (!customRange.start || !customRange.end) return true;
      return w.date >= new Date(customRange.start) && w.date <= new Date(customRange.end);
    }

    return filterWorkoutsByDate(w.date, timeframe, workouts);
  });

  const currentExercises = category ? presetWorkouts[category] || [] : [];

  function resetForm() {
    setCategory('');
    setExercise('');
    setReps('');
    setWeight('');
    setEditIndex(null);
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!category) return alert('Please select a category');
    if (!exercise) return alert('Please enter an exercise');
    if (!reps || reps <= 0) return alert('Please enter a valid reps number');
    if (weight === '' || weight < 0) return alert('Please enter a valid weight');

    const newWorkout = {
      category,
      exercise,
      reps: Number(reps),
      weight: Number(weight),
      date: new Date()
    };

    if (editIndex !== null) {
      const updated = [...workouts];
      updated[editIndex] = newWorkout;
      setWorkouts(updated);
      setEditIndex(null);
    } else {
      setWorkouts(prev => [...prev, newWorkout]);
    }
    resetForm();
  }

  function handleEdit(index) {
    const w = workouts[index];
    setCategory(w.category);
    setExercise(w.exercise);
    setReps(w.reps);
    setWeight(w.weight);
    setEditIndex(index);
  }

  function handleDelete(index) {
    if (window.confirm('Delete this workout?')) {
      setWorkouts(prev => prev.filter((_, i) => i !== index));
      if (editIndex === index) resetForm();
    }
  }

  return (
    <div className="app-container">
      <header>
        <h1>RepFlow Workout Tracker</h1>
        <button onClick={() => setDarkMode(prev => !prev)}>
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </header>

      <section className="workout-entry">
        <form onSubmit={handleSubmit}>
          <label>Category:
            <select
              value={category}
              onChange={e => {
                setCategory(e.target.value);
                setExercise('');
              }}
              required
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </label>

          <label>Exercise:
            <input
              list="exerciseList"
              value={exercise}
              onChange={e => setExercise(e.target.value)}
              placeholder="Select or type exercise"
              required
            />
            <datalist id="exerciseList">
              {currentExercises.map(ex => (
                <option key={ex} value={ex} />
              ))}
            </datalist>
          </label>

          <label>Reps:
            <input
              type="number"
              min="1"
              value={reps}
              onChange={e => setReps(e.target.value)}
              required
            />
          </label>

          <label>Weight (kg):
            <input
              type="number"
              min="0"
              step="0.1"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              required
            />
          </label>

          <button type="submit">{editIndex !== null ? 'Update Workout' : 'Add Workout'}</button>
          {editIndex !== null && <button type="button" onClick={resetForm}>Cancel Edit</button>}
        </form>
      </section>

      <section className="filter-section">
        <label>Filter by Category:
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="all">All</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </label>

        <label>Filter by Timeframe:
          <select
            value={timeframe}
            onChange={e => setTimeframe(e.target.value)}
          >
            {timeframes.map(tf => (
              <option key={tf.value} value={tf.value}>{tf.label}</option>
            ))}
          </select>
        </label>

        {timeframe === 'custom' && (
          <div className="custom-date-range">
            <label>Start:
              <input
                type="date"
                value={customRange.start}
                onChange={e => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </label>
            <label>End:
              <input
                type="date"
                value={customRange.end}
                onChange={e => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </label>
          </div>
        )}
      </section>

      <section className="workout-list">
        <h2>Workouts</h2>
        {filteredWorkouts.length === 0 ? (
          <p>No workouts found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Exercise</th>
                <th>Reps</th>
                <th>Weight (kg)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkouts.map((w, i) => (
                <tr key={i}>
                  <td>{formatDate(w.date)}</td>
                  <td>{w.category.charAt(0).toUpperCase() + w.category.slice(1)}</td>
                  <td>{w.exercise}</td>
                  <td>{w.reps}</td>
                  <td>{w.weight.toFixed(1)}</td>
                  <td>
                    <button onClick={() => handleEdit(workouts.indexOf(w))}>Edit</button>
                    <button onClick={() => handleDelete(workouts.indexOf(w))}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <footer>
        <p>RepFlow &copy; 2025</p>
      </footer>
    </div>
  );
}

export default App;
