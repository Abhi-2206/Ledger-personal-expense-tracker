const fs = require('fs');
const path = require('path');

const DATA_FILE = 'savingsGoals.json';
let userDataDir = null;

// Initialize with the user data directory (same pattern as budgetManager)
function initialize(appPath) {
  userDataDir = appPath;
}

function getDataDir() {
  if (!userDataDir) {
    throw new Error('GoalsManager not initialized. Call initialize() first.');
  }
  return userDataDir;
}

function getDataFilePath() {
  return path.join(getDataDir(), DATA_FILE);
}

function initializeDataFile() {
  const filePath = getDataFilePath();
  const dir = getDataDir();

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf8');
  }
}

function readGoals() {
  try {
    initializeDataFile();
    const filePath = getDataFilePath();
    const data = fs.readFileSync(filePath, 'utf8');
    const goals = JSON.parse(data);

    if (!Array.isArray(goals)) {
      console.error('GoalsManager: Invalid data format in savingsGoals.json, returning empty array');
      return [];
    }

    return goals;
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error('GoalsManager: Malformed JSON in savingsGoals.json — returning empty array without overwriting:', error.message);
      return [];
    }
    console.error('GoalsManager: Error reading savingsGoals.json:', error);
    return [];
  }
}

function writeGoals(goals) {
  try {
    initializeDataFile();
    const filePath = getDataFilePath();
    fs.writeFileSync(filePath, JSON.stringify(goals, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('GoalsManager: Error writing savingsGoals.json:', error);
    return false;
  }
}

function isValidAmount(amount) {
  const num = Number(amount);
  return Number.isFinite(num) && num > 0;
}

// Get all goals
function getAllGoals() {
  return readGoals();
}

// Add a new savings goal
// Returns { success: true, goal } or { success: false, error: string }
function addGoal(goalData) {
  if (!goalData || typeof goalData !== 'object') {
    return { success: false, error: 'Invalid goal data.' };
  }

  const name = (goalData.name || '').trim();
  if (!name) {
    return { success: false, error: 'Goal name is required.' };
  }

  if (!isValidAmount(goalData.targetAmount)) {
    return { success: false, error: 'Target amount must be a finite number greater than zero.' };
  }

  const targetDate = goalData.targetDate ? String(goalData.targetDate).trim() : null;

  const goals = readGoals();

  const ids = goals.map((g) => Number(g.id)).filter((id) => !isNaN(id));
  const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;

  const newGoal = {
    id: newId,
    name,
    targetAmount: Number(goalData.targetAmount),
    currentAmount: 0,
    targetDate: targetDate || null,
    createdAt: new Date().toISOString(),
  };

  goals.push(newGoal);
  const wrote = writeGoals(goals);

  if (wrote) {
    return { success: true, goal: newGoal };
  } else {
    return { success: false, error: 'Failed to save goal to disk.' };
  }
}

// Update an existing goal's name, targetAmount, and/or targetDate.
// Preserves currentAmount — does not reset contributions.
// Returns { success: true, goal } or { success: false, error: string }
function updateGoal(id, goalData) {
  if (id === undefined || id === null) {
    return { success: false, error: 'Goal ID is required.' };
  }
  if (!goalData || typeof goalData !== 'object') {
    return { success: false, error: 'Invalid goal data.' };
  }

  const goals = readGoals();
  const index = goals.findIndex(
    (g) => g.id === id || String(g.id) === String(id)
  );

  if (index === -1) {
    return { success: false, error: `Goal with ID "${id}" not found.` };
  }

  const name = goalData.name !== undefined ? String(goalData.name).trim() : goals[index].name;
  if (!name) {
    return { success: false, error: 'Goal name is required.' };
  }

  const targetAmount = goalData.targetAmount !== undefined
    ? goalData.targetAmount
    : goals[index].targetAmount;

  if (!isValidAmount(targetAmount)) {
    return { success: false, error: 'Target amount must be a finite number greater than zero.' };
  }

  // targetDate: null clears it, undefined preserves existing
  let targetDate = goals[index].targetDate;
  if (goalData.targetDate !== undefined) {
    targetDate = goalData.targetDate ? String(goalData.targetDate).trim() : null;
  }

  goals[index] = {
    ...goals[index],
    name,
    targetAmount: Number(targetAmount),
    targetDate: targetDate || null,
    updatedAt: new Date().toISOString(),
    // currentAmount is intentionally preserved from the spread above
  };

  const wrote = writeGoals(goals);

  if (wrote) {
    return { success: true, goal: goals[index] };
  } else {
    return { success: false, error: 'Failed to save goal to disk.' };
  }
}

// Add a contribution to a goal's currentAmount.
// Returns { success: true, goal } or { success: false, error: string }
function addContribution(id, amount) {
  if (id === undefined || id === null) {
    return { success: false, error: 'Goal ID is required.' };
  }
  if (!isValidAmount(amount)) {
    return { success: false, error: 'Contribution amount must be a finite number greater than zero.' };
  }

  const goals = readGoals();
  const index = goals.findIndex(
    (g) => g.id === id || String(g.id) === String(id)
  );

  if (index === -1) {
    return { success: false, error: `Goal with ID "${id}" not found.` };
  }

  const current = Number(goals[index].currentAmount) || 0;
  goals[index] = {
    ...goals[index],
    currentAmount: Math.round((current + Number(amount)) * 100) / 100,
    updatedAt: new Date().toISOString(),
  };

  const wrote = writeGoals(goals);

  if (wrote) {
    return { success: true, goal: goals[index] };
  } else {
    return { success: false, error: 'Failed to save contribution to disk.' };
  }
}

// Delete a goal by ID
function deleteGoal(id) {
  const goals = readGoals();
  const filtered = goals.filter(
    (g) => g.id !== id && String(g.id) !== String(id)
  );

  if (filtered.length === goals.length) {
    return false; // not found
  }

  return writeGoals(filtered);
}

module.exports = {
  initialize,
  getAllGoals,
  addGoal,
  updateGoal,
  addContribution,
  deleteGoal,
};
