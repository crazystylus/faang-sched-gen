# FA Ledger

**Track foreign assets and generate ITR-ready Schedule FA schedules.**

🌐 **Live app: [crazystylus.github.io/faang-sched-gen](https://crazystylus.github.io/faang-sched-gen/)**

A client-side tool for preparing the values needed for Schedule FA, Table A3 (foreign equity and debt interest), for Indian income-tax returns.

It supports the included US equities (AAPL, AMZN, MSFT, GOOGL, META, and NFLX) and custom equities through a price-history CSV upload.

## What it calculates

For the calendar year associated with the selected assessment year, the app calculates:

- Initial value of the investment, when the necessary historic data is available
- Peak value during the reporting period
- Closing value as of 31 December, using the last available trading day

USD amounts are converted to INR using SBI USD TT Buy reference rates. When a rate is not available for a date (for example, a weekend or bank holiday), the calculation uses the most recent earlier positive published rate.

The generated CSV follows the fields used by Schedule FA Table A3. It is a convenience tool; review the output against the applicable ITR instructions and your records before filing.

## Data and privacy

The application runs entirely in your browser. Investment entries and uploaded custom CSV data are kept in browser storage only so that the results page can read them after navigation. They are not sent to an application server, stored in a database, or shared by this project.

The app requests only two public data sources needed for calculations:

- Stock price-history CSVs for the built-in equities
- SBI USD reference-rate CSV data, including the TT Buy rate

Both are fetched from this project's public GitHub Pages data files. For a custom equity, the stock-price CSV is read locally in the browser.

## RSUs and older holdings

For a typical RSU lot, use the vest date as the acquisition date. The initial value is normally the vest-date fair market value or cost basis from your employer or broker record. Peak and closing values are calculated for the calendar year selected in the app.

Enter the number of shares that remained in your account after any sell-to-cover transaction for taxes. For example, if 100 shares vested and 35 were sold to cover taxes, enter 65 shares for the remaining holding. Shares sold during the reporting year may require separate reporting of sale proceeds and capital gains; review the applicable ITR instructions and your records.

Built-in stock-price and SBI TT Buy data begin in 2020. The app calculates an initial value for an older acquisition only when the required historic data is available. If the acquisition predates the available data, the initial value is left blank for manual review rather than estimated. The CSV download shows a confirmation message whenever this occurs.

## Refreshing the committed data

The data files are deliberately committed to `public/` so that a deployed static site has a fixed, reviewable data set. To refresh them before an annual update, run:

```bash
bun run refresh-data
```

This downloads daily price history for the built-in equities from Yahoo Finance and replaces `public/SBI_REFERENCE_RATES_USD.csv` with the current file from [sahilgupta/sbi-fx-ratekeeper](https://github.com/sahilgupta/sbi-fx-ratekeeper). Review the resulting CSV diff, run the checks, and commit the updated files.

When running `bun run dev`, the application reads the data from the local `public/` directory. Production deployments read the same committed files from this project's GitHub Pages site.

## Development

This project uses Bun.

```bash
bun install
bun run dev
```

Useful checks:

```bash
bun test
bun run lint
bun run build
```

## Expected custom CSV columns

Custom stock-price CSVs must include these columns:

```text
Date,Close/Last,High
```

Dates may be `MM/DD/YYYY` or ISO-style `YYYY-MM-DD`. Currency values may include a dollar sign.

## Acknowledgement

SBI reference-rate data is sourced from [sahilgupta/sbi-fx-ratekeeper](https://github.com/sahilgupta/sbi-fx-ratekeeper). Thank you to the maintainers for publishing and updating the dataset.
