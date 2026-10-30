# Finnova

Student association financial management frontend built with React, TypeScript, Vite, Tailwind CSS, and Lucide icons.

## Local development

Use Node.js 22 and Bun 1.3.14 or newer.

```sh
bun install --frozen-lockfile
bun run dev
```

## Production

```sh
bun run build
bun run preview
```

## Vercel

Import `briggsdavis/finnova` into Vercel, select the `main` branch, and keep the root directory at the repository root. The checked-in `vercel.json` sets the Vite framework, installation command, build command, `dist` output directory, and single-page application fallback.

No environment variables are required for the current frontend demo. The optional Convex template is not connected to the active interface or required for deployment.

## Demo data and access

This version uses centralized mock financial data and browser local storage. Role selection and access lists simulate permissions; they do not authenticate users or enforce server-side authorization. Data is private to the browser and is not shared between users. Deploy this version as a frontend demo. Real shared financial operations require backend persistence and authentication.
