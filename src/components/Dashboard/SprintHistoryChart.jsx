import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

const SprintHistoryChart = ({ data }) => {
  if (!data.fullWeeklyData) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card"
      style={{ marginBottom: '1.5rem', padding: '1.5rem', height: '400px' }}
    >
      <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>Historique des Sprints</h3>
      <ResponsiveContainer width="100%" height="100%">
          <BarChart
              data={[...data.fullWeeklyData].reverse()}
              margin={{
                  top: 5,
                  right: 10,
                  left: -20,
                  bottom: 0,
              }}
          >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                  dataKey="week" 
                  stroke="var(--text-secondary)" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `S${val}`}
              />
              <YAxis 
                  stroke="var(--text-secondary)" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
              />
              <Tooltip 
                  contentStyle={{ 
                      backgroundColor: '#1e1b4b', 
                      borderColor: 'rgba(255,255,255,0.1)', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' 
                  }}
                  itemStyle={{ color: '#e2e8f0', fontSize: '0.875rem' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '0.25rem', fontSize: '0.75rem' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 4 }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="target" name="Objectif" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="points" name="Fait" fill="var(--accent-blue)" radius={[4, 4, 0, 0]}>
                  {
                      [...data.fullWeeklyData].reverse().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.isHoliday ? 'rgba(255,255,255,0.05)' : (entry.points >= entry.target ? '#4ade80' : 'var(--accent-blue)')} />
                      ))
                  }
              </Bar>
          </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default SprintHistoryChart;
