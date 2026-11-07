import { useApiQuery } from '@/lib/hooks/useApiQuery';
import { useApp } from '@/contexts/AppContext';
import { queryKeys } from '@/lib/query-client';
import { groupService } from '../services/group.service';
import { learnerWirdService } from '../services/learner-wird.service';
import { DEFAULT_TIMEZONE, type GroupDto, type LearnerGroupOverviewDto } from '@wirdi/shared';

export function useLearnerGroupViewModel(groupId: string) {
  const { user } = useApp();
  const groupQuery = useApiQuery<GroupDto>({
    queryKey: queryKeys.groups.detail(groupId),
    queryFn: () => groupService.getGroup(groupId),
  });

  const overviewQuery = useApiQuery<LearnerGroupOverviewDto>({
    queryKey: queryKeys.learnerWirds.overview(groupId),
    queryFn: () => learnerWirdService.getLearnerGroupOverview(groupId),
  });

  const group = groupQuery.data?.data;
  const overview = overviewQuery.data?.data;

  return {
    group,
    overview,
    userTimezone: user?.timezone ?? DEFAULT_TIMEZONE,
    isLoading: groupQuery.isLoading || overviewQuery.isLoading,
    queryError: groupQuery.error?.message ?? overviewQuery.error?.message ?? null,
  };
}
