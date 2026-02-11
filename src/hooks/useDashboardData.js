import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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

// Helper to get start and end of current week (Monday to Sunday)
export const getWeekRange = (dateObj = new Date()) => {
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

export const getISOWeekNumber = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  // 0 = Sunday, 1 = Monday.
  const dayNum = date.getDay() || 7;
  date.setDate(date.getDate() + 4 - dayNum);
  const yearStart = new Date(date.getFullYear(), 0, 1);
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
};

// Helper to get date of ISO week start (Monday)
export const getDateOfISOWeek = (w, y) => {
  const simple = new Date(y, 0, 1 + (w - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4)
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  return ISOweekStart;
};

export const useDashboardData = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [accessToken, setAccessToken] = useState(() => localStorage.getItem('clickup_access_token'));
    const [rawData, setRawData] = useState(null);
    const [data, setData] = useState(initialData);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [rawTasks, setRawTasks] = useState([]);
    
    const [settings, setSettings] = useState(() => {
      const saved = localStorage.getItem('dashboardSettings');
      return saved ? JSON.parse(saved) : { weeklyTarget: 28, vacationWeeks: 4, openLinksIn: 'app', pointsMetric: 'total', groupByProject: false };
    });
  
    const saveSettings = (newSettings) => {
      setSettings(newSettings);
      localStorage.setItem('dashboardSettings', JSON.stringify(newSettings));
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
          const proxyUrl = `${import.meta.env.BASE_URL}proxy.php`;
    
          // 1. Get Lists in Folder (Sprint)
          const sprintRes = await axios.get(`${proxyUrl}?path=sprint&folderId=${folderId}`, { headers });
          const latestSprint = sprintRes.data.lists[0];
          
          // 2. Get User
          const userRes = await axios.get(`${proxyUrl}?path=user`, { headers });
          const currentUser = userRes.data.user;
    
          // 3. Get Open Tasks (All active assignments)
          // Open tasks are usually fewer than closed history, so we fetch all to ensure nothing is missed.
          const openParam = `&include_closed=false`; 
          let openTasks = [];
          let p1 = 0;
          while (true) {
              const res = await axios.get(`${proxyUrl}?path=my_tasks&teamId=${teamId}&userId=${currentUser.id}&page=${p1}${openParam}`, { headers });
              openTasks = [...openTasks, ...res.data.tasks];
              if (res.data.last_page) break;
              p1++;
          }

          // 4. Get Closed Tasks (Recent only)
          // We only need statistics for this year.
          const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
          const closedParam = `&include_closed=true&date_done_gt=${startOfYear}`;
          let closedTasks = [];
          let p2 = 0;
          while (true) {
              const res = await axios.get(`${proxyUrl}?path=my_tasks&teamId=${teamId}&userId=${currentUser.id}&page=${p2}${closedParam}`, { headers });
              closedTasks = [...closedTasks, ...res.data.tasks];
              if (res.data.last_page) break;
              p2++;
          }
    
          // Combine tasks, removing duplicates by ID (just in case)
          const allTasksMap = new Map();
          openTasks.forEach(t => allTasksMap.set(t.id, t));
          closedTasks.forEach(t => allTasksMap.set(t.id, t));
          const allTasks = Array.from(allTasksMap.values());

          setRawData({
            latestSprint,
            currentUser,
            allTasks
          });
          
        } catch (error) {
          console.error('Error fetching data:', error);
          if (error.response && error.response.status === 401) {
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
            navigate('/login');
        }
    }, [accessToken, navigate]);

    // UseEffect for Date-based Weekly stats
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
    
        weeklyPointsCurrent = Math.round(weeklyPointsCurrent * 4) / 4;
    
        setData(prev => ({
            ...prev,
            weeklyPoints: weeklyPointsCurrent,
            dailyBreakdown,
            weeklyDetailedTasks
        }));
    
    }, [currentDate, rawTasks]);

    // Processing raw data into stats
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
          let totalPointsValue = 0;
          if (totalPointsField && totalPointsField.value != null) {
             totalPointsValue = parseFloat(totalPointsField.value) || 0;
          }
          if (totalPointsValue === 0 && task.points) {
              totalPointsValue = task.points;
          }

          let points = settings.pointsMetric === 'sprint' ? (task.points || 0) : totalPointsValue;
          
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
            dateDone: task.date_closed ? parseInt(task.date_closed) : null,
            url: task.url || `https://app.clickup.com/t/${task.id}`,
            appUrl: `clickup://t/${task.id}`,
            sprintPoints: task.points || 0,
            totalPoints: totalPointsValue
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
    
        completed = Math.round(completed * 4) / 4;
        total = Math.round(total * 4) / 4;
        
        const taskListData = tasks;
        const dueDate = latestSprint.due_date ? parseInt(latestSprint.due_date) : null;
        
        let diffDays = 0;
        let bufferDays = 0;
        
        if (dueDate) {
            const dateObj = new Date(dueDate);
            const day = dateObj.getDay(); // 0=Sun, 1=Mon, ..., 4=Thu, ...
            
            // Find Sunday of that week (Sprint limit)
            const daysToReachSunday = (7 - day) % 7;
            const sundayTimestamp = dueDate + (daysToReachSunday * 24 * 60 * 60 * 1000);
            
            // Find Thursday of that week (Official deadline)
            const thursdayTimestamp = sundayTimestamp - (3 * 24 * 60 * 60 * 1000);
            
            const nowMs = Date.now();
            
            diffDays = Math.ceil((thursdayTimestamp - nowMs) / (1000 * 60 * 60 * 24));
            bufferDays = Math.ceil((sundayTimestamp - nowMs) / (1000 * 60 * 60 * 24));
        } 
    
        // 2. Process Logic for Weekly/Yearly Stats
        const processedAllTasks = allTasks.map(task => {
           const totalPointsField = task.custom_fields?.find(f => f.id === 'c080dbb1-90fc-4095-ac30-2d05d20b821a');
          let totalPointsValue = 0;
          if (totalPointsField && totalPointsField.value != null) {
             totalPointsValue = parseFloat(totalPointsField.value) || 0;
          }
          if (totalPointsValue === 0 && task.points) {
              totalPointsValue = task.points;
          }

          let points = settings.pointsMetric === 'sprint' ? (task.points || 0) : totalPointsValue;
    
          const folderName = task.folder && !task.folder.hidden ? task.folder.name : null;
          const listName = task.list.name;
          const project = folderName || listName;
    
          return {
              id: task.id,
              name: task.name,
              project,
              points,
              isClosed: task.status.type === 'closed' || task.status.status === 'closed' || task.status.status === 'complete' || task.status.status === 'livré', 
              dateDone: task.date_closed ? parseInt(task.date_closed) : (task.date_done ? parseInt(task.date_done) : null),
              url: task.url || `https://app.clickup.com/t/${task.id}`,
              appUrl: `clickup://t/${task.id}`,
              sprintPoints: task.points || 0,
              totalPoints: totalPointsValue
          };
        });
    
        setRawTasks(processedAllTasks);
    
        const { start: startOfWeek, end: endOfWeek } = getWeekRange();
        const currentWeekNum = getISOWeekNumber(new Date());
        const currentYear = new Date().getFullYear();
    
        let weeklyPointsCurrent = 0;
        const weeklyDetailedTasks = [];
        const weeklyDataMap = {}; // { weekNum: { points: 0, days: Set() } }
        const dailyBreakdown = [0, 0, 0, 0, 0, 0, 0]; 
    
        processedAllTasks.forEach(task => {
            if (task.isClosed && task.dateDone) {
               // Current Week Points (Top Card)
                if (task.dateDone >= startOfWeek && task.dateDone <= endOfWeek) {
                    weeklyPointsCurrent += task.points;
                    weeklyDetailedTasks.push(task);
                    
                    const date = new Date(task.dateDone);
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
        
        weeklyPointsCurrent = Math.round(weeklyPointsCurrent * 4) / 4;
    
        // Build Sprint Table Data
        const weeklyBreakdown = [];
        let annualPointsTotal = 0;
        let totalWorkDays = 0;
        let holidaysTaken = 0;
        
        for (let i = 1; i <= currentWeekNum; i++) {
            const data = weeklyDataMap[i] || { points: 0, days: new Set() };
            const points = Math.round(data.points * 4) / 4;
            const workDays = data.days.size;
            
            let target = weeklyTarget; 
            let isHoliday = false;
            
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
        const annualTarget = (52 - vacationWeeks) * weeklyTarget;
        const annualRemaining = annualTarget - annualPointsTotal;

        // Create a separate dataset for average calculation
        // Check if today is Mon(1), Tue(2), Wed(3), or Thu(4)
        const today = new Date();
        const currentDay = today.getDay();
        const isPartialWeek = currentDay >= 1 && currentDay < 5;
        
        // If it's a partial week (Mon-Thu), we exclude the current week (last entry) from the average
        let weeksForAverage = [...weeklyBreakdown];
        if (isPartialWeek && weeksForAverage.length > 0) {
            weeksForAverage.pop();
        }

        const statsWeeksWorked = weeksForAverage.filter(w => w.points > 0).length;
        const statsPointsTotal = weeksForAverage.reduce((acc, w) => acc + w.points, 0);

        const averagePointsPerWeek = statsWeeksWorked > 0 ? (statsPointsTotal / statsWeeksWorked).toFixed(1) : 0;
        const vacationRemaining = vacationWeeks - holidaysTaken;
        
        const vacationWeeksUsed = weeklyBreakdown.filter(w => w.isHoliday).length;
        const vacationWeeksRemaining = vacationWeeks - vacationWeeksUsed;
    
        weeklyBreakdown.reverse();
    
        setData({
          completedPoints: completed,
          totalPoints: total,
          tasksRemaining: remaining,
          daysLeft: diffDays,
          bufferDays,
          sprintName: latestSprint.name,
          taskList: taskListData,
          weeklyPoints: weeklyPointsCurrent, // Note: this gets overwritten by the Date-based useEffect, but that's okay/intended as they run in sequence
          dailyBreakdown,
          
          metrics: {
              annualTarget,
              totalPointsDone: annualPointsTotal,
              totalWorkDays,
              averagePointsPerWeek,
              annualRemaining,
              vacationRemaining,
              vacationWeeksUsed,
              vacationWeeksRemaining
          },
          fullWeeklyData: weeklyBreakdown,
          weeklyDetailedTasks
        });
    
      }, [rawData, settings]);

    const [debugOverride, setDebugOverride] = useState({ points: null, day: null, hour: null, daily: {} });

const getStatusCheck = () => {
        const today = new Date();
        const currentHour = debugOverride.hour !== null ? debugOverride.hour : today.getHours();

        // Check if we should expect points for today
        const currentIsoDay = debugOverride.day !== null ? debugOverride.day : (today.getDay() || 7);
        
        // Construct the effective daily breakdown
        const effectiveDailyBreakdown = [...(data.dailyBreakdown || [0,0,0,0,0,0,0])];
        if (debugOverride.daily) {
            Object.keys(debugOverride.daily).forEach(dayIndex => {
                const val = debugOverride.daily[dayIndex];
                if (val !== null && val !== undefined && val !== '') {
                    effectiveDailyBreakdown[parseInt(dayIndex)] = parseFloat(val);
                }
            });
        }
        
        // Calculate weekly points from the effective breakdown (unless total is strictly overridden, which takes precedence but we should probably disable total override if using daily)
        // Let's say: if daily overrides exist, use sum of effective breakdown.
        // If total points override exists AND no daily overrides? Or just let total override win?
        // User asked to edit "by day". So daily overrides should likely drive the total.
        
        let currentWeeklyPoints = data.weeklyPoints;
        const hasDailyOverrides = debugOverride.daily && Object.values(debugOverride.daily).some(v => v !== null && v !== '');
        
        if (hasDailyOverrides) {
             currentWeeklyPoints = effectiveDailyBreakdown.reduce((a, b) => a + b, 0);
        } else if (debugOverride.points !== null) {
             currentWeeklyPoints = debugOverride.points;
        }

        // Calculate points done strictly today
        // Note: data.dailyBreakdown is 0-indexed where 0 = Monday
        const dayIndex = currentIsoDay - 1;
        let pointsDoneToday = effectiveDailyBreakdown[dayIndex] || 0;
        
        // Validating the logic:
        // if hasDailyOverrides, effectiveDailyBreakdown[dayIndex] is correct.
        // if NOT hasDailyOverrides but debugOverride.points is set? 
        // fallback to the estimation logic we had before?
        if (!hasDailyOverrides && debugOverride.points !== null) {
             const totalRecorded = data.dailyBreakdown ? data.dailyBreakdown.reduce((a, b) => a + b, 0) : 0;
             const recordedToday = data.dailyBreakdown ? data.dailyBreakdown[dayIndex] : 0;
             const recordedOthers = totalRecorded - recordedToday;
             pointsDoneToday = Math.max(0, currentWeeklyPoints - recordedOthers);
        }

        const pointsDonePreviously = Math.max(0, currentWeeklyPoints - pointsDoneToday);

        const workDaysPassed = Math.min(Math.max(0, currentIsoDay - 1), 4); // Days fully passed (if today is Tue, passed=1 Mon)
        
        // Target calculation
        const pointsPerDay = settings.weeklyTarget / 4;
        
        const targetPreviously = pointsPerDay * workDaysPassed;
        
        const rawDeficit = targetPreviously - pointsDonePreviously;
        
        // If rawDeficit > 0, we are behind. 
        // If rawDeficit < 0, we are ahead (Advance).
        
        const deficit = Math.max(0, rawDeficit);
        const bankedAdvance = Math.max(0, -rawDeficit); // Advance from previous days
        
        // Target for TODAY:
        // Always at least pointsPerDay.
        // Plus any deficit.
        // (Advance does NOT reduce today's target, per user request)
        
        // We only count today if it's a workday (Mon-Thu).
        // If Fri-Sun, target today is 0 (bonus).
        let targetToday = 0;
        if (currentIsoDay >= 1 && currentIsoDay <= 4) {
            targetToday = pointsPerDay;
        }
        
        const totalTargetToday = targetToday + deficit;
        
        const pointsToDoToday = Math.max(0, totalTargetToday - pointsDoneToday);
        
        // Current Advance (Banked + any extra done today)
        // Note: If we haven't finished today's target, we don't count "advance" from today yet.
        // Actually, if I have done 5/7 today, I have no "advance" from today.
        // If I have done 10/7 today, I have +3 advance from today.
        
        const advanceToday = Math.max(0, pointsDoneToday - targetToday); 
        // Wait, if I have a deficit, pointsDoneToday goes to fill deficit first.
        // So actually:
        // Surplus = TotalPointsDone - TotalTargetSoFar(including today)
        // But we want to separate "Banked Advance" vs "Today's Work".
        
        // Let's stick to the high level "Advance" metric for the UI:
        const expectedByEndOfToday = pointsPerDay * Math.min(currentIsoDay, 4);
        const totalAdvance = Math.max(0, currentWeeklyPoints - expectedByEndOfToday);

        // However, specifically for the "Banked" concept (Monday's extra):
        // If I have banked advance, I want to see "Advance: X".
        // And "Points to do: Y".
        
        // Expected Points (for the progress bar or simple tracking)
        // Base expectation: what should be done from previous days
        let expectedPoints = targetPreviously;
        
        // Lunch checkpoint: At 1pm (13h) on a workday, we should have done at least half of today's target
        if (currentIsoDay >= 1 && currentIsoDay <= 4 && currentHour >= 13) {
            // Add half of today's target (including any deficit) to the expectation
            expectedPoints += totalTargetToday / 2;
        }

        // "Up To Date" check: Are we meeting our expectations?
        // This now accounts for the lunch checkpoint (1pm = half of today's target)
        const isUpToDate = currentWeeklyPoints >= expectedPoints;

        return { 
            isUpToDate, 
            expectedPoints, 
            diff: currentWeeklyPoints - expectedByEndOfToday, 
            currentIsoDay, 
            pointsToDoToday, 
            expectedByEndOfToday, 
            currentPoints: currentWeeklyPoints, 
            currentHour,
            advance: bankedAdvance, // This is the specific "past advance" we want to highlight
            totalAdvance,
            pointsPerDay,
            pointsDoneToday // Points accumulated today
        };
      };

    return {
        data,
        loading,
        settings,
        saveSettings,
        currentDate,
        setCurrentDate,
        statusCheck: getStatusCheck(),
        rawData,
        fetchData: () => fetchData(accessToken),
        debugOverride, 
        setDebugOverride
    };
};
