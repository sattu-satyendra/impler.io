import { DEFAULT_VALUES_ARR, DEFAULT_VALUES_OBJ } from './defaults';

const tabWidth = 2;
export function createRecordFormat(variables: string[], extraParams: Record<string, string | number> = {}): string {
  const recordFormat = variables.reduce((acc, variable) => {
    return { ...acc, [variable]: createVariable(variable) };
  }, extraParams);

  return JSON.stringify(recordFormat, null, tabWidth);
}
export function updateCombinedFormat(format: string, variables: string[]): string {
  const combinedFormat = JSON.parse(format);
  const regex = /%.*?%/g;
  const recordFormat = variables.reduce((acc, variable) => {
    return { ...acc, [variable]: createVariable(variable) };
  }, {});
  Object.keys(combinedFormat).forEach((key) => {
    if (regex.test(key) && typeof combinedFormat[key] === 'object' && !Array.isArray(combinedFormat[key])) {
      combinedFormat[key] = recordFormat;
    }
  });

  return JSON.stringify(combinedFormat, null, tabWidth);
}
export function createVariable(name: string) {
  return `{{${name}}}`;
}

export function replaceVariableInStringWithKey(str: string, key: string, value: any) {
  return str.replace(createVariable(key), value);
}

export function replaceVariableInString(str: string, record: Record<string, string | number>) {
  const regex = /{{.*?}}/g;
  let modifiedStr: string | number | null | undefined = str;
  const keys = Object.keys(record);
  const matches = str.match(regex);
  for (const match of matches) {
    const key = match.replace(/{{|}}/g, '');
    if (keys.includes(key)) {
      if (str === match) {
        // Direct replacement - preserve null/undefined values
        modifiedStr = record[key];
      } else if (typeof modifiedStr === 'string') {
        // String interpolation - only if value is not null/undefined
        if (record[key] !== null && record[key] !== undefined) {
          modifiedStr = replaceVariableInStringWithKey(modifiedStr, key, record[key]);
        }
      }
    }
  }

  return modifiedStr;
}

export function replaceVariable(formatKey: unknown, key: string, value: any, record: Record<string, string | number>) {
  if (typeof formatKey == 'string' && /{{|}}/g.test(formatKey)) return replaceVariableInString(formatKey, record);
  else if (typeof formatKey === 'object' && !Array.isArray(formatKey) && formatKey !== null) {
    // handling objects
    const replacedObj = replaceVariablesInObject(formatKey as Record<string, unknown>, record);

    // Return the object only if it has remaining keys after omitting missing fields
    return Object.keys(replacedObj).length > 0 ? replacedObj : undefined;
  } else if (Array.isArray(formatKey)) {
    // handling arrays - filter out items that should be omitted
    return formatKey
      .map((item: unknown) => replaceVariable(item, key, value, record))
      .filter((item) => !shouldOmitValue(item));
  }

  return formatKey;
}

export function replaceVariablesInObject(
  format: Record<string, unknown>,
  record: Record<string, string | number>,
  defaultValues?: Record<string, string | number>
): Record<string, string> {
  record = updateDefaultValues(record, defaultValues);

  return Object.keys(format).reduce((acc, key) => {
    const replacedValue = replaceVariable(format[key], key, format[key], record);

    // Skip fields that still contain unreplaced {{...}} placeholders (missing data)
    if (shouldOmitValue(replacedValue)) {
      return acc;
    }

    acc[key] = replacedValue;

    return acc;
  }, {});
}

/**
 * Checks if a value should be omitted from the output.
 * Returns true if the value contains unreplaced {{...}} placeholders
 * or if it's an empty object (all nested fields were omitted).
 *
 * Note: null values are NOT omitted as they may be intentional defaults (<<null>>)
 */
export function shouldOmitValue(value: unknown): boolean {
  // Omit undefined values (returned when nested objects are empty or field truly missing)
  if (value === undefined) {
    return true;
  }

  // null is a valid value (user may have set <<null>> as default) - do NOT omit
  if (value === null) {
    return false;
  }

  if (typeof value === 'string') {
    // Check if the string contains unreplaced placeholders
    return /{{.*?}}/.test(value);
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    // Check if all keys in the object should be omitted (empty object)
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return true;
    }
    // Check if all values in the object should be omitted
    return keys.every((key) => shouldOmitValue((value as Record<string, unknown>)[key]));
  }

  if (Array.isArray(value)) {
    // Filter out items that should be omitted and check if array is empty
    const filteredArray = value.filter((item) => !shouldOmitValue(item));

    return filteredArray.length === 0;
  }

  return false;
}

export function updateDefaultValues(
  record: Record<string, string | number>,
  defaultValues?: Record<string, string | number>
) {
  if (defaultValues) {
    Object.keys(defaultValues).forEach((key) => {
      if (typeof record[key] === 'undefined') {
        if (typeof defaultValues[key] === 'string' && DEFAULT_VALUES_ARR.includes(defaultValues[key] as string)) {
          // checking for specifc value
          record[key] =
            typeof DEFAULT_VALUES_OBJ[defaultValues[key]] === 'function'
              ? DEFAULT_VALUES_OBJ[defaultValues[key]]()
              : DEFAULT_VALUES_OBJ[defaultValues[key]];
        } else {
          // applying default value
          record[key] = defaultValues[key];
        }
      }
    });
  }

  return record;
}

export function validateVariable(name: string) {
  return /{{|}}/g.test(name);
}

export function getRecordFormat(chunkFormat: string) {
  const format = JSON.parse(chunkFormat);
  const regex = /%.*?%/g;
  let recordFormat = null;
  Object.keys(format).forEach((key) => {
    if (regex.test(key) && typeof format[key] === 'object') {
      recordFormat = format[key];
      delete format[key];
      format[key.slice(1, -1)] = createVariable('data');
    } else if (regex.test(key) && Array.isArray(format[key])) {
      throw new Error('Array format not supported for record.');
    } else if (Array.isArray(format[key])) {
      format[key] = format[key].map((item) => {
        if (typeof item === 'string' && regex.test(item)) {
          return createVariable(item.slice(1, -1));
        } else if (typeof item === 'object' && !Array.isArray(item) && item !== null) {
          const arrFormat = getRecordFormat(JSON.stringify(item));
          if (arrFormat && arrFormat.chunkFormat) {
            recordFormat = arrFormat.recordFormat;

            return arrFormat.chunkFormat;
          }

          return item;
        } else {
          return item;
        }
      });
    } else if (typeof format[key] === 'object' && !Array.isArray(format[key]) && format[key] !== null) {
      const nestedFormats = getRecordFormat(JSON.stringify(format[key]));
      if (nestedFormats && nestedFormats.recordFormat) {
        format[key] = nestedFormats.chunkFormat;
        recordFormat = nestedFormats.recordFormat;
      }
    }
  });

  if (!recordFormat && recordFormat === null) return null;

  return {
    recordFormat: JSON.stringify(recordFormat),
    chunkFormat: JSON.stringify(format),
  };
}
