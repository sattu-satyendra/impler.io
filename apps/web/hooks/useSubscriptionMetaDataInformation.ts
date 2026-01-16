import { SelectItem } from '@mantine/core';

import { COLUMN_TYPES } from '@config';

export function useSubscriptionMetaDataInformation() {
  // All features are enabled - no subscription restrictions
  const columnTypes: SelectItem[] = COLUMN_TYPES;

  return {
    columnTypes,
    advancedValidationsUnavailable: false,
    freezeColumnsUnavailable: false,
    requiredValidationUnavailable: false,
    uniqueValidationUnavailable: false,
    defaultValueUnavailable: false,
    dateFormatUnavailable: false,
    bubbleIoIntegrationUnavailable: false,
    webhookRetrySettingsUnavailable: false,
    multiSelectValuesUnavailable: false,
    customValidatatorCodeUnavailable: false,
    lengthValidationUnavailable: false,
    digitsValidationUnavailable: false,
    rangeValidationUnavailable: false,
    multipleColumnsCombinationUniqueValidationUnavailable: false,
  };
}
