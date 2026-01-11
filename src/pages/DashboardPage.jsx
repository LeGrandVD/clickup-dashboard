import React, { useState } from 'react';
import { RefreshCw, ListTodo, CheckCircle2, ChevronDown, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardData } from '../hooks/useDashboardData';
import SettingsModal from '../SettingsModal';
import UserMenu from '../components/UserMenu';
import DashboardSkeleton from '../components/DashboardSkeleton';
import Scorecard from '../components/Dashboard/Scorecard';
import SprintHistoryChart from '../components/Dashboard/SprintHistoryChart';
import SprintHistoryTable from '../components/Dashboard/SprintHistoryTable';
import WeekView from '../components/Dashboard/WeekView';

const DashboardPage = () => {
  const { 
    data, 
    loading, 
    settings, 
    saveSettings, 
    currentDate, 
    setCurrentDate, 
    statusCheck, 
    rawData, 
    fetchData 
  } = useDashboardData();

  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard', 'week', 'year'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [expandedStatuses, setExpandedStatuses] = useState({});

  const handleLogout = () => {
      localStorage.removeItem('clickup_access_token');
      window.location.href = '/login';
  };

  const toggleStatus = (status) => {
    setExpandedStatuses(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  // Group tasks by status logic (UI specific, can stay here or move to hook if preferred, but it's pure UI transformation)
  const groupedTasks = data.taskList ? data.taskList.reduce((acc, task) => {
    const status = task.status;
    if (!acc[status]) {
      acc[status] = { tasks: [], color: task.statusColor };
    }
    acc[status].tasks.push(task);
    return acc;
  }, {}) : {};

  // Define status priority for sorting
  const getStatusPriority = (status) => {
    const s = status.toLowerCase();
    if (s.includes('à faire') || s.includes('to do')) return 1;
    if (s.includes('en cours') || s.includes('in progress')) return 2;
    if (s.includes('en attente') || s.includes('waiting')) return 3;
    if (s.includes('livré') || s.includes('delivered') || s.includes('done') || s.includes('complete')) return 4;
    return 100;
  };

  const sortedStatusKeys = Object.keys(groupedTasks).sort((a, b) => {
    return getStatusPriority(a) - getStatusPriority(b);
  });

  const progress = data.totalPoints > 0 ? (data.completedPoints / data.totalPoints) * 100 : 0;

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="dashboard-container">
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onSave={saveSettings}
        initialSettings={settings}
      />

      <header className="header-section" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Tableau de bord</h2>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={fetchData} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
              <UserMenu 
                  user={rawData?.currentUser} 
                  onLogout={handleLogout} 
                  onSettings={() => setIsSettingsOpen(true)} 
              />
            </div>
        </div>
        
        {/* Navigation */}
        <div className="glass-card" style={{ padding: '0.5rem', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <button 
                onClick={() => setViewMode('dashboard')}
                style={{ 
                    flex: 1,
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: 'none', 
                    background: viewMode === 'dashboard' ? 'rgba(255,255,255,0.1)' : 'transparent', 
                    color: viewMode === 'dashboard' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                Aperçu
            </button>
            <button 
                onClick={() => setViewMode('week')}
                style={{ 
                    flex: 1,
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: 'none', 
                    background: viewMode === 'week' ? 'rgba(255,255,255,0.1)' : 'transparent', 
                    color: viewMode === 'week' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                Semaine
            </button>
            <button 
                onClick={() => setViewMode('year')}
                style={{ 
                    flex: 1,
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: 'none', 
                    background: viewMode === 'year' ? 'rgba(255,255,255,0.1)' : 'transparent', 
                    color: viewMode === 'year' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                Année
            </button>
        </div>
      </header>

      {/* --- VIEW: YEAR (Scorecard + Table) --- */}
      {viewMode === 'year' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <Scorecard data={data} settings={settings} />
             <SprintHistoryChart data={data} />
             <SprintHistoryTable data={data} />
        </motion.div>
      )}

      {/* --- VIEW: WEEK (Daily Chart + Detail) --- */}
      {viewMode === 'week' && (
          <WeekView data={data} currentDate={currentDate} setCurrentDate={setCurrentDate} />
      )}

      {/* --- VIEW: DASHBOARD (Overview) --- */}
      {viewMode === 'dashboard' && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dashboard-view-layout">
          <div className="dashboard-summary">
            
            {/* STATUS CARD */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card"
              style={{ 
                  textAlign: 'center', 
                  marginBottom: '1.5rem',
                  background: statusCheck.isUpToDate 
                    ? 'linear-gradient(135deg, rgba(74, 222, 128, 0.1), rgba(34, 197, 94, 0.05))' 
                    : 'rgba(255, 255, 255, 0.03)',
                  border: statusCheck.isUpToDate 
                    ? '1px solid rgba(74, 222, 128, 0.2)' 
                    : '1px solid var(--card-border)'
              }}
            >
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                  {statusCheck.isUpToDate ? (
                     <div style={{ 
                         width: '48px', height: '48px', 
                         borderRadius: '50%', 
                         background: 'rgba(74, 222, 128, 0.2)', 
                         color: '#4ade80',
                         display: 'flex', alignItems: 'center', justifyContent: 'center'
                     }}>
                         <CheckCircle2 size={24} />
                     </div>
                  ) : (
                     <div style={{ 
                         width: '48px', height: '48px', 
                         borderRadius: '50%', 
                         background: 'rgba(239, 68, 68, 0.1)', 
                         color: '#ef4444',
                         display: 'flex', alignItems: 'center', justifyContent: 'center'
                     }}>
                         <ListTodo size={24} />
                     </div>
                  )}
              </div>
              
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  {statusCheck.isUpToDate ? "Excellent rythme !" : "Action requise"}
              </h3>
              
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                  {statusCheck.isUpToDate 
                    ? "Vous êtes à jour dans vos objectifs de la semaine. Continuez comme ça !"
                    : `Il vous manque ${Math.abs(Math.round(statusCheck.diff))} points pour être à jour sur votre semaine.`
                  }
              </p>

               <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.875rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontWeight: 600, color: statusCheck.isUpToDate ? '#4ade80' : 'var(--text-primary)' }}>
                            {data.weeklyPoints}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fait</span>
                    </div>
                     <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {Math.round(statusCheck.expectedPoints)}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Attendu</span>
                    </div>
               </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card"
              style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '1rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                 <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progression Sprint</h3>
                 <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{Math.round(progress)}%</span>
              </div>
              
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                   <div style={{ 
                       width: `${progress}%`, 
                       height: '100%', 
                       background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))',
                       borderRadius: '4px'
                   }}></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>{data.completedPoints} pts faits</span>
                <span>{data.totalPoints} pts total</span>
              </div>
            </motion.div>

            <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card stat-card"
              >
                <div style={{ color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>
                  <ListTodo size={20} />
                </div>
                <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{data.tasksRemaining}</span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Tâches restantes</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card stat-card"
              >
                <div style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>
                  <Calendar size={20} />
                </div>
                
                {data.daysLeft > 0 ? (
                    <>
                        <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{data.daysLeft}</span>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                            Jours restants
                            {data.bufferDays > data.daysLeft && (
                                <span style={{ display: 'block', fontSize: '0.65rem', opacity: 0.7, marginTop: '2px' }}>
                                    + {data.bufferDays - data.daysLeft}j buffer
                                </span>
                            )}
                        </p>
                    </>
                ) : (
                    <>
                         <span style={{ 
                             fontSize: '1.25rem', 
                             fontWeight: 600, 
                             color: data.bufferDays > 0 ? '#f59e0b' : 'var(--text-primary)' 
                         }}>
                            {Math.max(0, data.bufferDays)}
                         </span>
                         <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                            {data.bufferDays > 0 ? 'Jours Buffer' : 'Terminé'}
                         </p>
                    </>
                )}
              </motion.div>
            </div>
          </div>
    
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card dashboard-tasks"
            style={{ padding: '1rem' }}
          >
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', textAlign: 'left' }}>Tâches du sprint</h3>
            
            {Object.keys(groupedTasks).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sortedStatusKeys.map(status => {
                  const { tasks: unsortedTasks, color } = groupedTasks[status];
                  const tasks = [...unsortedTasks].sort((a, b) => b.points - a.points);
                  const isExpanded = !!expandedStatuses[status]; // Default false
                  const groupPoints = tasks.reduce((acc, t) => acc + t.points, 0);

                  return (
                    <div key={status} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button 
                        onClick={() => toggleStatus(status)}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          width: '100%', 
                          background: 'none', 
                          border: 'none', 
                          padding: '0.5rem 0', 
                          cursor: 'pointer', 
                          color: 'var(--text-primary)'
                        }}
                      >
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                               <ChevronDown size={16} />
                            </motion.div>
                            <span style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: 600, 
                              textTransform: 'uppercase',
                              color: color || 'var(--text-primary)'
                            }}>
                              {status}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                              ({tasks.length})
                            </span>
                         </div>
                         <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                           {groupPoints} pts
                         </span>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            style={{ overflow: 'hidden' }}
                          >
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '0.5rem' }}>
                                {tasks.map(task => (
                                  <div key={task.id} style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    padding: '1rem', 
                                    borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                  }} className="task-card">
                                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: task.statusColor }}></div>
                                      
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, marginRight: '1rem' }}>
                                         <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                             {task.project && (
                                                <span style={{ 
                                                    fontSize: '0.625rem', 
                                                    textTransform: 'uppercase', 
                                                    letterSpacing: '0.05em', 
                                                    color: 'var(--text-secondary)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px'
                                                }}>
                                                    {task.project}
                                                </span>
                                             )}
                                             <span style={{ fontSize: '0.625rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>#{task.customId || task.id.slice(0,5)}</span>
                                         </div>
                                         <span style={{ fontWeight: 500, fontSize: '0.9375rem', lineHeight: '1.4' }}>{task.name}</span>
                                      </div>
                                      
                                      <div style={{ 
                                          background: 'rgba(255,255,255,0.05)', 
                                          padding: '0.25rem 0.75rem', 
                                          borderRadius: '100px', 
                                          fontSize: '0.875rem', 
                                          fontWeight: 600,
                                          color: 'var(--accent-blue)',
                                          minWidth: '3rem',
                                          textAlign: 'center'
                                      }}>
                                          {task.points}
                                      </div>
                                  </div>
                                ))}
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ) : (
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Aucune tâche trouvée pour ce sprint.</p>
            )}
          </motion.div>
      </motion.div>
      )}
    </div>
  );
};

export default DashboardPage;
