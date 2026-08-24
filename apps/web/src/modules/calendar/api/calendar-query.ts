'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ICalendarEventItem, IUpdateCalendarEventRequest } from '@telebot/contracts';
import { deleteCalendarEvent, getCalendarEvents, updateCalendarEvent } from './calendar-api';

export const calendarQueryKeys = { list: () => ['calendarEvents'] as const };

export function useCalendarEventsQuery() {
  return useQuery<ICalendarEventItem[]>({
    queryKey: calendarQueryKeys.list(),
    queryFn: ({ signal }) => getCalendarEvents(signal),
  });
}

export function useUpdateCalendarEventMutation() {
  const queryClient = useQueryClient();
  return useMutation<ICalendarEventItem, Error, { id: string; data: IUpdateCalendarEventRequest }>({
    mutationFn: ({ id, data }) => updateCalendarEvent(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: calendarQueryKeys.list() });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteCalendarEventMutation() {
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, string>({
    mutationFn: (id) => deleteCalendarEvent(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: calendarQueryKeys.list() });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
