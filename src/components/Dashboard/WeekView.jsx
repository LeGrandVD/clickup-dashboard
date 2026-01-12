import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ListTodo, CheckCircle2, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getWeekRange } from '../../hooks/useDashboardData';

const WeekView = ({ data, currentDate, setCurrentDate }) => {
  return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
         
         {/* Week Navigation */}
         <div className="week-nav-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <button 
                className="nav-prev"
                onClick={() => {
                    const prevWeek = new Date(currentDate);
                    prevWeek.setDate(prevWeek.getDate() - 7);
                    setCurrentDate(prevWeek);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
                <ChevronLeft size={20} />
                <span className="nav-text" style={{ fontSize: '0.875rem' }}>Semaine précédente</span>
            </button>
            
            <div className="nav-date" style={{ fontWeight: 600, fontSize: '1rem' }}>
                {(() => {
                    const { start, end } = getWeekRange(currentDate);
                    const s = new Date(start);
                    const e = new Date(end);
                    return `${s.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${e.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
                })()}
            </div>

            <div className="nav-right-group">
                 <button 
                    className="nav-today"
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
                    className="nav-next"
                    onClick={() => {
                        const nextWeek = new Date(currentDate);
                        nextWeek.setDate(nextWeek.getDate() + 7);
                        setCurrentDate(nextWeek);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <span className="nav-text" style={{ fontSize: '0.875rem' }}>Semaine suivante</span>
                    <ChevronRight size={20} />
                </button>
            </div>
         </div>

         {/* Summary Cards */}
         <div className="stat-grid stat-grid-3" style={{ marginBottom: '1.5rem' }}>
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

                const handleTaskClick = (task) => {
                    // Try to open in App first
                    window.location.href = task.appUrl;
                    
                    // Fallback to web after a short delay
                    setTimeout(() => {
                        window.open(task.url, '_blank');
                    }, 500);
                };

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
                                <div 
                                    key={task.id} 
                                    onClick={() => handleTaskClick(task)}
                                    style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    padding: '0.75rem 1rem',
                                    background: 'rgba(255,255,255,0.02)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                >
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
  );
};

export default WeekView;
