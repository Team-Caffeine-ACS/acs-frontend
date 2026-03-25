<<<<<<< docs/01-andrus-readme-initial-project-structure
# Team Caffeine – ACS Frontend

Frontend application for the **Access Control System (ACS)** project developed by Team Caffeine.

## Project overview

This repository contains the frontend application for the ACS system.
The application provides the user interface for interacting with the backend services of the system.

## Technical stack

| Technology   | Version              |
| ------------ | -------------------- |
| Next.js      | 16.1.6               |
| Node.js      | 20.x                 |
| Tailwind CSS | 4.x                  |
| TypeScript   | included via Next.js |

## Getting started

### Prerequisites

* Node.js 20+
* npm

### Install dependencies

```bash
npm install
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
=======
# acs-frontend
Frontend for Team Caffeine AccessControlSystem

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
>>>>>>> main
