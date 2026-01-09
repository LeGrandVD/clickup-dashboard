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
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('clickup_access_token'));
  const [rawData, setRawData] = useState(null);
  const [data, setData] = useState(initialData);
  
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard', 'week', 'year'
  const [expandedStatuses, setExpandedStatuses] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rawTasks, setRawTasks] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('dashboardSettings');
    return saved ? JSON.parse(saved) : { weeklyTarget: 28, vacationWeeks: 4 };
  });

  const handleLogout = () => {
      localStorage.removeItem('clickup_access_token');
      navigate('/login');
  };

  const toggleStatus = (status) => {
    setExpandedStatuses(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('dashboardSettings', JSON.stringify(newSettings));
  };

  // Helper to get start and end of current week (Monday to Sunday)
  const getWeekRange = (dateObj = new Date()) => {
    const d = new Date(dateObj);
    const day = d.getDay(); // 0 is Sunday
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is 0 (Sunday) to get previous Monday
    
    // Set to Monday 00:00:00
    const startOfWeek = new Date(d.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Set to Sunday 23:59:59
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return { start: startOfWeek.getTime(), end: endOfWeek.getTime() };
  };

  // Helper to get ISO week number
  const getISOWeekNumber = (d) => {
    const date = new Date(d.valueOf());
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
    return Math.ceil((((date - yearStart) / 86400000) + 1)/7);
  };
  
  // Helper to get date of ISO week start (Monday)
  const getDateOfISOWeek = (w, y) => {
    const simple = new Date(y, 0, 1 + (w - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    return ISOweekStart;
  };

  const fetchData = async (token) => {
    setLoading(true);
    try {
      const teamId = import.meta.env.VITE_CLICKUP_TEAM_ID;
      const folderId = import.meta.env.VITE_CLICKUP_FOLDER_ID;

      if (!teamId || !folderId) {
        setLoading(false);
        return;
      }
      
      const headers = token ? { 'Authorization': token } : {};

      const sprintRes = await axios.get(`/api/proxy?path=sprint&folderId=${folderId}`, { headers });
      const latestSprint = sprintRes.data.lists[0];
      
      const userRes = await axios.get('/api/proxy?path=user', { headers });
      const currentUser = userRes.data.user;

      let allTasks = [];
      let page = 0;
      while (true) {
          const tasksRes = await axios.get(`/api/proxy?path=my_tasks&userId=${currentUser.id}&page=${page}`, { headers });
          allTasks = [...allTasks, ...tasksRes.data.tasks];
          if (tasksRes.data.last_page) break;
          page++;
      }

      setRawData({
        latestSprint,
        currentUser,
        allTasks
      });
      
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response && error.response.status === 401) {
          // Token might be invalid
          localStorage.removeItem('clickup_access_token');
          navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
        fetchData(accessToken);
    } else {
        // No token, redirect to login
        navigate('/login');
    }
  }, [accessToken, navigate]);

  useEffect(() => {
    if (rawTasks.length === 0) return;

    const { start: startOfWeek, end: endOfWeek } = getWeekRange(currentDate);
    
    let weeklyPointsCurrent = 0;
    const weeklyDetailedTasks = [];
    const dailyBreakdown = [0, 0, 0, 0, 0, 0, 0];

    rawTasks.forEach(task => {
        if (task.isClosed && task.dateDone) {
            if (task.dateDone >= startOfWeek && task.dateDone <= endOfWeek) {
                weeklyPointsCurrent += task.points;
                weeklyDetailedTasks.push(task);
                
                const date = new Date(task.dateDone);
                let dayIndex = date.getDay() - 1; 
                if (dayIndex === -1) dayIndex = 6;
                dailyBreakdown[dayIndex] += task.points;
            }
        }
    });

    weeklyPointsCurrent = Math.round(weeklyPointsCurrent * 2) / 2;

    setData(prev => ({
        ...prev,
        weeklyPoints: weeklyPointsCurrent,
        dailyBreakdown,
        weeklyDetailedTasks
    }));

  }, [currentDate, rawTasks]);

  // Status Check Logic
  const getStatusCheck = () => {
    const today = new Date();
    const currentIsoDay = today.getDay() || 7; // 1=Mon, 7=Sun
    // We assume 4 working days (Mon-Thu) for the target distribution
    const workDaysPassed = Math.min(currentIsoDay, 4); 
    
    // Linear expectation: Target * (DaysPassed / 4)
    // Example: Monday (1) = 1/4 of target.
    const expectedPoints = (settings.weeklyTarget / 4) * workDaysPassed;
    const isUpToDate = data.weeklyPoints >= expectedPoints - 1; // 1 point buffer
    const diff = data.weeklyPoints - expectedPoints;
    
    return { isUpToDate, expectedPoints, diff, currentIsoDay };
  };

  const statusCheck = getStatusCheck();

  // Process data whenever rawData or settings change
  useEffect(() => {
    if (!rawData) return;

    const { latestSprint, allTasks } = rawData;
    const { weeklyTarget, vacationWeeks } = settings;

    // 1. Process Logic for Current Sprint Dashboard
    const tasks = allTasks.filter(task => {
        const isHomeList = task.list.id === latestSprint.id;
        const isSecondaryList = task.locations?.some(loc => loc.id === latestSprint.id);
        return isHomeList || isSecondaryList;
    }).map(task => {
      const totalPointsField = task.custom_fields?.find(f => f.id === 'c080dbb1-90fc-4095-ac30-2d05d20b821a');
      let points = 0;
      if (totalPointsField && totalPointsField.value != null) {
         points = parseFloat(totalPointsField.value) || 0;
      }
      if (points === 0 && task.points) {
          points = task.points;
      }
      
      const folderName = task.folder && !task.folder.hidden ? task.folder.name : null;
      const listName = task.list.name;
      let projectInfo = folderName || listName;
      
      return {
        id: task.id,
        name: task.name,
        points,
        status: task.status.status, 
        isClosed: task.status.type === 'closed',
        statusColor: task.status.color,
        project: projectInfo, 
        customId: task.custom_id,
        dateDone: task.date_closed ? parseInt(task.date_closed) : null 
      };
    });

    let completed = 0;
    let total = 0;
    let remaining = 0;

    tasks.forEach(task => {
      total += task.points;
      if (task.isClosed) {
        completed += task.points;
      } else {
        if (task.points > 0 || task.name.length > 3) {
          remaining++;
        }
      }
    });

    completed = Math.round(completed * 2) / 2;
    total = Math.round(total * 2) / 2;
    
    const taskListData = tasks;
    const dueDate = latestSprint.due_date ? parseInt(latestSprint.due_date) : null;
    const now = Date.now();
    
    // Date Calculation Logic
    // We assume the sprint ends that week. We want to find the Thursday (Official) and Sunday (Buffer).
    let diffDays = 0;
    let bufferDays = 0;
    
    if (dueDate) {
        const dateObj = new Date(dueDate);
        const day = dateObj.getDay(); // 0=Sun, 1=Mon, ..., 4=Thu, ...
        
        // Find Sunday of that week (Sprint limit)
        // If day is 0 (Sun), offset is 0. If 4 (Thu), offset is 3.
        const daysToReachSunday = (7 - day) % 7;
        const sundayTimestamp = dueDate + (daysToReachSunday * 24 * 60 * 60 * 1000);
        
        // Find Thursday of that week (Official deadline)
        // Sunday is daysToReachSunday away. Thursday is 3 days before Sunday.
        const thursdayTimestamp = sundayTimestamp - (3 * 24 * 60 * 60 * 1000);
        
        const nowMs = Date.now();
        
        // Calculate days remaining
        diffDays = Math.ceil((thursdayTimestamp - nowMs) / (1000 * 60 * 60 * 24));
        bufferDays = Math.ceil((sundayTimestamp - nowMs) / (1000 * 60 * 60 * 24));
    } 


    // 2. Process Logic for Weekly/Yearly Stats
    const processedAllTasks = allTasks.map(task => {
       const totalPointsField = task.custom_fields?.find(f => f.id === 'c080dbb1-90fc-4095-ac30-2d05d20b821a');
      let points = 0;
      if (totalPointsField && totalPointsField.value != null) {
         points = parseFloat(totalPointsField.value) || 0;
      }
      if (points === 0 && task.points) {
          points = task.points;
      }

      const folderName = task.folder && !task.folder.hidden ? task.folder.name : null;
      const listName = task.list.name;
      const project = folderName || listName;

      return {
          id: task.id,
          name: task.name,
          project,
          points,
          isClosed: task.status.type === 'closed' || task.status.status === 'closed' || task.status.status === 'complete' || task.status.status === 'livré', 
          dateDone: task.date_closed ? parseInt(task.date_closed) : (task.date_done ? parseInt(task.date_done) : null)
      };
    });

    setRawTasks(processedAllTasks);

    const { start: startOfWeek, end: endOfWeek } = getWeekRange();
    const currentWeekNum = getISOWeekNumber(new Date());
    const currentYear = new Date().getFullYear();

    let weeklyPointsCurrent = 0;
    const weeklyDetailedTasks = [];
    // Map needed for weekly buckets
    const weeklyDataMap = {}; // { weekNum: { points: 0, days: Set() } }
    const dailyBreakdown = [0, 0, 0, 0, 0, 0, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun

    processedAllTasks.forEach(task => {
        if (task.isClosed && task.dateDone) {
           // Current Week Points (Top Card)
            if (task.dateDone >= startOfWeek && task.dateDone <= endOfWeek) {
                weeklyPointsCurrent += task.points;
                weeklyDetailedTasks.push(task);
                
                // Daily Breakdown Calculation
                const date = new Date(task.dateDone);
                // getDay(): 0 is Sunday, 1 is Monday...
                // We want index 0 = Monday, index 6 = Sunday
                let dayIndex = date.getDay() - 1; 
                if (dayIndex === -1) dayIndex = 6; // Sunday
                
                dailyBreakdown[dayIndex] += task.points;
            }
            
           // Yearly aggregation
           const d = new Date(task.dateDone);
           if (d.getFullYear() === currentYear) {
              const w = getISOWeekNumber(d);
              if (!weeklyDataMap[w]) weeklyDataMap[w] = { points: 0, days: new Set() };
              weeklyDataMap[w].points += task.points;
              weeklyDataMap[w].days.add(d.toDateString());
           }
        }
    });
    
    weeklyPointsCurrent = Math.round(weeklyPointsCurrent * 2) / 2;

    // Build Sprint Table Data
    const weeklyBreakdown = [];
    let annualPointsTotal = 0;
    let totalWorkDays = 0;
    let holidaysTaken = 0;
    
    for (let i = 1; i <= currentWeekNum; i++) {
        const data = weeklyDataMap[i] || { points: 0, days: new Set() };
        const points = Math.round(data.points * 2) / 2;
        const workDays = data.days.size;
        
        let target = weeklyTarget; // USER SETTING
        let isHoliday = false;
        
        // Holiday Logic: If past week (not current) has 0 points, assume Holiday
        if (i < currentWeekNum && points === 0) {
            target = 0;
            isHoliday = true;
            holidaysTaken++;
        }
        
        weeklyBreakdown.push({
            week: i,
            startDate: getDateOfISOWeek(i, currentYear).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
            points,
            workDays,
            target,
            remaining: target - points,
            isHoliday
        });
        
        annualPointsTotal += points;
        totalWorkDays += workDays;
    }
    
    // Metrics Calculation
    const annualTarget = (52 - vacationWeeks) * weeklyTarget; // USER SETTINGS
    const annualRemaining = annualTarget - annualPointsTotal;
    const averagePointsPerDay = totalWorkDays > 0 ? (annualPointsTotal / totalWorkDays).toFixed(1) : 0;
    const vacationRemaining = vacationWeeks - holidaysTaken; // USER SETTING
    
    const vacationWeeksUsed = weeklyBreakdown.filter(w => w.isHoliday).length;
    const vacationWeeksRemaining = vacationWeeks - vacationWeeksUsed; // USER SETTING

    // Reverse for table display (newest first)
    weeklyBreakdown.reverse();

    setData({
      completedPoints: completed,
      totalPoints: total,
      tasksRemaining: remaining,
      daysLeft: diffDays,
      bufferDays,
      sprintName: latestSprint.name,
      taskList: taskListData,
      weeklyPoints: weeklyPointsCurrent,
      dailyBreakdown,
      
      // New Metrics
      metrics: {
          annualTarget,
          totalPointsDone: annualPointsTotal,
          totalWorkDays,
          averagePointsPerDay,
          annualRemaining,
          vacationRemaining,
          vacationWeeksUsed,
          vacationWeeksRemaining
      },
      fullWeeklyData: weeklyBreakdown,
      weeklyDetailedTasks
    });

  }, [rawData, settings]);

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
    // Check for partial matches or exact keys
    if (s.includes('à faire') || s.includes('to do')) return 1;
    if (s.includes('en cours') || s.includes('in progress')) return 2;
    if (s.includes('en attente') || s.includes('waiting')) return 3;
    if (s.includes('livré') || s.includes('delivered') || s.includes('done') || s.includes('complete')) return 4;
    return 100; // Default low priority
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
              <button onClick={() => fetchData(accessToken)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
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
                     // Filter tasks for this day (0 = Monday in our breakdown logic, but getDay() is 1=Mon)
                    // We need to match the date logic.
                    // Let's rely on tasks' dateDone.
                    const dayTasks = data.weeklyDetailedTasks ? data.weeklyDetailedTasks.filter(t => {
                        const d = new Date(t.dateDone);
                        let i = d.getDay() - 1;
                        if (i === -1) i = 6;
                        return i === index;
                    }).sort((a,b) => b.dateDone - a.dateDone) : [];

                    if (dayTasks.length === 0) return null;

                    // Get date string from first task
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
