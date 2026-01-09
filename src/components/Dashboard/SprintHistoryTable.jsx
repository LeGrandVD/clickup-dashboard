import React from 'react';
import { motion } from 'framer-motion';

const SprintHistoryTable = ({ data }) => {
  if (!data.fullWeeklyData) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card"
      style={{ marginBottom: '1.5rem', padding: '0', overflow: 'hidden' }}
    >
      <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Détails des Sprints</h3>
      </div>
      <div style={{ overflowX: 'auto' }}>
          <table className="sprint-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '1rem', fontWeight: 500 }}>Sprint</th>
                      <th style={{ padding: '1rem', fontWeight: 500 }}>Date</th>
                      <th style={{ padding: '1rem', fontWeight: 500, textAlign: 'center' }}>Journées</th>
                      <th style={{ padding: '1rem', fontWeight: 500, textAlign: 'right' }}>Objectif</th>
                      <th style={{ padding: '1rem', fontWeight: 500, textAlign: 'right' }}>Fait</th>
                      <th style={{ padding: '1rem', fontWeight: 500, textAlign: 'right' }}>Restant</th>
                  </tr>
              </thead>
              <tbody>
                  {data.fullWeeklyData.map((week) => (
                      <tr key={week.week} style={{ borderTop: '1px solid rgba(255,255,255,0.02)', opacity: week.isHoliday ? 0.3 : 1 }}>
                          <td data-label="Sprint" style={{ padding: '1rem', fontWeight: 500 }}>Sprint {week.week}</td>
                          <td data-label="Date" style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{week.startDate}</td>
                          <td data-label="Journées" style={{ padding: '1rem', textAlign: 'center' }}>{week.workDays}</td>
                          <td data-label="Objectif" style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                              {week.isHoliday ? <span style={{fontSize: '0.75rem', opacity: 0.7}}>Vacances</span> : week.target}
                          </td>
                          <td data-label="Fait" style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: week.isHoliday ? 'var(--text-secondary)' : 'var(--accent-blue)' }}>
                              {week.points}
                          </td>
                          <td data-label="Restant" style={{ padding: '1rem', textAlign: 'right' }}>
                              {week.isHoliday ? '-' : (
                                  <span style={{ color: week.remaining <= 0 ? '#4ade80' : 'var(--text-primary)' }}>
                                      {week.remaining}
                                  </span>
                              )}
                          </td>
                      </tr>
                  ))}
              </tbody>
               <tfoot>
                   <tr style={{ borderTop: '2px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                      <td colSpan={2} style={{ padding: '1rem', fontWeight: 700, textAlign: 'right' }}>TOTAL</td>
                      <td data-label="Journées" style={{ padding: '1rem', textAlign: 'center', fontWeight: 700 }}>{data.metrics?.totalWorkDays || 0}</td>
                      <td data-label="Objectif" style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>{data.fullWeeklyData.reduce((acc, w) => acc + w.target, 0)}</td>
                      <td data-label="Fait" style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: 'var(--accent-blue)' }}>{data.metrics?.totalPointsDone || 0}</td>
                      <td data-label="Restant" style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>
                          {(() => {
                              const totalRemaining = data.fullWeeklyData.reduce((acc, w) => acc + (w.isHoliday ? 0 : w.remaining), 0);
                              return (
                                  <span style={{ color: totalRemaining <= 0 ? '#4ade80' : 'var(--text-primary)' }}>
                                      {totalRemaining}
                                  </span>
                              );
                          })()}
                      </td>
                  </tr>
              </tfoot>
          </table>
      </div>
    </motion.div>
  );
};

export default SprintHistoryTable;
