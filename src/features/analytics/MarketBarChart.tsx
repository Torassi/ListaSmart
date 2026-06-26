/** MarketBarChart — ranking de mercados por competitividade (vezes mais barato). */
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_AXIS, CHART_CURSOR, CHART_GRID, CHART_TOOLTIP_STYLE, colorAt } from './chartTheme';
import type { MarketCompetitiveness } from '@/types';

interface MarketBarChartProps {
  data: MarketCompetitiveness[];
}

export function MarketBarChart({ data }: MarketBarChartProps) {
  const chartData = data.map((d) => ({ name: d.market.name, value: d.cheapestWins }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: CHART_AXIS }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: CHART_AXIS }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: CHART_CURSOR }}
          formatter={(value: number) => [`${value}x mais barato`, '']}
          contentStyle={CHART_TOOLTIP_STYLE}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={64}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={colorAt(i)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
