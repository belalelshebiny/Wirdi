import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Typography } from '@/components/ui/typography';
import { GroupInfoCard } from '../components/molecules/GroupInfoCard';
import { ActivationRequestModal } from '@/modules/requests/components/organisms/ActivationRequestModal';
import { ExcuseRequestModal } from '@/modules/requests/components/organisms/ExcuseRequestModal';
import { useLearnerGroupViewModel } from '../viewmodels/learner-group.viewmodel';
import { LearnerInactiveAlert } from '../components/molecules/LearnerInactiveAlert';
import { GroupInactiveAlert } from '../components/molecules/GroupInactiveAlert';
import { ActiveExcuseNotice } from '../components/molecules/ActiveExcuseNotice';
import { ScheduleCard } from '../components/molecules/ScheduleCard';
import { MyWirdTrackingCard } from '../components/molecules/MyWirdTrackingCard';
import { WirdRecordingCard } from '../components/molecules/WirdRecordingCard';
import { ExcuseRequestButton } from '../components/molecules/ExcuseRequestButtonCard';

type Props = { groupId: string };

export default function LearnerGroupDetailView({ groupId }: Props) {
  const vm = useLearnerGroupViewModel(groupId);
  const [isExcuseModalOpen, setIsExcuseModalOpen] = useState(false);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);

  if (vm.isLoading) {
    return (
      <div className='flex items-center justify-center py-20 text-muted-foreground gap-2'>
        <Loader2 className='h-5 w-5 animate-spin' />
        <Typography className='text-muted-foreground'>جاري التحميل...</Typography>
      </div>
    );
  }

  if (vm.queryError || !vm.group || !vm.overview) {
    return (
      <Alert alertType='ERROR'>
        <AlertDescription>{vm.queryError ?? 'لم يتم العثور على المجموعة'}</AlertDescription>
      </Alert>
    );
  }

  const { group, overview } = vm;

  if (overview.type === 'nothing' && overview.reason === 'removed') {
    return (
      <div className='space-y-6'>
        <GroupInfoCard
          group={group}
          userTimezone={vm.userTimezone}
          isEditable={false}
          onEditGroup={() => {}}
          onOpenSchedule={() => {}}
        />
        <Alert alertType='WARN'>
          <AlertDescription>
            تمت إزالتك من هذه المجموعة. يمكنك مشاهدة البيانات السابقة فقط.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (overview.type !== 'overview') {
    return (
      <Alert alertType='ERROR'>
        <AlertDescription>لا تتوفر بيانات متابعة لهذا الطالب في هذه المجموعة</AlertDescription>
      </Alert>
    );
  }

  const isGroupInactive = overview.groupStatus === 'INACTIVE';
  const isInactive = overview.myMembership.status === 'INACTIVE';
  const activeExcuseExpiresAt = overview.myMembership.activeExcuseExpiresAt;

  const handleRequestActivation = () => {
    setIsActivationModalOpen(true);
  };

  return (
    <div className='space-y-6'>
      <GroupInfoCard
        group={group}
        userTimezone={vm.userTimezone}
        isEditable={false}
        onEditGroup={() => {}}
        onOpenSchedule={() => {}}
        onManageLearners={() => {}}
      />

      {/* Inactive learner alert */}
      {isInactive && <LearnerInactiveAlert onRequestActivation={handleRequestActivation} />}

      {/* Inactive group alert */}
      {isGroupInactive && <GroupInactiveAlert />}

      {/* Active excuse notice */}
      {activeExcuseExpiresAt && (
        <ActiveExcuseNotice
          expiresAt={activeExcuseExpiresAt}
          timezone={overview.myMembership.studentTimezone}
        />
      )}

      {/* Schedule image */}
      <ScheduleCard scheduleImage={overview.week.scheduleImage} />

      {/* My tracking */}
      <MyWirdTrackingCard
        rows={overview.rows}
        weekId={overview.week.id}
        groupId={groupId}
        userTimezone={overview.myMembership.studentTimezone}
      />

      {/* Recording card is self-contained and handles its own empty states */}
      <WirdRecordingCard groupId={groupId} />

      {!isInactive && <ExcuseRequestButton onClick={() => setIsExcuseModalOpen(true)} />}

      {/* Excuse modal */}
      <ExcuseRequestModal
        open={isExcuseModalOpen}
        onOpenChange={setIsExcuseModalOpen}
        defaultGroupId={groupId}
        hideGroupSelect
      />

      {/* Activation request modal */}
      <ActivationRequestModal
        open={isActivationModalOpen}
        onOpenChange={setIsActivationModalOpen}
        defaultGroupId={groupId}
        hideGroupSelect
      />
    </div>
  );
}
