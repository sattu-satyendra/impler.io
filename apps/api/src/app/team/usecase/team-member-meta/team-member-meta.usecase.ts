import { Injectable } from '@nestjs/common';
import { EnvironmentRepository, ProjectInvitationRepository } from '@impler/dal';

@Injectable()
export class TeamMemberMeta {
  constructor(
    private environmentRepository: EnvironmentRepository,
    private projectInvitationRepository: ProjectInvitationRepository
  ) {}

  async exec(projectId: string) {
    const teamMembers = await this.environmentRepository.getProjectTeamMembers(projectId);
    const invitationCount = await this.projectInvitationRepository.count({
      _projectId: projectId,
    });

    // All features enabled - unlimited team members (999)
    const allocated = 999;
    const total = teamMembers.length + invitationCount;
    const available = Math.max(allocated - total, 0);

    return { available, total, allocated, error: null };
  }
}
