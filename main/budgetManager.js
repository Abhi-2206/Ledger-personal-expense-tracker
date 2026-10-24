const fs = require('fs');
const path = require('path');

const DATA_FILE = 'budgets.json';
let userDataDir = null;

// Initialize with the user data directory (same pattern as transactionManager)
function initialize(appPath) {
  userDataDir = appPath;
}

function getDataDir() {
  if (!userDataDir) {
    throw new Error('BudgetManager not initialized. Call initialize() first.');
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

function readBudgets() {
  try {
    initializeDataFile();
    const filePath = getDataFilePath();
    const data = fs.readFileSync(filePath, 'utf8');
    const budgets = JSON.parse(data);

    if (!Array.isArray(budgets)) {
      console.error('BudgetManager: Invalid data format in budgets.json, returning empty array');
      return [];
    }

    return budgets;
  } catch (error) {
    if (error instanceof SyntaxError) {
      // Malformed JSON — do NOT silently overwrite; log and return empty
      console.error('BudgetManager: Malformed JSON in budgets.json — returning empty array without overwriting:', error.message);
      return [];
    }
    console.error('BudgetManager: Error reading budgets.json:', error);
    return [];
  }
}

function writeBudgets(budgets) {
  try {
    initializeDataFile();
    const filePath = getDataFilePath();
    fs.writeFileSync(filePath, JSON.stringify(budgets, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('BudgetManager: Error writing budgets.json:', error);
    return false;
  }
}

// Valid expense categories (must match TransactionForm.jsx)
const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Utilities',
  'Entertainment',
  'Health',
  'Shopping',
  'Other',
];

function isValidCategory(category) {
  return typeof category === 'string' && EXPENSE_CATEGORIES.includes(category.trim());
}

function isValidAmount(amount) {
  const num = Number(amount);
  return Number.isFinite(num) && num > 0;
}

// Get all budgets
function getAllBudgets() {
  return readBudgets();
}

// Add a new budget
// Returns { success: true, budget } or { success: false, error: string }
function addBudget(budgetData) {
  const category = (budgetData && budgetData.category || '').trim();
  const amount = budgetData && budgetData.amount;

  if (!isValidCategory(category)) {
    return { success: false, error: `Invalid category: "${category}". Must be one of: ${EXPENSE_CATEGORIES.join(', ')}.` };
  }

  if (!isValidAmount(amount)) {
    return { success: false, error: 'Budget amount must be a finite number greater than zero.' };
  }

  const budgets = readBudgets();

  // Prevent duplicate category (one budget per expense category)
  const duplicate = budgets.find(
    (b) => b && b.category && b.category.toLowerCase() === category.toLowerCase()
  );
  if (duplicate) {
    return { success: false, error: `A budget for "${category}" already exists. Use edit to update it.` };
  }

  // Generate unique numeric ID (same convention as transactionManager)
  const ids = budgets.map((b) => Number(b.id)).filter((id) => !isNaN(id));
  const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;

  const newBudget = {
    id: newId,
    category: category,
    amount: Number(amount),
    createdAt: new Date().toISOString(),
  };

  budgets.push(newBudget);
  const wrote = writeBudgets(budgets);

  if (wrote) {
    return { success: true, budget: newBudget };
  } else {
    return { success: false, error: 'Failed to save budget to disk.' };
  }
}

// Update an existing budget amount
// Returns { success: true, budget } or { success: false, error: string }
function updateBudget(id, budgetData) {
  if (id === undefined || id === null) {
    return { success: false, error: 'Budget ID is required.' };
  }

  const amount = budgetData && budgetData.amount;
  if (!isValidAmount(amount)) {
    return { success: false, error: 'Budget amount must be a finite number greater than zero.' };
  }

  const budgets = readBudgets();
  const index = budgets.findIndex(
    (b) => b.id === id || String(b.id) === String(id)
  );

  if (index === -1) {
    return { success: false, error: `Budget with ID "${id}" not found.` };
  }

  budgets[index] = {
    ...budgets[index],
    amount: Number(amount),
    updatedAt: new Date().toISOString(),
  };

  const wrote = writeBudgets(budgets);

  if (wrote) {
    return { success: true, budget: budgets[index] };
  } else {
    return { success: false, error: 'Failed to save budget to disk.' };
  }
}

// Delete a budget by ID
function deleteBudget(id) {
  const budgets = readBudgets();
  const filtered = budgets.filter(
    (b) => b.id !== id && String(b.id) !== String(id)
  );

  if (filtered.length === budgets.length) {
    return false; // not found
  }

  return writeBudgets(filtered);
}

module.exports = {
  initialize,
  getAllBudgets,
  addBudget,
  updateBudget,
  deleteBudget,
  EXPENSE_CATEGORIES,
};
