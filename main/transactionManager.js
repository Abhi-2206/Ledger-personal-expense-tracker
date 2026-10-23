const fs = require('fs');
const path = require('path');

const DATA_FILE = 'transactions.json';
let userDataDir = null;

// Initialize with the user data directory
function initialize(appPath) {
  userDataDir = appPath;
}

// Get the user data directory
function getDataDir() {
  if (!userDataDir) {
    throw new Error('TransactionManager not initialized. Call initialize() first.');
  }
  return userDataDir;
}



// Get the full path to the data file
function getDataFilePath() {
  return path.join(getDataDir(), DATA_FILE);
}

// Initialize the data file if it doesn't exist
function initializeDataFile() {
  const filePath = getDataFilePath();
  const dir = getDataDir();

  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Create file with empty array if it doesn't exist
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf8');
  }
}

// Read transactions from file
function readTransactions() {
  try {
    initializeDataFile();
    const filePath = getDataFilePath();
    const data = fs.readFileSync(filePath, 'utf8');
    const transactions = JSON.parse(data);

    // Validate that it's an array
    if (!Array.isArray(transactions)) {
      console.error('Invalid data format, resetting to empty array');
      return [];
    }

    return transactions;
  } catch (error) {
    console.error('Error reading transactions:', error);
    // Return empty array on error
    return [];
  }
}

// Write transactions to file
function writeTransactions(transactions) {
  try {
    initializeDataFile();
    const filePath = getDataFilePath();
    fs.writeFileSync(filePath, JSON.stringify(transactions, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing transactions:', error);
    return false;
  }
}

// Get all transactions
function getAllTransactions() {
  return readTransactions();
}

// Add a new transaction
function addTransaction(transaction) {
  const transactions = readTransactions();

  // Generate a unique ID
  const ids = transactions.map(t => Number(t.id)).filter(id => !isNaN(id));
  const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;

  const newTransaction = {
    id: newId,
    ...transaction,
    createdAt: new Date().toISOString(),
  };

  transactions.push(newTransaction);
  const success = writeTransactions(transactions);

  if (success) {
    return newTransaction;
  } else {
    return null;
  }
}

// Update an existing transaction
function updateTransaction(id, updatedData) {
  const transactions = readTransactions();
  const index = transactions.findIndex(t => t.id === id || String(t.id) === String(id));

  if (index === -1) {
    return null;
  }

  transactions[index] = {
    ...transactions[index],
    ...updatedData,
    id: transactions[index].id, // Ensure ID doesn't change
    updatedAt: new Date().toISOString(),
  };

  const success = writeTransactions(transactions);

  if (success) {
    return transactions[index];
  } else {
    return null;
  }
}

// Delete a transaction
function deleteTransaction(id) {
  const transactions = readTransactions();
  const filteredTransactions = transactions.filter(t => t.id !== id && String(t.id) !== String(id));

  if (filteredTransactions.length === transactions.length) {
    // Transaction not found
    return false;
  }

  const success = writeTransactions(filteredTransactions);
  return success;
}

module.exports = {
  initialize,
  getAllTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
};
