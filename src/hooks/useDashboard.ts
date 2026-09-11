import { useEffect, useState } from 'react';
import { getDashboardSummary } from '../services/dashboardService';
import type { DashboardSummary } from '../types/dashboard';
import type { StudyTaskInput } from '../types/dashboard';
import { createStudyTask, setStudyTaskCompleted } from '../services/taskService';

export const useDashboard = () => {
  const [data, setData] = useState<DashboardSummary>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const refresh = async () => {
    setLoading(true); setError(undefined);
    try { setData(await getDashboardSummary()); } catch (value) { setError(value instanceof Error ? value.message : 'Could not load dashboard data.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, []);
  const addTask = async (input: StudyTaskInput) => { const task = await createStudyTask(input); await refresh(); return task; };
  const completeTask = async (id: string, completed = true) => { const task = await setStudyTaskCompleted(id, completed); await refresh(); return task; };
  return { data, error, loading, refresh, addTask, completeTask };
};
