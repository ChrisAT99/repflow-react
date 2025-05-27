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

const initialPresetPrograms = [
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

  // Workout Programs related states
  const [showPrograms, setShowPrograms] = useState(false);
  const [programs, setPrograms] = useState(initialPresetPrograms); // now editable programs
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [programHistoryFilter, setProgramHistoryFilter] = useState('all'); // 'all' or programId

  // New: Track which program is being edited and program edit fields
  const [programEditId, setProgramEditId] = useState(null);
  const [programEditTitle, setProgramEditTitle] = useState('');
  const [programEditExercises, setProgramEditExercises] = useState([]);

  // Load workouts and dark mode from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('workouts');
    if (saved) {
      const parsed = JSON.parse(saved).map(w => ({
        ...w,
        date: new Date(w.date)
      }));
      setWorkouts(parsed);
    }
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

  // Dark mode global toggle effect on <html> for full app coverage
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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

  // Workout form handlers
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
    const program = programs.find(p => p.id === programId);
    if (!program) return;

    // Add all program exercises to workouts for today with default reps and weights
    const today = new Date();
    const newEntries = program.exercises.map(ex => ({
      category: '', // programs mix categories
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

  // ----- New: Program editing handlers -----

  function startProgramEdit(program) {
    setProgramEditId(program.id);
    setProgramEditTitle(program.title);
    // Deep copy exercises so we don't mutate original accidentally
    setProgramEditExercises(program.exercises.map(ex => ({ ...ex })));
  }

  function cancelProgramEdit() {
    setProgramEditId(null);
    setProgramEditTitle('');
    setProgramEditExercises([]);
  }

  function saveProgramEdit() {
    if (!programEditTitle.trim()) {
      alert('Program title cannot be empty');
      return;
    }

    setPrograms(progs =>
      progs.map(p => (p.id === programEditId ? {
        ...p,
        title: programEditTitle,
        exercises: programEditExercises.filter(ex => ex.name.trim() !== ''),
      } : p))
    );
    cancelProgramEdit();
  }

  function addExerciseToProgram() {
    setProgramEditExercises(prev => [...prev, {
      name: '',
      substitutes: [],
      defaultReps: 10,
      defaultWeight: 0,
    }]);
  }

  function updateExerciseInProgram(index, field, value) {
    setProgramEditExercises(prev => {
      const updated = [...prev];
      if (field === 'substitutes') {
        updated[index][field] = value.split(',').map(s => s.trim()).filter(Boolean);
      } else if (field === 'defaultReps' || field === 'defaultWeight') {
        updated[index][field] = Number(value) || 0;
      } else {
        updated[index][field] = value;
      }
      return updated;
    });
  }

  // Add new program
  function addNewProgram() {
    const newId = 'program-' + Math.random().toString(36).slice(2, 9);
    const newProgram = {
      id: newId,
      title: 'New Program',
      exercises: [],
    };
    setPrograms(prev => [...prev, newProgram]);
    // Start editing the new program immediately
    startProgramEdit(newProgram);
  }

  return (
    <div className="app">
      <header>
        <h1>Workout Tracker</h1>
        <button onClick={() => setDarkMode(d => !d)}>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </header>

      <main>
        {/* Workout input form */}
        <section className="workout-form">
          <h2>{editIndex !== null ? 'Edit Workout' : 'Add Workout'}</h2>
          <form onSubmit={handleSubmit}>
            <label>
              Category:
              <select
                value={category}
                onChange={e => {
                  setCategory(e.target.value);
                  setExercise('');
                }}
              >
                <option value="">--Select--</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label>
              Exercise:
              <input
                list="exercises"
                value={exercise}
                onChange={e => setExercise(e.target.value)}
                placeholder="Type or select exercise"
              />
              <datalist id="exercises">
                {currentExercises.map(ex => (
                  <option key={ex} value={ex} />
                ))}
              </datalist>
            </label>

            <label>
              Reps:
              <input
                type="number"
                value={reps}
                onChange={e => setReps(e.target.value)}
                min="1"
                required
              />
            </label>

            <label>
              Weight (kg):
              <input
                type="number"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                min="0"
                step="0.5"
                required
              />
            </label>

            <button type="submit">{editIndex !== null ? 'Update Workout' : 'Add Workout'}</button>
            {editIndex !== null && (
              <button
                type="button"
                onClick={resetForm}
                style={{ marginLeft: '1rem' }}
              >
                Cancel
              </button>
            )}
          </form>
        </section>

        {/* Filter controls */}
        <section className="filter-controls">
          <h2>Filters</h2>

          <label>
            Category:
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="all">All</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label>
            Timeframe:
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
            <div className="custom-range">
              <label>
                Start:
                <input
                  type="date"
                  value={customRange.start}
                  onChange={e => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </label>
              <label>
                End:
                <input
                  type="date"
                  value={customRange.end}
                  onChange={e => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </label>
            </div>
          )}

          <button onClick={() => setShowHistory(true)}>Show History</button>
          <button onClick={() => setShowPrograms(true)} style={{ marginLeft: '1rem' }}>
            Manage Programs
          </button>
        </section>

        {/* Workout history */}
        {showHistory && (
          <section className="workout-history">
            <h2>Workout History</h2>

            {filteredWorkouts.length === 0 && <p>No workouts found.</p>}

            <ul>
              {filteredWorkouts.map((w, i) => (
                <li key={i} className="workout-entry">
                  <div>
                    <strong>{w.exercise}</strong> ({w.category}) — {w.reps} reps @ {w.weight} kg
                    <br />
                    <small>{formatDate(w.date)}</small>
                    {w.programId && (
                      <em style={{ marginLeft: '1rem', fontSize: '0.8rem' }}>
                        [Program: {programs.find(p => p.id === w.programId)?.title || w.programId}]
                      </em>
                    )}
                  </div>
                  <div>
                    <button onClick={() => handleEdit(workouts.indexOf(w))}>Edit</button>
                    <button onClick={() => handleDelete(workouts.indexOf(w))}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>

            {programHistoryFilter !== 'all' && (
              <button onClick={() => setProgramHistoryFilter('all')}>
                Clear Program Filter
              </button>
            )}
          </section>
        )}

        {/* Programs panel */}
        {showPrograms && (
          <section className="programs-panel">
            <h2>Workout Programs</h2>
            <button onClick={() => setShowPrograms(false)}>Close</button>
            <button onClick={addNewProgram} style={{ marginLeft: '1rem' }}>
              + Add New Program
            </button>

            {programs.length === 0 && <p>No programs yet.</p>}

            <ul className="programs-list">
              {programs.map(prog => (
                <li key={prog.id} className="program-entry">
                  {/* If editing this program, show edit form */}
                  {programEditId === prog.id ? (
                    <div className="program-edit">
                      <label>
                        Title:
                        <input
                          type="text"
                          value={programEditTitle}
                          onChange={e => setProgramEditTitle(e.target.value)}
                        />
                      </label>

                      <h4>Exercises:</h4>
                      {programEditExercises.map((ex, idx) => (
                        <div key={idx} className="program-exercise-edit">
                          <input
                            type="text"
                            placeholder="Exercise Name"
                            value={ex.name}
                            onChange={e => updateExerciseInProgram(idx, 'name', e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Substitutes (comma separated)"
                            value={ex.substitutes.join(', ')}
                            onChange={e => updateExerciseInProgram(idx, 'substitutes', e.target.value)}
                          />
                          <input
                            type="number"
                            min="1"
                            placeholder="Default Reps"
                            value={ex.defaultReps}
                            onChange={e => updateExerciseInProgram(idx, 'defaultReps', e.target.value)}
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="Default Weight"
                            value={ex.defaultWeight}
                            onChange={e => updateExerciseInProgram(idx, 'defaultWeight', e.target.value)}
                          />
                        </div>
                      ))}

                      <button onClick={addExerciseToProgram}>+ Add Exercise</button>
                      <div style={{ marginTop: '1rem' }}>
                        <button onClick={saveProgramEdit}>Save</button>
                        <button onClick={cancelProgramEdit} style={{ marginLeft: '1rem' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="program-info">
                      <h3>{prog.title}</h3>
                      <ul>
                        {prog.exercises.map((ex, i) => (
                          <li key={i}>
                            {ex.name} — Reps: {ex.defaultReps}, Weight: {ex.defaultWeight} kg
                            {ex.substitutes.length > 0 && (
                              <em> (Substitutes: {ex.substitutes.join(', ')})</em>
                            )}
                          </li>
                        ))}
                      </ul>

                      <button onClick={() => handleSelectProgram(prog.id)}>
                        Add Program Workouts
                      </button>
                      <button
                        onClick={() => handleShowProgramHistory(prog.id)}
                        style={{ marginLeft: '1rem' }}
                      >
                        Show History
                      </button>
                      <button
                        onClick={() => startProgramEdit(prog)}
                        style={{ marginLeft: '1rem' }}
                      >
                        Edit Program
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(`Delete program "${prog.title}"?`)
                          ) {
                            setPrograms(prev =>
                              prev.filter(p => p.id !== prog.id)
                            );
                            if (programHistoryFilter === prog.id) {
                              setProgramHistoryFilter('all');
                            }
                          }
                        }}
                        style={{ marginLeft: '1rem', color: 'red' }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
