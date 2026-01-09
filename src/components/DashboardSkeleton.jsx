import React from 'react';
import { motion } from 'framer-motion';

const DashboardSkeleton = () => {
  return (
    <div className="dashboard-container">
      {/* Header Skeleton */}
      <header style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="loading-skeleton skeleton-text" style={{ width: '150px', height: '1.5rem', marginBottom: '0' }}></div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div className="loading-skeleton skeleton-circle" style={{ width: '20px', height: '20px' }}></div>
              <div className="loading-skeleton skeleton-circle" style={{ width: '20px', height: '20px' }}></div>
            </div>
        </div>
        
        {/* Navigation Tabs Skeleton */}
        <div className="glass-card" style={{ padding: '0.5rem', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
             {[1, 2, 3].map(i => (
                 <div key={i} style={{ flex: 1, padding: '0 0.75rem' }}>
                    <div className="loading-skeleton skeleton-text" style={{ width: '100%', height: '1.5rem', borderRadius: '8px', marginBottom: 0 }}></div>
                 </div>
             ))}
        </div>
      </header>

      <div className="dashboard-view-layout">
          {/* LEFT COLUMN (Summary) */}
          <div className="dashboard-summary">
            
            {/* Status Card Skeleton */}
            <div className="glass-card" style={{ textAlign: 'center', marginBottom: '1.5rem', height: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loading-skeleton skeleton-circle" style={{ width: '48px', height: '48px', marginBottom: '1rem' }}></div>
                <div className="loading-skeleton skeleton-text" style={{ width: '60%', height: '1.25rem', marginBottom: '1rem' }}></div>
                <div className="loading-skeleton skeleton-text" style={{ width: '80%', height: '1rem', marginBottom: '1rem' }}></div>
                <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center' }}>
                    <div className="loading-skeleton skeleton-text" style={{ width: '40px', height: '1.5rem' }}></div>
                    <div className="loading-skeleton skeleton-text" style={{ width: '40px', height: '1.5rem' }}></div>
                </div>
            </div>

            {/* Progress Bar Skeleton */}
             <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div className="loading-skeleton skeleton-text" style={{ width: '80px', height: '1rem', marginBottom: 0 }}></div>
                    <div className="loading-skeleton skeleton-text" style={{ width: '40px', height: '1rem', marginBottom: 0 }}></div>
                 </div>
                 <div className="loading-skeleton skeleton-block" style={{ width: '100%', height: '8px', marginBottom: '0.5rem' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="loading-skeleton skeleton-text" style={{ width: '60px', height: '0.75rem', marginBottom: 0 }}></div>
                    <div className="loading-skeleton skeleton-text" style={{ width: '60px', height: '0.75rem', marginBottom: 0 }}></div>
                 </div>
             </div>


            {/* Stats Grid Skeleton */}
            <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
               {[1, 2].map(i => (
                 <div key={i} className="glass-card stat-card" style={{ padding: '1.5rem' }}>
                   <div className="loading-skeleton skeleton-block" style={{ width: '20px', height: '20px', marginBottom: '0.5rem' }}></div>
                   <div className="loading-skeleton skeleton-text" style={{ width: '30px', height: '1.25rem' }}></div>
                   <div className="loading-skeleton skeleton-text" style={{ width: '60px', height: '0.75rem' }}></div>
                 </div>
               ))}
            </div>
          </div>

          {/* RIGHT COLUMN (Tasks) */}
          <div className="glass-card dashboard-tasks" style={{ padding: '1rem' }}>
             <div className="loading-skeleton skeleton-text" style={{ width: '150px', height: '1.25rem', marginBottom: '1rem' }}></div>
             
             {/* Task Groups */}
             {[1, 2, 3].map(g => (
                 <div key={g} style={{ marginBottom: '1rem' }}>
                     {/* Group Header */}
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', padding: '0.5rem 0' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                             <div className="loading-skeleton skeleton-block" style={{ width: '16px', height: '16px' }}></div>
                             <div className="loading-skeleton skeleton-text" style={{ width: '80px', height: '1rem', marginBottom: 0 }}></div>
                          </div>
                     </div>
                     
                     {/* Task Cards */}
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                         {[1, 2].map(t => (
                             <div key={t} style={{ 
                                 display: 'flex', 
                                 justifyContent: 'space-between', 
                                 alignItems: 'center', 
                                 padding: '1rem', 
                                 borderRadius: '8px',
                                 background: 'rgba(255,255,255,0.03)',
                                 border: '1px solid rgba(255,255,255,0.05)'
                             }}>
                                 <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                                     {/* Status Line */}
                                     <div className="loading-skeleton skeleton-block" style={{ width: '4px', height: '100%', borderRadius: '2px' }}></div>
                                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '80%' }}>
                                         <div style={{ display: 'flex', gap: '0.5rem' }}>
                                             <div className="loading-skeleton skeleton-text" style={{ width: '40px', height: '0.625rem', marginBottom: 0 }}></div>
                                             <div className="loading-skeleton skeleton-text" style={{ width: '50px', height: '0.625rem', marginBottom: 0 }}></div>
                                         </div>
                                         <div className="loading-skeleton skeleton-text" style={{ width: '90%', height: '1rem', marginBottom: 0 }}></div>
                                     </div>
                                 </div>
                                 <div className="loading-skeleton skeleton-circle" style={{ width: '40px', height: '24px', borderRadius: '12px' }}></div>
                             </div>
                         ))}
                     </div>
                 </div>
             ))}
          </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
