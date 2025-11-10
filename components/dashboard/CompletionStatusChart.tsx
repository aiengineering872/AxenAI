'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from 'recharts';

interface CompletionSlice {
  name: string;
  value: number;
  color: string;
}

interface CompletionStatusChartProps {
  data: CompletionSlice[];
}

const tooltipStyles = {
  backgroundColor: 'var(--color-card)',
  border: '1px solid var(--color-card)',
  borderRadius: '8px',
};

const CompletionStatusChart: React.FC<CompletionStatusChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyles} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default CompletionStatusChart;

