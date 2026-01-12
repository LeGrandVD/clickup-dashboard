import React from 'react';
import { motion } from 'framer-motion';

const Scorecard = ({ data, settings }) => {
  if (!data.metrics) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
      style={{ marginBottom: '1.5rem', padding: '1.5rem' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
          {/* Points Annuels (Target) */}
          <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Points annuels</p>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{data.metrics.annualTarget}</div>
          </div>
          
          {/* Total Points Fait */}
          <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total fait</p>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{data.metrics.totalPointsDone}</div>
          </div>
          
           {/* Journée de travail */}
          <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Journées</p>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{data.metrics.totalWorkDays}</div>
          </div>

           {/* Point par semaine */}
          <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Point / semaine</p>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{data.metrics.averagePointsPerWeek}</div>
          </div>
          
           {/* Points à faire */}
          <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Points à faire</p>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: data.metrics.annualRemaining >= 0 ? 'var(--text-primary)' : '#4ade80' }}>
                  {data.metrics.annualRemaining}
              </div>
          </div>

           {/* Vacances restantes */}
          <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Vacances restantes</p>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-purple)' }}>{Math.max(0, data.metrics.vacationRemaining)} sem</div>
          </div>
          
          {/* Vacation Metrics */}
          <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Vacances</p>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  <span style={{ color: data.metrics.vacationWeeksRemaining < 0 ? '#ef4444' : 'var(--text-primary)' }}>
                      {data.metrics.vacationWeeksUsed}
                  </span>
                   <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}> / {settings.vacationWeeks}</span>
              </div>
          </div>
      </div>
    </motion.div>
  );
};

export default Scorecard;
