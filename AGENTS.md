# Agent Onboarding & Repository Guide: `faang-sched-gen`

This document provides a comprehensive overview of the `faang-sched-gen` (Schedule FA Generator) repository. It outlines the codebase structure, tech stack, configuration files, build/deploy processes, and core business logic to help new developers or AI agents get up to speed quickly.

---

## 1. Project Overview
`faang-sched-gen` is a client-side web application designed to help Indian taxpayers generate **Schedule FA (Foreign Assets)** details for their foreign equity investments—specifically optimized for FAANG stocks (AAPL, AMZN, MSFT, GOOGL, META, NFLX) but also supporting custom equities via user-uploaded CSV files.

The application calculates three critical values in Indian Rupees (INR) for each asset according to Indian tax laws:
- **Initial Value**: The purchase value of the asset.
- **Peak Value**: The highest valuation reached by the holdings during the calendar year.
- **Closing Value**: The value of the asset at the close of the calendar year (December 31st).

Forex conversions are performed using State Bank of India (SBI) Reference Rates (TT Buy rates) on the respective dates.

---

## 2. Tech Stack

- **Core Framework**: [Next.js v15.5.3](https://nextjs.org/) (App Router, static export target)
- **UI Library**: [React v19.1.0](https://react.dev/)
- **Programming Language**: [TypeScript v5](https://www.typescriptlang.org/)
- **Styling & Theme**:
  - [Tailwind CSS v4](https://tailwindcss.com/) (using `@tailwindcss/postcss` for compilation)
  - [Radix UI](https://www.radix-ui.com/) primitives
  - [Shadcn UI](https://ui.shadcn.com/) components (installed under `src/components/ui`)
  - [Next Themes](https://github.com/pacocoursey/next-themes) for dark/light mode toggle
- **Form Management**: [React Hook Form v7.62.0](https://react-hook-form.com/)
- **Linting & Formatting**: [Biome v2.2.0](https://biomejs.dev/) (fast, single-tool alternative to ESLint & Prettier)
- **CSV & Data Utilities**:
  - [PapaParse v5.5.3](https://www.papaparse.org/) (CSV parser)
  - [Date-Fns v4.1.0](https://date-fns.org/) (Date manipulation and validation)
  - [Lucide React](https://lucide.dev/) (Icons)
- **Package Manager**: [Bun v1.2+](https://bun.sh/)

---

## 3. Directory Structure

```text
faang-sched-gen/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment configuration
├── public/                     # Static assets (favicons, SVGs, etc.)
├── src/
│   ├── app/
│   │   ├── result/
│   │   │   └── page.tsx        # Calculation display and CSV export view (/result)
│   │   ├── globals.css         # Tailwind directives and CSS theme variables
│   │   ├── InvestmentForm.tsx  # Dynamic multi-investment input sub-form
│   │   ├── layout.tsx          # Root layout setup (fonts, theme provider wrapper)
│   │   └── page.tsx            # Main input form entry point (/)
│   ├── components/
│   │   ├── custom/
│   │   │   ├── CommonNavBar.tsx      # Navigation bar (Github link, Home link)
│   │   │   ├── DownloadCSVButton.tsx # CSV download trigger
│   │   │   ├── TaxSheetImporter.tsx  # Multi-slot UI for importing employer tax sheets
│   │   │   └── theme-provider.tsx    # Next-themes wrapper context
│   │   └── ui/                       # Reusable shadcn/radix primitives (Button, Calendar, Table, etc.)
│   └── lib/
│       ├── amazonTaxSheet.ts   # Amazon RSU tax-sheet parser + RsuTaxSheetAdapter contract
│       ├── computeFA.ts        # Primary calculation engine for Schedule FA values
│       ├── dataLoaders.ts      # Fetchers for SBI rates and stock price CSVs
│       ├── lookupUtils.ts      # Lookup logic for nearest date matches
│       ├── scheduleFAExport.ts # CSV formatter matching Schedule FA A3 columns
│       ├── taxSheetRegistry.ts # Central registry of all RsuTaxSheetAdapter instances
│       └── utils.ts            # Tailwind class merging helper (cn)
├── biome.json                  # Biome linting, formatting, and import organization config
├── components.json             # Shadcn UI structure mapping config
├── next.config.ts              # Next.js configurations (configured for static export)
├── package.json                # Project dependencies, metadata, and script tasks
├── postcss.config.mjs          # PostCSS config using @tailwindcss/postcss
└── tsconfig.json               # TypeScript compiler config
```

---

## 4. Key Configuration Files

### Next.js Configuration (`next.config.ts`)
Configured to generate a static site export (`output: "export"`) with a dynamic base path via `process.env.PAGES_BASE_PATH` to support hosting in a subfolder on GitHub Pages:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.PAGES_BASE_PATH,
};

export default nextConfig;
```

### Biome Configuration (`biome.json`)
Consolidates linting and formatting rules. It enables VCS integration for git ignores, formats using a 2-space indentation width, and has recommended linting enabled for React and Next.js projects:
- **Lint command**: `bun run lint` (`biome check`)
- **Format command**: `bun run format` (`biome format --write`)

### Shadcn UI Configuration (`components.json`)
Maps component and utility aliases (e.g. `@/components`, `@/lib`, `@/components/ui`) and specifies the visual style (`new-york` variant).

---

## 5. Core Business & Calculation Logic (`src/lib`)

Schedule FA requires calculations corresponding to the **Calendar Year** (January 1 to December 31) that fits within the target **Assessment Year** (AY) in India.

### Calculations Pipeline (`src/lib/computeFA.ts`)
1. **Reporting Period Resolution**:
   - Assesses the corresponding Calendar Year based on the selected Assessment Year.
   - Example: Assessment Year `2025-2026` translates to Reporting Period/Calendar Year `2024`.
2. **Forex & Stock Data Loading** (`src/lib/dataLoaders.ts`):
   - SBI Exchange Rates (USD/INR) are fetched from a CSV hosted on `crazystylus.github.io/faang-sched-gen`.
   - Stock prices for pre-configured FAANG tickets are fetched online, or parsed from a custom uploaded CSV.
3. **Value Computations**:
   - **Initial Value**: 
     - Computed as `Units * Price` on the date of purchase (or custom FMV if supplied).
     - If it is marked as an "old asset" (purchased before the current reporting period), the initial value calculation is omitted.
     - Converted to INR using the SBI TT Buy rate on the date of investment.
   - **Peak Value**:
     - Scans stock data from the investment date (or January 1st of the reporting year for old assets) to December 31st.
     - Identifies the day with the highest `High` price.
     - Converts `Units * Peak Price` to INR using the SBI TT Buy rate of the peak date.
   - **Closing Value**:
     - Scans stock data to find the last trading day on or before December 31st.
     - Calculates `Units * Closing Price`.
     - Converts to INR using the SBI TT Buy rate of the closing date.

### CSV Export Schema (`src/lib/scheduleFAExport.ts`)
Formatted to align with **Schedule FA (Table A3 - Details of Foreign Equity and Debt Interest)**, mapping the following columns:
1. Country/Region Name (Defaults to "UNITED STATES OF AMERICA")
2. Country Code ("2" for USA)
3. Name of Entity (Automatically resolves addresses for FAANG tickets, e.g. Amazon, Google, Apple)
4. Address of Entity
5. ZIP Code
6. Nature of Entity ("Company")
7. Date of acquiring the interest
8. Initial value of the investment
9. Peak value of investment during the period
10. Closing balance
11. Gross amount paid/credited (Blank)
12. Gross proceeds from sale (Blank)

---

## 6. Tax-Sheet Adapter System

The application supports importing employer-provided RSU/equity tax sheets to auto-populate investment rows. The system is built around a small, stable interface so new employer adapters can be added without touching any UI code.

### Adapter Contract (`src/lib/amazonTaxSheet.ts`)

Every adapter must implement the `RsuTaxSheetAdapter` interface:

```typescript
export interface RsuTaxSheetAdapter {
  id: string;          // Unique machine-readable key (e.g. "amazon-rsu-tax-sheet")
  label: string;       // Human-readable name shown in the UI dropdown
  accept: string;      // HTML file-input accept string (e.g. ".xlsx,.xls,.csv")
  importFile: (file: File) => Promise<InvestmentInput[]>;
}
```

`importFile` receives the raw `File` object and must resolve with an array of `InvestmentInput` records (or reject with a descriptive `Error`).

### Registry (`src/lib/taxSheetRegistry.ts`)

`TAX_SHEET_ADAPTERS` is the single source of truth — an ordered array of all registered adapter objects:

```typescript
export const TAX_SHEET_ADAPTERS: RsuTaxSheetAdapter[] = [
  amazonRsuTaxSheetAdapter,
  // add new adapters here
];
```

The UI reads this array at render time, so **adding an entry here is the only change needed** to surface a new employer in the dropdown.

A `getAdapterById(id)` helper is also exported for O(1) lookups by adapter id.

### UI (`src/components/custom/TaxSheetImporter.tsx`)

`<TaxSheetImporter onImport={fn} />` renders a card with one or more "sheet slots". Each slot lets the user:
1. Pick an adapter from the dropdown (populated from `TAX_SHEET_ADAPTERS`).
2. Upload the corresponding file (filtered by `adapter.accept`).
3. See per-slot status: loading / success / error.
4. Add additional slots (e.g. multiple Amazon grant years) or remove unwanted ones.

On successful parse, `onImport(investments)` is called and the parent form appends the rows.

### Currently registered adapters

| id | label | Accepted formats | Source file |
|----|-------|-----------------|-------------|
| `amazon-rsu-tax-sheet` | Import Amazon RSU tax sheet | `.xlsx`, `.xls`, `.csv` | `src/lib/amazonTaxSheet.ts` |

### Adding a new adapter (checklist)

1. Create `src/lib/<employer>TaxSheet.ts` and implement `RsuTaxSheetAdapter`.
2. Export the adapter object from that file.
3. Import it in `src/lib/taxSheetRegistry.ts` and append it to `TAX_SHEET_ADAPTERS`.
4. Add a row to the table above in this document.
5. Run `bun run build` to confirm no type errors.

---

## 7. Scripts & Workflow Commands

All scripts are executed via Bun:

### Development Server
Starts a local Turbopack-powered Next.js development server:
```bash
bun run dev
```

### Static Build
Compiles the application and generates the static HTML export in the `out/` directory:
```bash
bun run build
```

### Local Preview
Serves the statically built production code locally:
```bash
bun run start
```

### Linting & Formatting
Checks for formatting, code style, imports structure, and static analysis:
```bash
# Check code style, linting errors and import orders
bun run lint

# Automatically format code changes
bun run format
```

---

## 7. Deployment Pipeline (`.github/workflows/deploy.yml`)
The site is built and deployed automatically to GitHub Pages on every push to the `mainline` branch:
1. Spawns an Ubuntu environment and checks out the code.
2. Installs Node.js v22 and installs dependencies via `npm install` (or custom build step).
3. Sets up GitHub Pages metadata via `actions/configure-pages@v5`.
4. Runs `npm run build` with the `PAGES_BASE_PATH` set to the repository directory.
5. Uploads the statically exported `out/` folder using `actions/upload-pages-artifact@v3`.
6. Deploys to GitHub Pages using `actions/deploy-pages@v4`.
