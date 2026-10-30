# AGENTS.md

## Adding fonts

Use variable fonts from Fontsource. Example with Roboto:

1. Install: `bun add @fontsource-variable/roboto`
2. Import once in `src/main.tsx`, next to the CSS import:

   ```ts
   import "@fontsource-variable/roboto"
   ```

3. Register the family as a Tailwind theme font in `src/index.css`:

   ```css
   @theme {
     --font-sans: "Roboto Variable", sans-serif;
   }
   ```

   Overriding `--font-sans` makes it the default font. For a secondary font, add a new token (e.g. `--font-display`) and use `font-display`.

## Icons

Always use the installed icon library, `@phosphor-icons/react`. Do not add other icon packages or inline SVGs for icons.

## New Convex project setup

After `bun x convex dev` creates the deployment, run `bun x @convex-dev/auth` to initialize Convex Auth (sets `SITE_URL`, `JWT_PRIVATE_KEY`, and `JWKS`, and creates the auth files). `@auth/core` does not need a separate install.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
