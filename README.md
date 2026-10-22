# Ledger — Personal Expense Tracker

A desktop application built with React, Vite, Electron, and Node.js for tracking personal expenses.

## Project Structure

```
ledger/
├── frontend/              # React + Vite frontend
│   ├── index.html        # HTML entry point
│   ├── vite.config.js    # Vite configuration
│   └── src/
│       ├── main.jsx      # React entry point
│       ├── App.jsx       # Main application component
│       └── index.css     # Global styles
├── main/                 # Electron main process
│   └── main.js           # Main Electron process
├── preload/              # Electron preload script
│   └── preload.js        # Secure preload with contextBridge
├── package.json          # Project dependencies and scripts
└── README.md            # This file
```

## Tech Stack

- **Frontend**: React with JavaScript (via Vite)
- **Desktop Framework**: Electron
- **Build Tool**: Vite
- **Node.js**: For backend integration (future)

## Security Configuration

The Electron window is configured with security best practices:
- `nodeIntegration: false` - Prevents Node.js integration in renderer
- `contextIsolation: true` - Enables context isolation for security
- `contextBridge` - Exposes only specific APIs to the renderer process

## Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the application in development mode**:
   ```bash
   npm run dev
   ```

   This will:
   - Start the Vite dev server on port 5173
   - Launch the Electron window
   - Enable hot module replacement (HMR) for React

3. **Build for production**:
   ```bash
   npm run build
   ```

   This creates an optimized build in `frontend/dist/`.

4. **Preview production build**:
   ```bash
   npm run preview
   ```

## Available Scripts

- `npm run dev` - Start development server and Electron window
- `npm run dev:vite` - Start Vite dev server only
- `npm run dev:electron` - Start Electron window only
- `npm run build` - Build React app for production
- `npm run preview` - Preview production build

## Development Notes

- The preload script (`preload/preload.js`) uses `contextBridge` to expose a secure API (`window.electronAPI`) for future IPC communication between React and the Node.js main process.
- Currently, the app displays a placeholder screen with the title "Ledger — Personal Expense Tracker".
- No database, Prisma, or UI libraries have been added yet, keeping the setup minimal and focused on infrastructure.

## Future Development

Expense tracking features will be implemented in future iterations, including:
- Data persistence (database integration)
- Expense CRUD operations
- Categories and filtering
- Charts and analytics
