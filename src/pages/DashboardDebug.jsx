import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, RefreshCw, CheckCircle2, ListTodo, Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import SettingsModal from '../SettingsModal';
import UserMenu from '../components/UserMenu';
import DashboardSkeleton from '../components/DashboardSkeleton';

const initialData = {
    completedPoints: 0,
    totalPoints: 0,
    tasksRemaining: 0,
    daysLeft: 0,
    bufferDays: 0,
    sprintName: '',
    taskList: [],
    weeklyPoints: 0,
    dailyBreakdown: [],
    metrics: null,
    fullWeeklyData: [],
    weeklyDetailedTasks: []
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(initialData);
  
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard', 'week', 'year'
  const [expandedStatuses, setExpandedStatuses] = useState({'en cours': true, 'à faire': true});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(() => {
    return { weeklyTarget: 28, vacationWeeks: 4 };
  });

  const handleLogout = () => {
      console.log('logout');
  };

  const toggleStatus = (status) => {
    setExpandedStatuses(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
  };

  // Helper to get start and end of current week (Monday to Sunday)
  const getWeekRange = (dateObj = new Date()) => {
    const d = new Date(dateObj);
    const day = d.getDay(); // 0 is Sunday
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    const startOfWeek = new Date(d.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return { start: startOfWeek.getTime(), end: endOfWeek.getTime() };
  };

  useEffect(() => {
        // DUMMY DATA FOR DEBUGGING
        const dummy = {
            completedPoints: 12.5,
            totalPoints: 45,
            tasksRemaining: 8,
            daysLeft: 4,
            bufferDays: 7,
            sprintName: 'Sprint Debug',
            taskList: [
                { id: '1', name: 'Fix Responsive Layout issues on mobile and desktop', points: 3, status: 'en cours', statusColor: '#f59e0b', project: 'Frontend', customId: '123' },
                { id: '2', name: 'API Integration with a very long title to test text overflow in the card component', points: 5, status: 'à faire', statusColor: '#8b5cf6', project: 'Backend', customId: '124' },
                { id: '3', name: 'Design Review', points: 2, status: 'livré', statusColor: '#10b981', project: 'Design', customId: '125', isClosed: true, dateDone: Date.now() },
                 { id: '4', name: 'Small Task', points: 0.5, status: 'à faire', statusColor: '#8b5cf6', project: 'Testing', customId: '126' },
                 { id: '5', name: 'Another Task', points: 8, status: 'en attente', statusColor: '#ef4444', project: 'Ops', customId: '127' }
            ],
            weeklyPoints: 18,
            dailyBreakdown: [2, 5, 3, 8, 0, 0, 0],
             metrics: {
                annualTarget: 1000,
                totalPointsDone: 450,
                totalWorkDays: 120,
                averagePointsPerDay: 3.5,
                annualRemaining: 550,
                vacationRemaining: 3,
                vacationWeeksUsed: 2,
                vacationWeeksRemaining: 3
            },
            fullWeeklyData: [
                { week: 24, startDate: '01 Jan', points: 20, workDays: 5, target: 20, remaining: 0, isHoliday: false },
                { week: 23, startDate: '25 Dec', points: 0, workDays: 0, target: 0, remaining: 0, isHoliday: true },
                 { week: 22, startDate: '18 Dec', points: 15, workDays: 4, target: 20, remaining: 5, isHoliday: false }
            ],
            weeklyDetailedTasks: [
                 { id: '3', name: 'Design Review', points: 2, status: 'livré', statusColor: '#10b981', project: 'Design', customId: '125', isClosed: true, dateDone: Date.now() },
                 { id: '10', name: 'Previous Task', points: 5, status: 'livré', statusColor: '#10b981', project: 'Design', customId: '130', isClosed: true, dateDone: Date.now() - 86400000 }
            ]
        };
        setData(dummy);
        setLoading(false);
  }, []);

  const statusCheck = {
      isUpToDate: true,
      expectedPoints: 15,
      diff: 3,
      currentIsoDay: 3
  };

  const progress = data.totalPoints > 0 ? (data.completedPoints / data.totalPoints) * 100 : 0;
  
  // Group tasks by status
  const groupedTasks = data.taskList.reduce((acc, task) => {
    const status = task.status;
    if (!acc[status]) {
      acc[status] = { tasks: [], color: task.statusColor };
    }
    acc[status].tasks.push(task);
    return acc;
  }, {});

  // Define status priority for sorting
  const statusPriority = {
    'à faire': 1,
    'en cours': 2,
    'en attente': 3,
    'livré': 4,
    'closed': 5
  };

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


      <header style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Dashboard</h2>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
              <UserMenu 
                  user={{ username: 'Debug User', profilePicture: null }}
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
             {/* 1. SCORECARD SECTION */}
              {data.metrics && (
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

                     {/* Point par jour */}
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Point / jour</p>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{data.metrics.averagePointsPerDay}</div>
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
              )}

              {/* 2. SPRINT HISTORY CHART */}
               {data.fullWeeklyData && (
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
              )}
              {/* 3. SPRINT HISTORY TABLE (Restored) */}
              {data.fullWeeklyData && (
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
                                <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700 }}>{data.metrics?.totalWorkDays || 0}</td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>{data.fullWeeklyData.reduce((acc, w) => acc + w.target, 0)}</td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: 'var(--accent-blue)' }}>{data.metrics?.totalPointsDone || 0}</td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>
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
              )}
        </motion.div>
      )}

      {/* --- VIEW: WEEK (Daily Chart + Detail) --- */}
      {viewMode === 'week' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             
             {/* Week Navigation */}
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button 
                    onClick={() => {
                        const prevWeek = new Date(currentDate);
                        prevWeek.setDate(prevWeek.getDate() - 7);
                        setCurrentDate(prevWeek);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <ChevronLeft size={20} />
                    <span style={{ fontSize: '0.875rem' }}>Semaine précédente</span>
                </button>
                
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                    {(() => {
                        const { start, end } = getWeekRange(currentDate);
                        const s = new Date(start);
                        const e = new Date(end);
                        return `${s.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${e.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
                    })()}
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                     <button 
                        onClick={() => setCurrentDate(new Date())}
                        style={{ 
                            background: 'rgba(255,255,255,0.05)', 
                            border: 'none', 
                            color: 'var(--text-primary)', 
                            cursor: 'pointer', 
                            padding: '0.5rem 1rem', 
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 500
                        }}
                    >
                        Aujourd'hui
                    </button>
                    <button 
                        onClick={() => {
                            const nextWeek = new Date(currentDate);
                            nextWeek.setDate(nextWeek.getDate() + 7);
                            setCurrentDate(nextWeek);
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <span style={{ fontSize: '0.875rem' }}>Semaine suivante</span>
                        <ChevronRight size={20} />
                    </button>
                </div>
             </div>

             {/* Summary Cards */}
             <div className="stat-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="glass-card stat-card">
                    <div style={{ color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>
                        <ListTodo size={24} />
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{data.weeklyDetailedTasks ? data.weeklyDetailedTasks.length : 0}</span>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Tâches complétées</p>
                </div>
                <div className="glass-card stat-card">
                     <div style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>
                        <CheckCircle2 size={24} />
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{data.weeklyPoints}</span>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Points total</p>
                </div>
                 <div className="glass-card stat-card">
                    <div style={{ color: '#4ade80', marginBottom: '0.5rem' }}>
                        <Calendar size={24} />
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                        {data.dailyBreakdown ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][data.dailyBreakdown.indexOf(Math.max(...data.dailyBreakdown))] : '-'}
                    </span>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Meilleur jour</p>
                </div>
             </div>

             {/* Restored Bar Chart */}
             <motion.div 
                className="glass-card"
                style={{ marginBottom: '1.5rem', padding: '1.5rem', height: '300px' }}
             >
                <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Progression quotidienne</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => ({
                            name: day,
                            points: data.dailyBreakdown ? Math.round(data.dailyBreakdown[index] * 2) / 2 : 0
                        }))}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                         <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                         <XAxis 
                            dataKey="name" 
                            stroke="var(--text-secondary)" 
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis 
                            stroke="var(--text-secondary)" 
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 4 }}
                            contentStyle={{ 
                                backgroundColor: '#1e1b4b', 
                                borderColor: 'rgba(255,255,255,0.1)', 
                                borderRadius: '8px'
                            }}
                            itemStyle={{ color: '#e2e8f0' }}
                        />
                        <Bar dataKey="points" name="Points" fill="var(--accent-blue)" radius={[4, 4, 0, 0]}>
                            {
                                ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill="var(--accent-blue)" />
                                ))
                            }
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </motion.div>

             <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>Journal de la semaine</h3>
                
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((dayName, index) => {
                    const dayTasks = data.weeklyDetailedTasks ? data.weeklyDetailedTasks.filter(t => {
                        const d = new Date(t.dateDone);
                        let i = d.getDay() - 1;
                        if (i === -1) i = 6;
                        return i === index;
                    }).sort((a,b) => b.dateDone - a.dateDone) : [];

                    if (dayTasks.length === 0) return null;

                    const dateStr = new Date(dayTasks[0].dateDone).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

                    return (
                        <div key={dayName} style={{ marginBottom: '2rem' }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '1rem', 
                                marginBottom: '1rem',
                                paddingBottom: '0.5rem',
                                borderBottom: '1px solid rgba(255,255,255,0.05)' 
                            }}>
                                <h4 style={{ textTransform: 'capitalize', fontSize: '1rem', fontWeight: 600 }}>{dateStr}</h4>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '12px' }}>
                                    {Math.round(data.dailyBreakdown[index] * 2)/2} pts
                                </span>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {dayTasks.map(task => (
                                    <div key={task.id} style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        padding: '0.75rem 1rem',
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
                                             </div>
                                            <span style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>{task.name}</span>
                                        </div>
                                        <div style={{ 
                                            fontWeight: 600, 
                                            color: 'var(--accent-blue)',
                                            fontSize: '0.875rem'
                                        }}>
                                            {task.points}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {(!data.weeklyDetailedTasks || data.weeklyDetailedTasks.length === 0) && (
                     <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        Aucune tâche complétée cette semaine.
                    </div>
                )}
             </div>
          </motion.div>
      )}

      {/* --- VIEW: DASHBOARD (Overview) --- */}
      {viewMode === 'dashboard' && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dashboard-view-layout">
          <div className="dashboard-summary">
            
            {/* NEW STATUS CARD */}
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

            {/* OLD SPRINT PROGRESS (Less Pertinent) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card"
              style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '1rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                 <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sprint Global</h3>
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
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Tasks Remaining</p>
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
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', textAlign: 'left' }}>Tasks this sprint</h3>
            
            {Object.keys(groupedTasks).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sortedStatusKeys.map(status => {
                  const { tasks, color } = groupedTasks[status];
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
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No tasks found for this sprint.</p>
            )}
          </motion.div>
      </motion.div>
      )}
    </div>
  );
};

export default DashboardPage;
