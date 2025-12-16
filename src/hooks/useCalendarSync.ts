import { useCallback, useState } from 'react';
import type { CalendarActivity } from '@/types';
import { toast } from '@/hooks/use-toast';

export function useCalendarSync() {
  const [activities, setActivities] = useState<CalendarActivity[]>([]);

  const createActivity = useCallback((activity: Omit<CalendarActivity, 'id' | 'createdAt'>) => {
    const newActivity: CalendarActivity = {
      ...activity,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    
    setActivities(prev => [...prev, newActivity]);
    
    toast({
      title: 'Atividade agendada',
      description: `Atividade para ${new Date(activity.date).toLocaleDateString('pt-PT')} criada com sucesso.`,
    });

    // Future: Sync with Google Calendar
    // This is where we'd call the Google Calendar API
    
    return newActivity;
  }, []);

  const updateActivity = useCallback((activityId: string, updates: Partial<CalendarActivity>) => {
    setActivities(prev => prev.map(act => 
      act.id === activityId ? { ...act, ...updates } : act
    ));
  }, []);

  const deleteActivity = useCallback((activityId: string) => {
    setActivities(prev => prev.filter(act => act.id !== activityId));
  }, []);

  const getActivitiesForLead = useCallback((leadId: string) => {
    return activities.filter(act => act.leadId === leadId);
  }, [activities]);

  return {
    activities,
    createActivity,
    updateActivity,
    deleteActivity,
    getActivitiesForLead,
  };
}
