/** CategoryDonut — gráfico de rosca das categorias mais pesquisadas. */
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { colorAt } from './chartTheme';
import type { CategoryShare } from '@/types';

interface CategoryDonutProps {
  data: CategoryShare[];
}

export function CategoryDonut({ data }: CategoryDonutProps) {
  const chartData = data.map((d) => ({ name: d.category, value: d.searches }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={2}
          stroke="#FFFFFF"
          strokeWidth={2}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={colorAt(i)} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`${value} buscas`, '']}
          contentStyle={{ borderRadius: 12, border: '1px solid #E5EAF1', fontSize: 13 }}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value: string) => <span className="text-text-muted">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
