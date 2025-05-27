// App.js
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

const presetPrograms = [
  {
    id: 'push-pull-legs',
    title: 'Push Pull Legs',
    exercises: [
      {
        name: 'Bench Press',
        substitutes: ['Push-ups', 'Chest Fly'],
        defaultReps: 10,
        defaultWeight: 40,
      },
      {
        name: 'Overhead Press',
        substitutes: ['Lateral Raises', 'Front Raises'],
        defaultReps: 8,
        defaultWeight: 20,
      },
      {
        name: 'Deadlift',
        substitutes: ['Leg Press', 'Bent-over Row'],
        defaultReps: 6,
        defaultWeight: 60,
      }
    ],
  },
  {
    id: 'full-body',
    title: 'Full Body Blast',
    exercises: [
      {
        name: 'Squats',
        substitutes: ['Lunges', 'Leg Curl'],
        defaultReps: 12,
        defaultWeight: 50,
      },
      {
        name: 'Pull-Ups',
        substitutes: ['Lat Pulldown', 'Seated Row'],
        defaultReps: 8,
        defaultWeight: 0,
      },
      {
        name: 'Plank',
        substitutes: ['Crunches', 'Sit-ups'],
        defaultReps: 1, // reps could mean sets here or seconds - up to user
        defaultWeight: 0,
      }
    ],
  }
];

const categories = Object.keys(presetWorkouts);

const timeframes = [
  { value: 'lastWorkout', label: 'Since Last Workout' },
  { value: 'lastWeek', label: 'Last Week' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'custom', label: 'Custom Range' }
];

function App() {
  // State
  const [workouts, setWorkouts] = useState([]);
  const [category, setCategory] = useState('');
  const [exercise, setExercise] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [editIndex, setEditIndex] = useState(null);

  const [filterCategory, setFilterCategory] = useState('all');
  const [timeframe, setTimeframe] = useState('lastWeek');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const [showHistory, setShowHistory] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // New states for Workout Programs
  const [showPrograms, setShowPrograms] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [programHistoryFilter, setProgramHistoryFilter] = useState('all'); // 'all' or programId

  // Load workouts from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('workouts');
    if (saved) {
      const parsed = JSON.parse(saved).map(w => ({
        ...w,
        date: new Date(w.date)
      }));
      setWorkouts(parsed);
    }
    // Load dark mode preference if saved
    const savedDark = localStorage.getItem('darkMode');
    if (savedDark === 'true') setDarkMode(true);
  }, []);

  // Save workouts and darkMode to localStorage on change
  useEffect(() => {
    localStorage.setItem('workouts', JSON.stringify(workouts));
  }, [workouts]);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Filter workouts based on filterCategory, timeframe, and programHistoryFilter
  const filteredWorkouts = workouts.filter(w => {
    if (filterCategory !== 'all' && w.category !== filterCategory) return false;
    if (programHistoryFilter !== 'all' && w.programId !== programHistoryFilter) return false;

    if (timeframe === 'custom') {
      if (!customRange.start || !customRange.end) return true; // no range selected yet
      return w.date >= new Date(customRange.start) && w.date <= new Date(customRange.end);
    }

    return filterWorkoutsByDate(w.date, timeframe, workouts);
  });

  // Populate exercise list for selected category
  const currentExercises = category ? presetWorkouts[category] || [] : [];

  // Handlers
  function resetForm() {
    setCategory('');
    setExercise('');
    setReps('');
    setWeight('');
    setEditIndex(null);
    setSelectedProgramId(null);
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
      date: new Date(),
      programId: selectedProgramId, // tag with program if any
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
    setSelectedProgramId(w.programId || null);
  }

  function handleDelete(index) {
    if (window.confirm('Delete this workout?')) {
      setWorkouts(prev => prev.filter((_, i) => i !== index));
      if (editIndex === index) resetForm();
    }
  }

  // Program selection: adds all exercises from the selected program to the workout list for today
  function handleSelectProgram(programId) {
    const program = presetPrograms.find(p => p.id === programId);
    if (!program) return;

    // We add all program exercises to workouts for today with default reps and weights
    const today = new Date();
    const newEntries = program.exercises.map(ex => ({
      category: '', // no category here because programs can mix exercises from various categories
      exercise: ex.name,
      reps: ex.defaultReps,
      weight: ex.defaultWeight,
      date: today,
      programId: program.id,
    }));

    setWorkouts(prev => [...prev, ...newEntries]);
    setShowPrograms(false);
    setShowHistory(true);
    setProgramHistoryFilter(program.id);
  }

  // Show history filtered by program
  function handleShowProgramHistory(programId) {
    setProgramHistoryFilter(programId);
    setShowHistory(true);
    setShowPrograms(false);
  }

  return (
    <div className={`app-container ${darkMode ? 'dark' : ''}`}>
      <header>
        <h1>RepFlow Workout Tracker</h1>

        <div className="top-buttons">
          <button onClick={() => setDarkMode(d => !d)}>
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          <button onClick={() => {
            setShowHistory(h => !h);
            if (showPrograms) setShowPrograms(false);
            setProgramHistoryFilter('all'); // reset program history filter when toggling general history
          }}>
            {showHistory ? 'Hide History' : 'Show History'}
          </button>

          <button onClick={() => {
            setShowPrograms(p => !p);
            if (showHistory) setShowHistory(false);
            setProgramHistoryFilter('all');
          }}>
            {showPrograms ? 'Hide Programs' : 'Workout Programs'}
          </button>
        </div>
      </header>

      <section className="workout-entry">
        <form onSubmit={handleSubmit}>
          <label>Category:
            <select
              value={category}
              onChange={e => {
                setCategory(e.target.value);
                setExercise('');
                setSelectedProgramId(null);
              }}
              required
              disabled={selectedProgramId !== null} // disable when adding program exercises
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
              disabled={selectedProgramId !== null} // disable manual edit when adding program exercises
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

          <button type="submit">{editIndex !== null ? 'Save Workout' : 'Add Workout'}</button>
          {editIndex !== null && <button type="button" onClick={resetForm}>Cancel Edit</button>}
        </form>
      </section>

      {/* Workout Programs panel */}
      {showPrograms && (
        <section className="programs-panel">
          <h2>Workout Programs</h2>
          {presetPrograms.map(program => (
            <div key={program.id} className="program-card">
              <h3>{program.title}</h3>
              <button onClick={() => handleSelectProgram(program.id)}>Select Program</button>
              <button onClick={() => handleShowProgramHistory(program.id)}>Show History</button>

              <ul className="program-exercises">
                {program.exercises.map((ex, i) => (
                  <li key={i}>
                    <strong>{ex.name}</strong> (Reps: {ex.defaultReps}, Weight: {ex.defaultWeight} kg)
                    {ex.substitutes.length > 0 && (
                      <div className="substitutes">Substitutes: {ex.substitutes.join(', ')}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* History panel */}
      {showHistory && (
        <section className="history-panel">
          <h2>Workout History {programHistoryFilter !== 'all' && `- Program: ${presetPrograms.find(p => p.id === programHistoryFilter)?.title || ''}`}</h2>

          <div className="filters">
            <label>Category Filter:
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

            <label>Timeframe:
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
                <label>Start Date:
                  <input
                    type="date"
                    value={customRange.start}
                    onChange={e => setCustomRange(r => ({ ...r, start: e.target.value }))}
                  />
                </label>
                <label>End Date:
                  <input
                    type="date"
                    value={customRange.end}
                    onChange={e => setCustomRange(r => ({ ...r, end: e.target.value }))}
                  />
                </label>
              </div>
            )}
          </div>

          {filteredWorkouts.length === 0 ? (
            <p>No workouts found for the selected filters.</p>
          ) : (
            <ul className="workout-history-list">
              {filteredWorkouts.map((w, i) => (
                <li key={i} className="workout-history-item">
                  <div>
                    <strong>{w.exercise}</strong> — {w.reps} reps @ {w.weight} kg
                    {w.category && <span> [{w.category}]</span>}
                    {w.programId && (
                      <span className="program-tag">Program: {presetPrograms.find(p => p.id === w.programId)?.title || w.programId}</span>
                    )}
                  </div>
                  <div className="date">{formatDate(w.date)}</div>
                  <button onClick={() => handleEdit(i)}>Edit</button>
                  <button onClick={() => handleDelete(i)}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

export default App;
