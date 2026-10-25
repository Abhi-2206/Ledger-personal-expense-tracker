const fs = require('fs');
const path = require('path');

const DATA_FILE = 'recurringTransactions.json';
let userDataDir = null;

// Initialize with the user data directory (same pattern as other managers)
function initialize(appPath) {
  userDataDir = appPath;
}

function getDataDir() {
  if (!userDataDir) {
    throw new Error('RecurringManager not initialized. Call initialize() first.');
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

function readRules() {
  try {
    initializeDataFile();
    const filePath = getDataFilePath();
    const data = fs.readFileSync(filePath, 'utf8');
    const rules = JSON.parse(data);

    if (!Array.isArray(rules)) {
      console.error('RecurringManager: Invalid data format in recurringTransactions.json, returning empty array');
      return [];
    }

    return rules;
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error('RecurringManager: Malformed JSON in recurringTransactions.json — returning empty array without overwriting:', error.message);
      return [];
    }
    console.error('RecurringManager: Error reading recurringTransactions.json:', error);
    return [];
  }
}

function writeRules(rules) {
  try {
    initializeDataFile();
    const filePath = getDataFilePath();
    fs.writeFileSync(filePath, JSON.stringify(rules, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('RecurringManager: Error writing recurringTransactions.json:', error);
    return false;
  }
}

function isValidAmount(amount) {
  const num = Number(amount);
  return Number.isFinite(num) && num > 0;
}

function isValidDate(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// Frequency options
const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'];

// Transaction type options
const TRANSACTION_TYPES = ['income', 'expense'];

// Category options (must match TransactionForm.jsx)
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];
const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Other'];

function getCategoriesForType(type) {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

// Calculate next due date based on frequency
function calculateNextDueDate(currentDate, frequency) {
  const date = new Date(currentDate);
  
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      throw new Error(`Invalid frequency: ${frequency}`);
  }
  
  return date.toISOString().split('T')[0];
}

// Get all recurring rules
function getAllRules() {
  return readRules();
}

// Add a new recurring rule
// Returns { success: true, rule } or { success: false, error: string }
function addRule(ruleData) {
  if (!ruleData || typeof ruleData !== 'object') {
    return { success: false, error: 'Invalid rule data.' };
  }

  const title = (ruleData.title || '').trim();
  if (!title) {
    return { success: false, error: 'Title is required.' };
  }

  if (!isValidAmount(ruleData.amount)) {
    return { success: false, error: 'Amount must be a finite number greater than zero.' };
  }

  const type = ruleData.type;
  if (!TRANSACTION_TYPES.includes(type)) {
    return { success: false, error: 'Type must be either income or expense.' };
  }

  const category = ruleData.category;
  const validCategories = getCategoriesForType(type);
  if (!category || !validCategories.includes(category)) {
    return { success: false, error: `Category must be one of: ${validCategories.join(', ')}.` };
  }

  const frequency = ruleData.frequency;
  if (!FREQUENCIES.includes(frequency)) {
    return { success: false, error: 'Frequency must be daily, weekly, monthly, or yearly.' };
  }

  const startDate = ruleData.startDate;
  if (!isValidDate(startDate)) {
    return { success: false, error: 'Start date is required and must be valid.' };
  }

  const endDate = ruleData.endDate ? ruleData.endDate : null;
  if (endDate && !isValidDate(endDate)) {
    return { success: false, error: 'End date must be valid if provided.' };
  }

  if (endDate && new Date(endDate) < new Date(startDate)) {
    return { success: false, error: 'End date cannot be earlier than start date.' };
  }

  const rules = readRules();

  const ids = rules.map((r) => Number(r.id)).filter((id) => !isNaN(id));
  const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;

  const newRule = {
    id: newId,
    title,
    amount: Number(ruleData.amount),
    type,
    category,
    frequency,
    startDate,
    endDate,
    active: true,
    nextDueDate: startDate,
    processedOccurrences: [],
    createdAt: new Date().toISOString(),
  };

  rules.push(newRule);
  const wrote = writeRules(rules);

  if (wrote) {
    return { success: true, rule: newRule };
  } else {
    return { success: false, error: 'Failed to save rule to disk.' };
  }
}

// Update an existing rule
// Returns { success: true, rule } or { success: false, error: string }
function updateRule(id, ruleData) {
  if (id === undefined || id === null) {
    return { success: false, error: 'Rule ID is required.' };
  }
  if (!ruleData || typeof ruleData !== 'object') {
    return { success: false, error: 'Invalid rule data.' };
  }

  const rules = readRules();
  const index = rules.findIndex(
    (r) => r.id === id || String(r.id) === String(id)
  );

  if (index === -1) {
    return { success: false, error: `Rule with ID "${id}" not found.` };
  }

  const existingRule = rules[index];

  // Validate title if provided
  const title = ruleData.title !== undefined ? String(ruleData.title).trim() : existingRule.title;
  if (!title) {
    return { success: false, error: 'Title is required.' };
  }

  // Validate amount if provided
  const amount = ruleData.amount !== undefined ? ruleData.amount : existingRule.amount;
  if (!isValidAmount(amount)) {
    return { success: false, error: 'Amount must be a finite number greater than zero.' };
  }

  // Validate type if provided
  const type = ruleData.type !== undefined ? ruleData.type : existingRule.type;
  if (!TRANSACTION_TYPES.includes(type)) {
    return { success: false, error: 'Type must be either income or expense.' };
  }

  // Validate category if provided
  const category = ruleData.category !== undefined ? ruleData.category : existingRule.category;
  const validCategories = getCategoriesForType(type);
  if (!category || !validCategories.includes(category)) {
    return { success: false, error: `Category must be one of: ${validCategories.join(', ')}.` };
  }

  // Validate frequency if provided
  const frequency = ruleData.frequency !== undefined ? ruleData.frequency : existingRule.frequency;
  if (!FREQUENCIES.includes(frequency)) {
    return { success: false, error: 'Frequency must be daily, weekly, monthly, or yearly.' };
  }

  // Validate startDate if provided
  const startDate = ruleData.startDate !== undefined ? ruleData.startDate : existingRule.startDate;
  if (!isValidDate(startDate)) {
    return { success: false, error: 'Start date is required and must be valid.' };
  }

  // Validate endDate if provided
  const endDate = ruleData.endDate !== undefined 
    ? (ruleData.endDate || null) 
    : existingRule.endDate;
  
  if (endDate && !isValidDate(endDate)) {
    return { success: false, error: 'End date must be valid if provided.' };
  }

  if (endDate && new Date(endDate) < new Date(startDate)) {
    return { success: false, error: 'End date cannot be earlier than start date.' };
  }

  // Preserve processedOccurrences and nextDueDate to prevent duplicate transactions
  rules[index] = {
    ...existingRule,
    title,
    amount: Number(amount),
    type,
    category,
    frequency,
    startDate,
    endDate,
    updatedAt: new Date().toISOString(),
    // Preserve: id, active, nextDueDate, processedOccurrences, createdAt
  };

  const wrote = writeRules(rules);

  if (wrote) {
    return { success: true, rule: rules[index] };
  } else {
    return { success: false, error: 'Failed to save rule to disk.' };
  }
}

// Toggle active/paused status
// Returns { success: true, rule } or { success: false, error: string }
function toggleRuleStatus(id) {
  if (id === undefined || id === null) {
    return { success: false, error: 'Rule ID is required.' };
  }

  const rules = readRules();
  const index = rules.findIndex(
    (r) => r.id === id || String(r.id) === String(id)
  );

  if (index === -1) {
    return { success: false, error: `Rule with ID "${id}" not found.` };
  }

  rules[index] = {
    ...rules[index],
    active: !rules[index].active,
    updatedAt: new Date().toISOString(),
  };

  const wrote = writeRules(rules);

  if (wrote) {
    return { success: true, rule: rules[index] };
  } else {
    return { success: false, error: 'Failed to update rule status.' };
  }
}

// Delete a rule by ID
function deleteRule(id) {
  const rules = readRules();
  const filtered = rules.filter(
    (r) => r.id !== id && String(r.id) !== String(id)
  );

  if (filtered.length === rules.length) {
    return false; // not found
  }

  return writeRules(filtered);
}

// Process due transactions
// Returns { success: true, processed: number, transactions: [] } or { success: false, error: string }
function processDueTransactions(transactionManager) {
  if (!transactionManager || typeof transactionManager.addTransaction !== 'function') {
    return { success: false, error: 'Invalid transaction manager provided.' };
  }

  const rules = readRules();
  const processedTransactions = [];
  let processedCount = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const updatedRules = rules.map((rule) => {
    // Skip inactive rules
    if (!rule.active) {
      return rule;
    }

    // Skip if nextDueDate is in the future
    const nextDueDate = new Date(rule.nextDueDate);
    nextDueDate.setHours(0, 0, 0, 0);
    
    if (nextDueDate > today) {
      return rule;
    }

    // Skip if past end date
    if (rule.endDate) {
      const endDate = new Date(rule.endDate);
      endDate.setHours(0, 0, 0, 0);
      if (nextDueDate > endDate) {
        return rule;
      }
    }

    // Check if this occurrence has already been processed
    if (rule.processedOccurrences && rule.processedOccurrences.includes(rule.nextDueDate)) {
      // Already processed, advance nextDueDate
      const newNextDueDate = calculateNextDueDate(rule.nextDueDate, rule.frequency);
      return {
        ...rule,
        nextDueDate: newNextDueDate,
      };
    }

    // Create the transaction
    const signedAmount = rule.type === 'income' ? rule.amount : -rule.amount;
    const transaction = {
      title: rule.title,
      amount: signedAmount,
      category: rule.category,
      date: rule.nextDueDate,
      notes: `Recurring transaction (${rule.frequency})`,
    };

    const addedTransaction = transactionManager.addTransaction(transaction);
    if (addedTransaction) {
      processedTransactions.push(addedTransaction);
      processedCount++;

      // Mark this occurrence as processed
      const processedOccurrences = [...(rule.processedOccurrences || []), rule.nextDueDate];
      
      // Calculate next due date
      const newNextDueDate = calculateNextDueDate(rule.nextDueDate, rule.frequency);

      return {
        ...rule,
        processedOccurrences,
        nextDueDate: newNextDueDate,
        lastProcessedDate: rule.nextDueDate,
        updatedAt: new Date().toISOString(),
      };
    }

    // Failed to add transaction, don't advance
    return rule;
  });

  // Save updated rules
  const wrote = writeRules(updatedRules);

  if (wrote) {
    return {
      success: true,
      processed: processedCount,
      transactions: processedTransactions,
    };
  } else {
    return { success: false, error: 'Failed to save updated rules.' };
  }
}

module.exports = {
  initialize,
  getAllRules,
  addRule,
  updateRule,
  toggleRuleStatus,
  deleteRule,
  processDueTransactions,
  FREQUENCIES,
  TRANSACTION_TYPES,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
};
