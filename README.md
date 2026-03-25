# Team Caffeine – ACS Frontend

Frontend application for the **Access Control System (ACS)** project developed by Team Caffeine.

## Project overview

This repository contains the frontend application for the ACS system.
The application provides the user interface for interacting with the backend services of the system.

## Architecture

* **Frontend**: 
* **Containerization**: Docker for development environment

## Technical stack

| Technology   | Version              |
| ------------ | -------------------- |
| Next.js      | 16.1.6               |
| Node.js      | 20.x                 |
| Tailwind CSS | 4.x                  |
| TypeScript   | included via Next.js |

## Getting started

## Environment Setup 

1. Install Docker (just Engine is enough but you can also install the whole Desktop) https://docs.docker.com/engine/install/


### Prerequisites

* Node.js 20+
* npm

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

```bash
npm run dev
```

Open in browser:

```url
http://localhost:3000
```

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

* Backend repo: <https://github.com/Team-Caffeine-ACS/acs-backend/>

Current status:

* Frontend Docker configuration is not yet included in this repository.
* Backend repository includes a `Dockerfile`.

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

* Andrus Rähni – <https://github.com/mugulane>
* Ilja Sokolov – <https://github.com/ohotnik523>
* Martti Remmelgas – <https://github.com/dotmartti>
* Mathias Ranna – <https://github.com/mathiasranna>
* Ranno Männikust – <https://github.com/s1blik>
