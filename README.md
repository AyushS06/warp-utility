# Warp Headcount Planner

A comprehensive financial planning and headcount management tool for startups and growing companies. Plan hiring, forecast burn rates, analyze runway, and simulate scenarios with real-time calculations.

## Features

### Financial Inputs
- Configure cash on hand, existing burn rate, and revenue projections
- Set target runway goals and contingency buffers
- Track detailed income and expense breakdowns
- Historical burn rate analysis with period-based calculations
- Real-time financial metrics preview with formula tooltips

### Hiring Plan
- Add roles with salary, benefits, location multipliers, and equity
- Monthly and quarterly hiring board views with drag-and-drop scheduling
- Role templates for common positions
- Location-based salary adjustments
- Employment type support (full-time, contractor, part-time)
- Visual timeline for planned hires

### AI Insights
- Headcount cost-to-income ratio analysis
- Hiring capacity alerts based on runway projections
- Average cost per hire calculations
- Burn rate trend indicators comparing current vs historical performance
- Revenue coverage analysis
- Automated recommendations for financial health

### Scenarios & Simulations
- Delay hiring impact calculator
- Salary adjustment scenario modeling
- Revenue boost projections
- Break-even headcount goal seeker
- Fundraising and growth simulation
- Customer acquisition metrics (LTV, CAC, churn)

### Dashboard
- KPI cards with animated counting numbers
- Risk alerts for critical financial thresholds
- Sensitivity analysis with best/base/worst case scenarios
- Burn metrics summary
- Hiring overview table
- Interactive charts and visualizations

### Export & Sharing
- PDF export with comprehensive financial summary
- Starred metrics for custom output selection
- Print-ready formatting

### Additional Features
- Multi-currency support (USD, GBP, INR, EUR, JPY, CAD, AUD)
- Dark/light theme toggle
- Local storage persistence
- Responsive design
- Formula tooltips for transparency
- Real-time calculations

## Tech Stack

- Next.js 16 (React 19)
- TypeScript
- Tailwind CSS
- React Hook Form with Zod validation
- DnD Kit for drag-and-drop
- Recharts for data visualization
- Radix UI components

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Navigate to the source directory:
```bash
cd src
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Environment Setup

No environment variables are required for basic functionality. The application uses browser localStorage for data persistence.

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
│   ├── calculator/      # Financial input components
│   ├── dashboard/       # Dashboard and metrics
│   ├── hiring/          # Hiring plan components
│   ├── insights/        # AI insights
│   ├── scenarios/       # Scenario simulations
│   └── ui/              # Reusable UI components
├── contexts/            # React context providers
├── lib/                 # Utilities and business logic
│   ├── calculator.ts    # Core calculation engine
│   ├── currency.ts      # Currency formatting
│   └── schemas/         # Zod validation schemas
└── public/              # Static assets
```

## Usage

1. **Set Financial Inputs**: Start by entering your current cash position, burn rate, and revenue in the Financial Inputs section.

2. **Plan Hiring**: Add roles you plan to hire, set their start dates, and configure compensation details.

3. **Review Insights**: Check the AI Insights section for automated analysis and recommendations.

4. **Run Scenarios**: Use the Scenarios section to model different financial outcomes by adjusting hiring timelines, salaries, or revenue projections.

5. **Export Results**: Generate a PDF export of your financial plan for sharing or documentation.

## Data Persistence

All financial inputs, hiring plans, and settings are automatically saved to browser localStorage. Data persists across browser sessions.

## License

Private project for Warp take-home assessment.

## Research Notes

- Started by collecting raw financial metrics from the Gusto burn rate calculator CSV template. Fed the CSV into ChatGPT to extract definitions and formulas that informed the data cards, insights, and KPIs.
- Added a `shadCN` and Radix UI MCP integration to Cursor, plus an `AGENTS.md` reference file that pointed Cursor to the ChatGPT research doc.
- Specified UI requirements up front (card types, chart components, number animations, Lucide icons, typography inspired by Warp) so the front-end implementation matched the intended design system.
