# Team Caffeine ACS Frontend

Frontend application for the Access Control System (ACS) project developed by Team Caffeine.

## Project Overview

This repository contains the Next.js frontend for the ACS system.
It provides the user interface for interacting with backend services maintained in a separate repository.

## Architecture

- **Frontend**: Next.js application using the App Router, React, TypeScript, and Tailwind CSS
- **Backend**: Separate ACS backend service maintained in its own repository
- **Containerization**: Backend repository includes Docker-related setup for local development

## Technical Stack

| Technology   | Version |
| ------------ | ------- |
| Next.js      | 16.2.x  |
| React        | 19.2.x  |
| Node.js      | 24.x    |
| Tailwind CSS | 4.x     |
| TypeScript   | 5.x     |

## Getting Started

### Prerequisites

- Node.js 24.x
- npm

### Install dependencies

```bash
npm install
```

### Configure environment variables

Copy `.env.example` to `.env.local` and adjust values if needed:

```bash
cp .env.example .env.local
```

The frontend expects the backend API to be available at `http://localhost:8080` during local development unless `NEXT_PUBLIC_API_URL` is overridden in `.env.local`.

### Start the development server

```bash
npm run dev
```

Open <http://localhost:3000> in your browser.

### Run lint/formatting

```bash
npm run lint

npx prettier --check . || npx prettier --list-different . | xargs -I{} sh -c 'echo "=== {} ===" && npx prettier {} | diff {} -'

* if prettier caught problems, fix with
npx prettier --write .
```

### Build the production version

```bash
npm run build
```

### Start the production server

```bash
npm run start
```

## Deployment

Deployment process is not defined yet.

## Docker and Backend

The backend service is maintained in a separate repository:

- Backend repo: <https://github.com/Team-Caffeine-ACS/acs-backend/>

Current status:

- Frontend Docker configuration is not yet included in this repository.
- The backend repository includes Docker-related setup for backend services.

For local full-stack development, run the backend separately and keep its API reachable at `http://localhost:8080`, or update `NEXT_PUBLIC_API_URL` in `.env.local`.

## Project Structure

This project currently uses the App Router from the repository root, not from `src/`.

```text
app/               App Router pages, layouts, and global styles
lib/               Shared utilities and helper functions
public/            Static assets
next.config.ts     Next.js configuration
eslint.config.mjs  ESLint configuration
postcss.config.mjs PostCSS configuration
```

As the frontend grows, shared UI, API, utility, and type modules can be added as dedicated top-level directories.

## Team

- Andrus Rähni - <https://github.com/mugulane>
- Ilja Sokolov - <https://github.com/ohotnik523>
- Martti Remmelgas - <https://github.com/dotmartti>
- Mathias Ranna - <https://github.com/mathiasranna>
- Ranno Männikust - <https://github.com/s1blik>
