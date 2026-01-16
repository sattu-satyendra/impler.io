import { BadRequestException, Injectable } from '@nestjs/common';
import { TemplateRepository, TemplateEntity } from '@impler/dal';
import { BILLABLEMETRIC_CODE_ENUM, IImportConfig } from '@impler/shared';
import { APIMessages } from '@shared/constants';

@Injectable()
export class GetImportConfig {
  constructor(private templateRepository: TemplateRepository) {}

  async execute(projectId: string, templateId?: string): Promise<IImportConfig> {
    // All features are enabled - no subscription checks needed
    const isFeatureAvailableMap = new Map<string, boolean>();

    Object.values(BILLABLEMETRIC_CODE_ENUM).forEach((code) => {
      isFeatureAvailableMap.set(code, true);
    });

    let template: TemplateEntity;
    if (templateId) {
      template = await this.templateRepository.findOne({
        _projectId: projectId,
        _id: templateId,
      });

      if (!template) {
        throw new BadRequestException(APIMessages.TEMPLATE_NOT_FOUND);
      }
    }

    return {
      ...Object.fromEntries(isFeatureAvailableMap),
      showBranding: false,
      mode: template?.mode,
      title: template?.name,
    };
  }
}
