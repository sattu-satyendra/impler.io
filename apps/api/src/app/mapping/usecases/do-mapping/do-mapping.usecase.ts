import { Injectable } from '@nestjs/common';
import { UploadRepository } from '@impler/dal';
import { Defaults, ITemplateSchemaItem, UploadStatusEnum, findBestMatch, MatchType } from '@impler/shared';
import { DoMappingCommand } from './do-mapping.command';

@Injectable()
export class DoMapping {
  constructor(private uploadRepository: UploadRepository) {}

  async execute(command: DoMappingCommand) {
    const uploadInfo = await this.uploadRepository.findById(command._uploadId, 'customSchema');
    const updatedTemplateSchema = this.buildMapping(JSON.parse(uploadInfo.customSchema), command.headings);
    await this.uploadRepository.update(
      { _id: command._uploadId },
      { status: UploadStatusEnum.MAPPING, customSchema: JSON.stringify(updatedTemplateSchema) }
    );

    return updatedTemplateSchema;
  }

  private buildMapping(columns: ITemplateSchemaItem[], headings: string[]): ITemplateSchemaItem[] {
    const mapHeadings = [...headings];

    /*
     * First pass: Find high-confidence matches (exact, normalized exact, synonym)
     * This ensures the best matches are made first before lower-confidence fuzzy matches
     */
    const highConfidenceThreshold = 0.9;
    const lowConfidenceThreshold = 0.6;

    // Track which columns still need mapping
    const unmappedColumns: ITemplateSchemaItem[] = [];

    // First pass: High confidence matches only
    for (const column of columns) {
      const match = findBestMatch(mapHeadings, column.key, column.alternateKeys || [], highConfidenceThreshold);

      if (match.index > Defaults.MINUS_ONE) {
        const [heading] = mapHeadings.splice(match.index, Defaults.ONE);
        if (heading) {
          column.columnHeading = heading;
        }
      } else {
        unmappedColumns.push(column);
      }
    }

    // Second pass: Lower confidence fuzzy matches for remaining columns
    for (const column of unmappedColumns) {
      if (column.columnHeading) continue; // Already mapped in first pass

      const match = findBestMatch(mapHeadings, column.key, column.alternateKeys || [], lowConfidenceThreshold);

      if (match.index > Defaults.MINUS_ONE && this.isAcceptableFuzzyMatch(match.matchType)) {
        const [heading] = mapHeadings.splice(match.index, Defaults.ONE);
        if (heading) {
          column.columnHeading = heading;
        }
      }
    }

    return columns;
  }

  /**
   * Determine if a fuzzy match type is acceptable for auto-mapping
   * More conservative with pure Jaro-Winkler matches to avoid false positives
   */
  private isAcceptableFuzzyMatch(matchType: MatchType): boolean {
    const acceptableTypes = [
      MatchType.EXACT,
      MatchType.NORMALIZED_EXACT,
      MatchType.SYNONYM,
      MatchType.TOKEN_MATCH,
      MatchType.SUBSTRING,
      MatchType.JARO_WINKLER,
    ];

    return acceptableTypes.includes(matchType);
  }
}
