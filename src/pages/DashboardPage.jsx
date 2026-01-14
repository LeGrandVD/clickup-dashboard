import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ListTodo, CheckCircle2, ChevronDown, Calendar, Target, Bug, Folder, Calculator, CheckSquare, Square, X, GripVertical } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useDashboardData } from '../hooks/useDashboardData';
import SettingsModal from '../SettingsModal';
import UserMenu from '../components/UserMenu';
import DashboardSkeleton from '../components/DashboardSkeleton';
import Scorecard from '../components/Dashboard/Scorecard';
import SprintHistoryChart from '../components/Dashboard/SprintHistoryChart';
import SprintHistoryTable from '../components/Dashboard/SprintHistoryTable';
import WeekView from '../components/Dashboard/WeekView';

const DashboardPage = () => {
  const isDragging = React.useRef(false);
  const { 
    data, 
    loading, 
    settings, 
    saveSettings, 
    currentDate, 
    setCurrentDate, 
    statusCheck, 
    rawData, 
    fetchData,
    debugOverride,
    setDebugOverride
  } = useDashboardData();

  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard', 'week', 'year'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [expandedStatuses, setExpandedStatuses] = useState({});
  const [showDebug, setShowDebug] = useState(false);
  
  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(() => {
      const saved = localStorage.getItem('dashboard_selection_mode');
      return saved === 'true';
  });
  const [selectedTaskIds, setSelectedTaskIds] = useState(() => {
      const saved = localStorage.getItem('dashboard_selected_tasks');
      // Ensure we always have an array, even if migrating from Set logic (JSON.parse of Set string might need care if it was stored as object, but previously it was stored as Array.from(set) so it's ALREADY an array in localStorage)
      try {
          return saved ? JSON.parse(saved) : [];
      } catch (e) {
          return [];
      }
  });

  // Persistence Effects
  React.useEffect(() => {
      localStorage.setItem('dashboard_selection_mode', isSelectionMode);
  }, [isSelectionMode]);

  React.useEffect(() => {
      localStorage.setItem('dashboard_selected_tasks', JSON.stringify(selectedTaskIds));
  }, [selectedTaskIds]);

  const navigate = useNavigate();

  const handleLogout = () => {
      localStorage.removeItem('clickup_access_token');
      navigate('/login');
  };

  const handleTaskClick = (task) => {
    if (settings.openLinksIn === 'web') {
      window.open(task.url, '_blank');
    } else {
      window.location.href = task.appUrl;
    }
  };

  const toggleStatus = (status) => {
    setExpandedStatuses(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  // Helper to toggle task selection
  const toggleTaskSelection = (taskId) => {
    setSelectedTaskIds(prev => {
        if (prev.includes(taskId)) {
            return prev.filter(id => id !== taskId);
        } else {
            return [...prev, taskId];
        }
    });
  };

  const handleToggleSelectionMode = () => {
      if (isSelectionMode) {
          setIsSelectionMode(false);
          // Do NOT clear selectedTaskIds here, so plan remains visible
      } else {
          setIsSelectionMode(true);
      }
  };

  // Group tasks by status (Top level)
  const groupedTasksByStatus = data.taskList ? data.taskList.reduce((acc, task) => {
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

  const sortedStatusKeys = Object.keys(groupedTasksByStatus).sort((a, b) => {
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="Logo" style={{ height: '3rem', width: 'auto', borderRadius: '20%' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, textAlign: 'right' }}>
                    Multiplicateur
                </span>
                <button 
                    onClick={() => saveSettings({ ...settings, pointsMetric: settings.pointsMetric === 'sprint' ? 'total' : 'sprint' })}
                    style={{
                        width: '44px',
                        height: '24px',
                        background: settings.pointsMetric === 'total' ? '#4ade80' : 'rgba(255,255,255,0.2)',
                        borderRadius: '99px',
                        position: 'relative',
                        cursor: 'pointer',
                        border: 'none',
                        padding: '2px',
                        transition: 'background 0.3s ease',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <motion.div 
                        animate={{ 
                            x: settings.pointsMetric === 'total' ? 20 : 0
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        style={{
                            width: '20px',
                            height: '20px',
                            background: 'white',
                            borderRadius: '50%',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                    />
                </button>
            </div>
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
          <WeekView data={data} currentDate={currentDate} setCurrentDate={setCurrentDate} settings={settings} />
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
                  background: !statusCheck.isUpToDate
                    ? 'rgba(255, 255, 255, 0.03)'
                    : statusCheck.pointsToDoToday > 0
                        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))'
                        : 'linear-gradient(135deg, rgba(74, 222, 128, 0.1), rgba(34, 197, 94, 0.05))',
                  border: !statusCheck.isUpToDate
                    ? '1px solid var(--card-border)'
                    : statusCheck.pointsToDoToday > 0
                        ? '1px solid rgba(59, 130, 246, 0.2)'
                        : '1px solid rgba(74, 222, 128, 0.2)'
              }}
            >
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                  {!statusCheck.isUpToDate ? (
                     <div style={{ 
                         width: '48px', height: '48px', 
                         borderRadius: '50%', 
                         background: 'rgba(239, 68, 68, 0.1)', 
                         color: '#ef4444',
                         display: 'flex', alignItems: 'center', justifyContent: 'center'
                     }}>
                         <ListTodo size={24} />
                     </div>
                  ) : statusCheck.pointsToDoToday > 0 ? (
                     <div style={{ 
                         width: '48px', height: '48px', 
                         borderRadius: '50%', 
                         background: 'rgba(59, 130, 246, 0.1)', 
                         color: '#3b82f6',
                         display: 'flex', alignItems: 'center', justifyContent: 'center'
                     }}>
                         <Target size={24} />
                     </div>
                  ) : (
                     <div style={{ 
                         width: '48px', height: '48px', 
                         borderRadius: '50%', 
                         background: 'rgba(74, 222, 128, 0.2)', 
                         color: '#4ade80',
                         display: 'flex', alignItems: 'center', justifyContent: 'center'
                     }}>
                         <CheckCircle2 size={24} />
                     </div>
                  )}
              </div>
              
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  {!statusCheck.isUpToDate 
                    ? "Action requise" 
                    : statusCheck.pointsToDoToday > 0
                        ? "Objectif du jour"
                        : "Excellent rythme !"
                  }
              </h3>
              
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                  {!statusCheck.isUpToDate 
                    ? `Il vous manque ${Math.abs(Math.round(statusCheck.diff * 4) / 4)} points pour être à jour sur votre semaine. Objectif total pour aujourd'hui : ${Math.round(statusCheck.pointsToDoToday * 4) / 4} points.`
                    : statusCheck.pointsToDoToday > 0
                        ? `Vous avez ${Math.round(statusCheck.pointsToDoToday * 4) / 4} points à valider aujourd'hui.`
                        : "Vous êtes à jour dans vos objectifs de la semaine. Continuez comme ça !"
                  }
              </p>

              <div style={{ width: '100%', maxWidth: '240px', margin: '0 auto 1.5rem auto' }}>
                <div style={{ 
                    width: '100%', 
                    height: '6px', 
                    background: 'rgba(255,255,255,0.1)', 
                    borderRadius: '100px', 
                    overflow: 'hidden'
                }}>
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, (statusCheck.currentPoints / (statusCheck.expectedByEndOfToday || 1)) * 100))}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        style={{ 
                            height: '100%', 
                            background: !statusCheck.isUpToDate 
                                ? '#ef4444' 
                                : statusCheck.pointsToDoToday > 0 
                                    ? '#3b82f6' 
                                    : '#4ade80',
                            borderRadius: '100px'
                        }}
                    />
                </div>
              </div>

               <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.875rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontWeight: 600, color: statusCheck.isUpToDate ? '#4ade80' : 'var(--text-primary)' }}>
                            {Math.round(statusCheck.currentPoints * 4) / 4}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fait</span>
                    </div>
                     <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {Math.round(statusCheck.expectedByEndOfToday * 4) / 4}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Objectif</span>
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
    

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
            {selectedTaskIds.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="glass-card"
                    style={{ padding: '1rem', border: '1px solid rgba(59, 130, 246, 0.2)', background: 'rgba(59, 130, 246, 0.05)' }}
                >
                     <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#3b82f6' }}>
                        <Calculator size={20} />
                        Planification du jour
                        <span style={{ 
                            fontSize: '0.75rem', 
                            background: 'rgba(59, 130, 246, 0.1)', 
                            color: '#3b82f6', 
                            padding: '2px 8px', 
                            borderRadius: '100px',
                            fontWeight: 600 
                        }}>
                             {selectedTaskIds.reduce((sum, id) => {
                                 const task = data.taskList.find(t => t.id === id);
                                 return sum + (task ? (settings.pointsMetric === 'sprint' ? task.sprintPoints : task.points) : 0);
                             }, 0)} pts
                        </span>
                    </h3>
                    
                    <Reorder.Group 
                        axis="y" 
                        values={selectedTaskIds} 
                        onReorder={setSelectedTaskIds}
                        style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', listStyle: 'none', margin: 0, padding: 0 }}
                    >
                        {selectedTaskIds.map(id => {
                            const task = data.taskList.find(t => t.id === id);
                            if (!task) return null;
                            
                            return (
                                <Reorder.Item 
                                    key={task.id}
                                    value={task.id}
                                    style={{ position: 'relative' }}
                                    initial={{ scale: 1 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 1 }}
                                    whileDrag={{ scale: 1.02, zIndex: 10 }}
                                    onDragStart={() => isDragging.current = true}
                                    onDragEnd={() => setTimeout(() => isDragging.current = false, 100)}
                                >
                                    <div 
                                        className="task-card"
                                        onClick={(e) => {
                                            if (isDragging.current) {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                return;
                                            }
                                            handleTaskClick(task);
                                        }}
                                        style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center', 
                                            padding: '1rem', 
                                            paddingLeft: '0.5rem',
                                            borderRadius: '8px',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }} 
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                        }}
                                    >
                                         {/* Drag Handle */}
                                         <div 
                                            style={{ 
                                                padding: '0 0.5rem', 
                                                cursor: 'grab', 
                                                color: 'var(--text-secondary)', 
                                                display: 'flex', 
                                                alignItems: 'center',
                                                opacity: 0.5
                                            }}
                                            onMouseEnter={(e) => e.target.style.opacity = 1}
                                            onMouseLeave={(e) => e.target.style.opacity = 0.5}
                                         >
                                            <GripVertical size={16} />
                                         </div>

                                         {/* Status Line */}
                                         <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: task.statusColor }}></div>
                                         
                                         {/* Task Details */}
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
    
                                         {/* Actions */}
                                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                                                 {settings.pointsMetric === 'sprint' ? task.sprintPoints : task.points}
                                             </div>
                                             
                                             <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleTaskSelection(task.id);
                                                }}
                                                style={{
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    padding: '6px',
                                                    cursor: 'pointer',
                                                    color: '#ef4444',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s'
                                                }}
                                                title="Retirer de la planification"
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                             >
                                                 <X size={16} />
                                             </button>
                                         </div>
                                    </div>
                                </Reorder.Item>
                            );
                        })}
                    </Reorder.Group>
                </motion.div>
            )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card dashboard-tasks"
            style={{ padding: '1rem' }}
          >
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span>Tâches du sprint</span>
                     <button
                        onClick={() => saveSettings({ ...settings, groupByProject: !settings.groupByProject })}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: 'var(--text-secondary)',
                            fontSize: '0.75rem'
                        }}
                    >
                        <Folder size={14} style={{ opacity: settings.groupByProject ? 1 : 0.5, color: settings.groupByProject ? 'var(--accent-blue)' : 'inherit' }} />
                        {settings.groupByProject ? 'Sous-groupage : Projet' : 'Sous-groupage : Aucun'}
                    </button>
                    
                    <button
                        onClick={handleToggleSelectionMode}
                        style={{
                            background: isSelectionMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.05)',
                            border: isSelectionMode ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: isSelectionMode ? '#3b82f6' : 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Calculator size={14} />
                        {isSelectionMode ? 'Mode Planification' : 'Planifier'}
                    </button>
                </div>
            </h3>
            
            {/* Selection Summary */}
            <AnimatePresence>
                {isSelectionMode && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ 
                            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1))', 
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            borderRadius: '8px',
                            padding: '0.75rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                 <Calculator size={16} color="#3b82f6" />
                                 <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                     {selectedTaskIds.length} tâche{selectedTaskIds.length > 1 ? 's' : ''} sélectionnée{selectedTaskIds.length > 1 ? 's' : ''}
                                 </span>
                             </div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                 <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total :</span>
                                 <span style={{ fontSize: '1rem', fontWeight: 700, color: '#3b82f6' }}>
                                     {selectedTaskIds.reduce((sum, id) => {
                                         const task = data.taskList.find(t => t.id === id);
                                         const points = task ? (settings.pointsMetric === 'sprint' ? task.sprintPoints : task.points) : 0;
                                         return sum + points;
                                     }, 0)} pts
                                 </span>
                             </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {Object.keys(groupedTasksByStatus).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sortedStatusKeys.map(status => {
                  const { tasks: statusTasks, color } = groupedTasksByStatus[status];
                  const isExpanded = !!expandedStatuses[status]; 
                  const statusPoints = statusTasks.reduce((acc, t) => acc + (settings.pointsMetric === 'sprint' ? t.sprintPoints : t.points), 0);

                  // Sub-group by project if enabled
                  const tasksByProject = settings.groupByProject 
                    ? statusTasks.reduce((acc, t) => {
                        const project = t.project || 'Sans projet';
                        if (!acc[project]) acc[project] = [];
                        acc[project].push(t);
                        return acc;
                      }, {})
                    : { 'all': statusTasks };

                  // Calculate total points for each project within this status for sorting
                  const projectPointsMap = Object.keys(tasksByProject).reduce((acc, project) => {
                    acc[project] = tasksByProject[project].reduce((sum, t) => sum + (settings.pointsMetric === 'sprint' ? t.sprintPoints : t.points), 0);
                    return acc;
                  }, {});

                  const sortedProjectKeys = Object.keys(tasksByProject).sort((a, b) => {
                    // Sort by points descending
                    const diff = projectPointsMap[b] - projectPointsMap[a];
                    // If points are equal, sort alphabetically
                    return diff !== 0 ? diff : a.localeCompare(b);
                  });

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
                              ({statusTasks.length})
                            </span>
                         </div>
                         <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                           {statusPoints} pts
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
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '0.5rem', paddingLeft: settings.groupByProject ? '1rem' : '0' }}>
                                {sortedProjectKeys.map(project => {
                                   const projectTasks = [...tasksByProject[project]].sort((a, b) => {
                                      const pointsA = settings.pointsMetric === 'sprint' ? a.sprintPoints : a.points;
                                      const pointsB = settings.pointsMetric === 'sprint' ? b.sprintPoints : b.points;
                                      return pointsB - pointsA;
                                   });
                                   const projectPoints = projectTasks.reduce((acc, t) => acc + (settings.pointsMetric === 'sprint' ? t.sprintPoints : t.points), 0);

                                   return (
                                     <div key={project} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {settings.groupByProject && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                                    <Folder size={12} />
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>{project}</span>
                                                </div>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.7 }}>{projectPoints} pts</span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {projectTasks.map(task => (
                                                <div 
                                                key={task.id} 
                                                onClick={() => isSelectionMode ? toggleTaskSelection(task.id) : handleTaskClick(task)}
                                                style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center', 
                                                padding: '1rem', 
                                                borderRadius: '8px',
                                                background: isSelectionMode && selectedTaskIds.includes(task.id) 
                                                    ? 'rgba(59, 130, 246, 0.1)' 
                                                    : 'rgba(255,255,255,0.03)',
                                                border: isSelectionMode && selectedTaskIds.includes(task.id)
                                                    ? '1px solid rgba(59, 130, 246, 0.3)'
                                                    : '1px solid rgba(255,255,255,0.05)',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                                }} 
                                                className="task-card"
                                                onMouseEnter={(e) => {
                                                    if (!isSelectionMode || !selectedTaskIds.includes(task.id)) {
                                                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                     if (!isSelectionMode || !selectedTaskIds.includes(task.id)) {
                                                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                                     }
                                                }}
                                                >
                                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: task.statusColor }}></div>
                                                    
                                                    {isSelectionMode && (
                                                        <div style={{ marginRight: '1rem', color: selectedTaskIds.includes(task.id) ? '#3b82f6' : 'var(--text-secondary)' }}>
                                                            {selectedTaskIds.includes(task.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                                                        </div>
                                                    )}

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, marginRight: '1rem' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                            {!settings.groupByProject && task.project && (
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
                                                        {settings.pointsMetric === 'sprint' ? task.sprintPoints : task.points}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                     </div>
                                   );
                                })}
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
          </div>
      </motion.div>
      )}

      {/* DEBUG PANEL */}
      {import.meta.env.DEV && (
       <div style={{ position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 1000 }}>
           <button 
                onClick={() => setShowDebug(!showDebug)}
                style={{ 
                    background: 'rgba(0,0,0,0.5)', 
                    color: 'white', 
                    border: 'none', 
                    padding: '0.5rem', 
                    borderRadius: '8px',
                    cursor: 'pointer'
                }}
            >
               <Bug size={20} />
            </button>
            {showDebug && (
                <div style={{ 
                    position: 'absolute', 
                    bottom: '3rem', 
                    right: 0, 
                    background: '#1e293b', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: '1px solid #334155',
                    width: '300px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <h4 style={{ marginBottom: '1rem', fontWeight: 600 }}>Debug Status</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: '#94a3b8' }}>
                                Fake Current Day (1=Mon, 5=Fri)
                            </label>
                            <select 
                                value={debugOverride.day ?? ''} 
                                onChange={(e) => setDebugOverride(prev => ({ ...prev, day: e.target.value ? parseInt(e.target.value) : null }))}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: '#0f172a', border: '1px solid #334155', color: 'white' }}
                            >
                                <option value="">Real Day</option>
                                <option value="1">Lundi</option>
                                <option value="2">Mardi</option>
                                <option value="3">Mercredi</option>
                                <option value="4">Jeudi</option>
                                <option value="5">Vendredi</option>
                                <option value="6">Samedi</option>
                                <option value="7">Dimanche</option>
                            </select>
                        </div>
                         <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: '#94a3b8' }}>
                                Fake Weekly Points
                            </label>
                            <input 
                                type="number" 
                                value={debugOverride.points ?? ''} 
                                placeholder={`Real: ${data.weeklyPoints}`}
                                onChange={(e) => setDebugOverride(prev => ({ ...prev, points: e.target.value ? parseFloat(e.target.value) : null }))}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: '#0f172a', border: '1px solid #334155', color: 'white' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: '#94a3b8' }}>
                                Fake Hour (0-23)
                            </label>
                            <input 
                                type="number" 
                                min="0" max="23"
                                value={debugOverride.hour ?? ''} 
                                placeholder={`Real: ${new Date().getHours()}h`}
                                onChange={(e) => setDebugOverride(prev => ({ ...prev, hour: e.target.value ? parseInt(e.target.value) : null }))}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: '#0f172a', border: '1px solid #334155', color: 'white' }}
                            />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem',  borderTop: '1px solid #334155', paddingTop: '0.5rem' }}>
                            Expected (Passed): {Math.round(statusCheck.expectedPoints)}<br/>
                            Expected (End of Day): {Math.round(statusCheck.expectedByEndOfToday)}<br/>
                            To Do Today: {Math.round(statusCheck.pointsToDoToday)}
                        </div>
                    </div>
                </div>
            )}
       </div>
      )}

    </div>
  );
};

export default DashboardPage;
