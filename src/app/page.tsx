"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, LineChart, Bar, Line, XAxis, YAxis, CartesianGrid } from "recharts";

// Sample data for headcount scenario planning
// In a real app, this would come from user input
const timelineLength = 24; // months
const startingCash = 500000;
const monthlyRevenue = 50000;
const monthlyOpEx = 30000;

// Sample roles data
const sampleRoles = [
  { name: "Engineer", annualSalary: 120000, startMonth: 1 },
  { name: "Designer", annualSalary: 90000, startMonth: 3 },
  { name: "PM", annualSalary: 110000, startMonth: 5 },
  { name: "Engineer 2", annualSalary: 130000, startMonth: 7 },
];

const chartConfig = {
  "Total Burn": {
    label: "Total Burn",
    theme: {
      light: "hsl(220 70% 50%)",
      dark: "hsl(220 70% 60%)",
    },
  },
  "Cash Runway": {
    label: "Cash Runway",
    theme: {
      light: "hsl(340 75% 55%)",
      dark: "hsl(340 75% 65%)",
    },
  },
} satisfies ChartConfig;

export default function Home() {
  // Calculate monthly data inside component to avoid hydration issues
  const calculateMonthlyData = React.useMemo(() => {
    const data = [];
    let cumulativeBurn = 0;
    
    for (let month = 1; month <= timelineLength; month++) {
      // Calculate hiring expense (sum of monthly salaries for active roles)
      const hiringExpense = sampleRoles
        .filter(role => role.startMonth <= month)
        .reduce((sum, role) => sum + (role.annualSalary / 12), 0);
      
      // Calculate total burn
      const totalBurn = hiringExpense + monthlyOpEx - monthlyRevenue;
      
      // Calculate cash runway
      cumulativeBurn += totalBurn;
      const cashRunway = startingCash - cumulativeBurn;
      
      data.push({
        month: `Month ${month}`,
        monthNum: month,
        hiringExpense: Math.round(hiringExpense),
        totalBurn: Math.round(totalBurn),
        cashRunway: Math.round(cashRunway),
      });
    }
    
    return data;
  }, []);

  const monthlyData = calculateMonthlyData;

  // Find runway end (first month where cash runway < 0)
  const runwayEnd = monthlyData.find(d => d.cashRunway < 0)?.monthNum || timelineLength;

  // Chart data for Total Burn (Bar/Area Chart)
  const burnChartData = monthlyData.map(d => ({
    month: d.month,
    "Total Burn": d.totalBurn,
  }));

  // Chart data for Cash Runway (Line Chart)
  const runwayChartData = monthlyData.map(d => ({
    month: d.month,
    "Cash Runway": d.cashRunway,
  }));

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="w-full px-4 py-8">
        {/* Current Month Metrics - At the Top */}
        <div className="grid gap-6 mb-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Current Hiring Expense</CardTitle>
              <CardDescription>This month's total salary costs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium">
                ${monthlyData[monthlyData.length - 1]?.hiringExpense.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {sampleRoles.filter(r => r.startMonth <= timelineLength).length} active roles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Total Burn</CardTitle>
              <CardDescription>This month's burn rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium">
                ${monthlyData[monthlyData.length - 1]?.totalBurn.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Hiring + OpEx - Revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Cash Runway</CardTitle>
              <CardDescription>Remaining cash at end of timeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium">
                ${monthlyData[monthlyData.length - 1]?.cashRunway.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {monthlyData[monthlyData.length - 1]?.cashRunway < 0 ? "Negative" : "Positive"} balance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Core Calculation Visualizations - Below the Current Metrics */}
        <div className="grid gap-6 mb-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Total Burn Rate</CardTitle>
              <CardDescription>Monthly burn rate over time (Hiring Expense + OpEx - Revenue)</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <BarChart data={burnChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="Total Burn" fill="var(--color-Total Burn)" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cash Runway Impact</CardTitle>
              <CardDescription>Cash runway trend showing when it crosses zero</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <LineChart data={runwayChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="Cash Runway"
                    stroke="var(--color-Cash Runway)"
                    strokeWidth={3}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Key Input Metrics */}
        <div className="mb-6">
          <h2 className="text-xl font-medium mb-4">Key Input Metrics</h2>
          <div className="grid gap-6 w-full md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Starting Cash</CardTitle>
                <CardDescription>Initial cash on hand</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-medium">
                  ${startingCash.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>Non-hiring revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-medium">
                  ${monthlyRevenue.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Monthly OpEx</CardTitle>
                <CardDescription>Non-hiring expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-medium">
                  ${monthlyOpEx.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Timeline Length</CardTitle>
                <CardDescription>Scenario duration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-medium">{timelineLength} months</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Runway End - Prominent KPI */}
        <div className="mb-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Runway End</CardTitle>
              <CardDescription>The month when cash runway drops below zero</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-semibold text-center py-4">
                Month {runwayEnd}
              </div>
              {runwayEnd < timelineLength ? (
                <p className="text-center text-muted-foreground">
                  Cash will run out in {runwayEnd} months
                </p>
              ) : (
                <p className="text-center text-muted-foreground">
                  Cash runway extends beyond timeline
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
