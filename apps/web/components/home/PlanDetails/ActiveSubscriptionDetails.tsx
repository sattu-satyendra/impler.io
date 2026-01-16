import React from 'react';
import dayjs from 'dayjs';
import { Stack, Group } from '@mantine/core';

import { DATE_FORMATS } from '@config';
import { ISubscriptionData, numberFormatter } from '@impler/shared';

import { PlanDetailCard } from './PlanDetailsCard';

interface ActivePlanDetailsProps {
  activePlanDetails: ISubscriptionData;
  numberOfAllocatedRowsInCurrentPlan: number;
  showWarning?: boolean;
}

export function ActiveSubscriptionDetails({
  activePlanDetails,
  numberOfAllocatedRowsInCurrentPlan,
  showWarning,
}: ActivePlanDetailsProps) {
  const teamMembersUsed = activePlanDetails?.usage?.TEAM_MEMBERS || 0;
  const teamMembersAllocated = activePlanDetails?.meta?.TEAM_MEMBERS ? activePlanDetails.meta.TEAM_MEMBERS - 1 : 0;

  let currentUsedTeamMembers: string | number = Math.max(0, teamMembersUsed);
  let allocatedTeamMembers: string | number = Math.max(0, teamMembersAllocated);

  if (allocatedTeamMembers === 0) {
    allocatedTeamMembers = 'NA';
    currentUsedTeamMembers = '0';
  }
  const isTeamMemberLimitReached = Number(currentUsedTeamMembers) >= Number(allocatedTeamMembers);

  return (
    <Stack spacing={0}>
      <Stack spacing="sm">
        <Group grow align="flex-start">
          <PlanDetailCard
            title="Records Imported"
            value={`${activePlanDetails?.usage?.ROWS ?? 0}/${numberFormatter(numberOfAllocatedRowsInCurrentPlan)}`}
            isWarning={showWarning}
          />
          <PlanDetailCard
            title="Team Members"
            value={`${currentUsedTeamMembers}/${allocatedTeamMembers}`}
            isWarning={isTeamMemberLimitReached}
          />
          <PlanDetailCard title="Active Plan" value={activePlanDetails.plan.name} />
          <PlanDetailCard title="Expiry Date" value={dayjs(activePlanDetails.expiryDate).format(DATE_FORMATS.LONG)} />
        </Group>
      </Stack>
    </Stack>
  );
}
