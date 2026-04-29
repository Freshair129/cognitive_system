# MSP Knowledge Browser 🧠

MSP Knowledge Browser is a visual interface for the Genesis Knowledge System (GKS). It allows developers and researchers to browse, search, and visualize atomic knowledge files (Atoms) in a graph structure.

## Features

- **Graph Visualization**: Interactive 2D graph of all Atoms and their links using Cytoscape.js.
- **Semantic Search (Recall)**: Integrated semantic search powered by the GKS Recall API.
- **Brain Switcher (Multi-Vault)**: Add and switch between multiple local knowledge folders (Brains), similar to Obsidian Vaults.
- **Atom Inspector**: View metadata (frontmatter) and raw markdown content of any Atom.
- **Dynamic Scanning**: Automatically scans markdown files if the central index is missing.
- **System Oversight**: Real-time counts for hotfixes and the inbound queue.

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- GKS Atoms stored in a folder structure (e.g., `gks/concept/*.md`)

### Installation

1. Navigate to the project directory:
   ```bash
   cd G:\msp
   ```
2. Install dependencies:
   ```bash
   npm install
   cd web
   npm install
   cd ..
   ```

### Running the App

Start both the backend server and the frontend dev server with a single command:

```bash
npm run dev
```

The app will be available at: **[http://localhost:3000](http://localhost:3000)**

## Configuration & Brain Switcher

### Adding a new Brain
You can connect to any GKS-compatible folder on your machine:
1. Click the **+ Add Brain** button in the top bar.
2. Provide a **Name** for your brain (e.g., "Personal Notes").
3. Provide the **Absolute Path** to the folder (e.g., `C:/Users/Name/Documents/Brain`).
4. Click **Save**.

### Persistence
Your brain list is saved locally in `brains-config.json` and will be remembered when you restart the application.

## Tech Stack

- **Frontend**: React, Vite, TypeScript, Cytoscape.js.
- **Backend**: Node.js, Express, tsx.
- **Styling**: Vanilla CSS (Modern Dark Theme).

---
Created by Antigravity (Advanced Agentic Coding) for the GKS+MSP Ecosystem.
