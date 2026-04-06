# Team Caffeine ACS Frontend

Frontend application for the Access Control System (ACS) project developed by Team Caffeine.

## Project Overview

This repository contains the Next.js frontend for the ACS system.
It provides the user interface for interacting with backend services maintained in a separate repository.

## Technical Stack

| Technology   | Version |
| ------------ | ------- |
| Next.js      | 16.2.0  |
| React        | 19.2.4  |
| Node.js      | 20.9+   |
| Tailwind CSS | 4.x     |
| TypeScript   | 5.x     |

## Project overview

This repository contains the frontend application for the ACS system.
The application provides the user interface for interacting with the backend services of the system.

## Architecture

- **Frontend**: Next.js-based React application using the App Router, TypeScript, and Tailwind CSS for styling
- **Containerization**: Docker for development environment

## Technical stack

| Technology   | Version              |
| ------------ | -------------------- |
| Next.js      | see package.json     |
| Node.js      | 20.x                 |
| Tailwind CSS | 4.x                  |
| TypeScript   | included via Next.js |

## Environment Setup

1. Install Docker (just Engine is enough but you can also install the whole Desktop) https://docs.docker.com/engine/install/

### Prerequisites

- Node.js 20+
- npm

### Install dependencies

```bash
npm install
```

## Development Commands

### Docker usage

```bash
# Start full development environment
docker compose up

# look at all the containers
docker ps -a
```

### Run development server

### Prerequisites

- Node.js 20.9 or newer
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

### Run linting

```bash
npm run lint
```

### Build the production version

```bash
npm run build
```

### Start the production server

```bash
npm run start
```

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
public/            Static assets
next.config.ts     Next.js configuration
eslint.config.mjs  ESLint configuration
postcss.config.mjs PostCSS configuration
```

As the frontend grows, shared UI, API, utility, and type modules can be added as dedicated top-level directories.

## Team

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Build production version

```bash
npm run build
```

### Start production server

```bash
npm run start
```

## Docker

Backend service is maintained in a separate repository:

- Backend repo: <https://github.com/Team-Caffeine-ACS/acs-backend/>

Current status:

- Frontend Docker configuration is not yet included in this repository.
- Backend repository includes a `Dockerfile`.

If you want to run frontend and backend together in Docker, define a shared `docker-compose.yml`
in one repository and include both services there.

## Project structure (initial)

```text
app/            Next.js pages, layouts and routing
components/     Reusable UI components
lib/            Shared utilities and helper functions
api/            API clients and backend communication
types/          TypeScript types and interfaces
public/         Static assets
styles/         Global styles
```

## Team

- Andrus Rähni – <https://github.com/mugulane>
- Ilja Sokolov – <https://github.com/ohotnik523>
- Martti Remmelgas – <https://github.com/dotmartti>
- Mathias Ranna – <https://github.com/mathiasranna>
- Ranno Männikust – <https://github.com/s1blik>
