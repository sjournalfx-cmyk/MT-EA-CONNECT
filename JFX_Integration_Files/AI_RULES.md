# AI Rules & Constraints

**CRITICAL:** You must follow these rules strictly when performing the integration. Failure to do so may break the existing application.

## 1. 🚫 Do Not Touch
-   **Existing Logic:** Do NOT modify any existing business logic in the JFX Journal App unless it directly conflicts with the new EA features.
-   **Configuration:** Do NOT change `next.config.js`, `tailwind.config.ts`, or `tsconfig.json` unless absolutely necessary for a missing dependency.
-   **Unrelated Components:** Do NOT edit any components in `src/components/` that are not part of this specific EA integration task.

## 2. ✅ Scope of Work
-   **Target Directories:** You are ONLY allowed to create/edit files in:
    -   `src/app/api/ea-webhook/` (for the backend route)
    -   `src/app/(dashboard)/ea-connect/` (for the frontend page)
    -   `src/lib/` (ONLY to add `firebase-admin.ts` if missing)
-   **Navigation:** You may edit the Sidebar/Navigation component to add the link to `/ea-connect`.

## 3. 🛡️ File Integrity
-   **Provided Code:** The code in `route.ts` and `page.tsx` (from `JFX_Integration_Files`) is tested and verified.
    -   **Do NOT** rewrite the logic.
    -   **Do NOT** change the variable names or data structures (they match the MQL5 EA).
    -   **ONLY** change imports (e.g., `@/lib/firebase`) to match the project's actual path aliases.

## 4. 🎨 Coding Standards
-   **Styling:** Use **Tailwind CSS** for all styling. Do not introduce new CSS files or styled-components.
-   **Language:** Use **TypeScript** strictly. No `.js` or `.jsx` files.
-   **UI Consistency:** Ensure the new "EA Connect" page looks consistent with the rest of the dashboard (dark mode, colors, fonts).

## 5. ⚠️ Safety Checks
-   **Dependencies:** Before running, check if `firebase-admin` and `zod` are installed. If not, ask the user or install them.
-   **Environment:** Ensure `FIREBASE_SERVICE_ACCOUNT_KEY` or similar env vars are present for the Admin SDK to work.

**Summary:** Your job is to **integrate** these specific files, not to refactor or "improve" the rest of the application.
