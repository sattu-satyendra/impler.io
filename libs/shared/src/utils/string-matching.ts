/**
 * Enhanced fuzzy string matching utilities for column mapping
 * Provides intelligent matching between CSV headers and destination column names
 */

/**
 * Common synonyms for column names used in data imports
 * Maps standard field names to common variations
 */
export const COLUMN_SYNONYMS: Record<string, string[]> = {
  // Personal identifiers
  email: ['e-mail', 'emailaddress', 'mail', 'correo', 'emailid', 'user_email', 'contact_email'],
  phone: ['telephone', 'tel', 'mobile', 'cell', 'telefono', 'phonenumber', 'contact_number', 'mobilenumber'],
  name: ['fullname', 'nombre', 'customer_name', 'displayname', 'contact_name'],
  firstname: ['first_name', 'fname', 'givenname', 'given_name', 'forename'],
  lastname: ['last_name', 'lname', 'surname', 'familyname', 'family_name'],
  middlename: ['middle_name', 'mname', 'middleinitial', 'middle_initial'],

  // Address fields
  address: ['street', 'streetaddress', 'street_address', 'direccion', 'addr', 'address1', 'addressline1'],
  city: ['town', 'ciudad', 'locality'],
  state: ['province', 'region', 'estado', 'county'],
  country: ['nation', 'pais', 'countryname', 'country_name'],
  zipcode: ['zip', 'postalcode', 'postal_code', 'postcode', 'zip_code', 'pincode', 'pin_code'],

  // Business fields
  company: ['organization', 'organisation', 'companyname', 'company_name', 'business', 'employer', 'firm'],
  department: ['dept', 'division', 'unit', 'team'],
  jobtitle: ['job_title', 'title', 'position', 'role', 'designation'],

  // Date fields
  date: ['fecha', 'dt', 'datetime'],
  birthdate: ['birthday', 'dob', 'dateofbirth', 'date_of_birth', 'birth_date'],
  createdat: ['created_at', 'creationdate', 'creation_date', 'datecreated', 'date_created'],
  updatedat: ['updated_at', 'modifieddate', 'modified_date', 'datemodified', 'date_modified', 'lastmodified'],

  // Identifiers
  id: ['identifier', 'uid', 'uuid', 'key', 'code'],
  customerid: ['customer_id', 'custid', 'cust_id', 'clientid', 'client_id'],
  orderid: ['order_id', 'orderno', 'order_no', 'ordernumber', 'order_number'],
  productid: ['product_id', 'productcode', 'product_code', 'sku', 'itemid', 'item_id'],

  // Numeric fields
  amount: ['total', 'sum', 'value', 'price', 'cost', 'monto', 'precio'],
  quantity: ['qty', 'count', 'cantidad', 'units', 'number'],
  percentage: ['percent', 'pct', 'rate', 'porcentaje'],

  // Status fields
  status: ['state', 'estado', 'condition'],
  active: ['enabled', 'isactive', 'is_active'],

  // Description fields
  description: ['desc', 'details', 'descripcion', 'notes', 'comments', 'remarks'],

  // Web fields
  website: ['url', 'web', 'homepage', 'site', 'webpage'],
  username: ['user_name', 'login', 'userid', 'user_id', 'handle'],
  password: ['pwd', 'pass', 'secret'],

  // Other common fields
  gender: ['sex', 'genero'],
  age: ['edad', 'years'],
  image: ['photo', 'picture', 'avatar', 'img', 'imagen', 'foto'],
  file: ['document', 'attachment', 'archivo'],
  category: ['type', 'categoria', 'group', 'class'],
  tags: ['labels', 'keywords', 'etiquetas'],
};

/**
 * Result of a string similarity comparison
 */
export interface IMatchResult {
  score: number; // 0-1, where 1 is perfect match
  matchType: MatchType;
}

export enum MatchType {
  EXACT = 'exact',
  NORMALIZED_EXACT = 'normalized_exact',
  SYNONYM = 'synonym',
  JARO_WINKLER = 'jaro_winkler',
  TOKEN_MATCH = 'token_match',
  SUBSTRING = 'substring',
  NO_MATCH = 'no_match',
}

/**
 * Tokenize a string by splitting on common separators
 * Handles camelCase, snake_case, kebab-case, and spaces
 *
 * @example
 * tokenize('firstName') => ['first', 'name']
 * tokenize('first_name') => ['first', 'name']
 * tokenize('first-name') => ['first', 'name']
 * tokenize('FirstName') => ['first', 'name']
 */
export function tokenize(str: string): string[] {
  if (!str) return [];

  return (
    str
      // Insert space before uppercase letters (for camelCase/PascalCase)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Replace common separators with space
      .replace(/[-_./\\]+/g, ' ')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .split(' ')
      .filter((token) => token.length > 0)
  );
}

/**
 * Normalize a string for comparison
 * - Converts to lowercase
 * - Removes accents/diacritics
 * - Trims whitespace
 * - Removes special characters (except alphanumeric)
 */
export function normalizeString(str: string): string {
  if (!str) return '';

  return (
    String(str)
      .trim()
      .toLowerCase()
      // Remove accents/diacritics
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Remove non-alphanumeric except spaces, underscores, hyphens
      .replace(/[^a-z0-9\s_-]/g, '')
  );
}

/**
 * Calculate Jaro similarity between two strings
 * Returns a value between 0 and 1
 */
function jaroSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  // Count transpositions
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  return (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3;
}

/**
 * Calculate Jaro-Winkler similarity between two strings
 * Gives higher scores to strings that match from the beginning
 * Returns a value between 0 and 1
 *
 * @param s1 First string
 * @param s2 Second string
 * @param prefixScale Scaling factor for common prefix (default 0.1, max 0.25)
 */
export function jaroWinklerSimilarity(s1: string, s2: string, prefixScale = 0.1): number {
  const jaro = jaroSimilarity(s1, s2);

  // Find common prefix (up to 4 characters)
  let prefixLength = 0;
  const maxPrefix = Math.min(4, Math.min(s1.length, s2.length));

  for (let i = 0; i < maxPrefix; i++) {
    if (s1[i] === s2[i]) {
      prefixLength++;
    } else {
      break;
    }
  }

  // Ensure prefixScale doesn't exceed 0.25
  const scale = Math.min(prefixScale, 0.25);

  return jaro + prefixLength * scale * (1 - jaro);
}

/**
 * Check if two sets of tokens have significant overlap
 * Returns a score based on the proportion of matching tokens
 */
export function tokenMatchScore(tokens1: string[], tokens2: string[]): number {
  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  let matches = 0;
  for (const token of set1) {
    if (set2.has(token)) {
      matches++;
    }
  }

  // Score based on how many tokens match relative to the smaller set
  const minSize = Math.min(set1.size, set2.size);

  return matches / minSize;
}

/**
 * Check if a key matches any synonym for a given canonical name
 */
export function findSynonymMatch(key: string, synonymDict: Record<string, string[]> = COLUMN_SYNONYMS): string | null {
  const normalizedKey = normalizeString(key).replace(/[-_\s]/g, '');

  // Check if the key itself is a canonical name
  if (synonymDict[normalizedKey]) {
    return normalizedKey;
  }

  // Check if the key matches any synonym
  for (const [canonical, synonyms] of Object.entries(synonymDict)) {
    const normalizedCanonical = normalizeString(canonical).replace(/[-_\s]/g, '');

    // Check exact match with canonical name
    if (normalizedKey === normalizedCanonical) {
      return canonical;
    }

    // Check against synonyms
    for (const synonym of synonyms) {
      const normalizedSynonym = normalizeString(synonym).replace(/[-_\s]/g, '');
      if (normalizedKey === normalizedSynonym) {
        return canonical;
      }
    }
  }

  return null;
}

/**
 * Calculate the overall similarity between two strings using multiple algorithms
 * Returns the best match result with score and match type
 */
export function calculateSimilarity(str1: string, str2: string): IMatchResult {
  if (!str1 || !str2) {
    return { score: 0, matchType: MatchType.NO_MATCH };
  }

  const s1 = String(str1).trim();
  const s2 = String(str2).trim();

  // 1. Exact match
  if (s1 === s2) {
    return { score: 1, matchType: MatchType.EXACT };
  }

  const normalized1 = normalizeString(s1);
  const normalized2 = normalizeString(s2);

  // 2. Normalized exact match (case-insensitive, accent-insensitive)
  if (normalized1 === normalized2) {
    return { score: 0.99, matchType: MatchType.NORMALIZED_EXACT };
  }

  // 3. Normalized match without separators
  const stripped1 = normalized1.replace(/[-_\s]/g, '');
  const stripped2 = normalized2.replace(/[-_\s]/g, '');

  if (stripped1 === stripped2) {
    return { score: 0.98, matchType: MatchType.NORMALIZED_EXACT };
  }

  // 4. Synonym match
  const synonym1 = findSynonymMatch(s1);
  const synonym2 = findSynonymMatch(s2);

  if (synonym1 && synonym2 && synonym1 === synonym2) {
    return { score: 0.95, matchType: MatchType.SYNONYM };
  }

  // 5. Token-based matching
  const tokens1 = tokenize(s1);
  const tokens2 = tokenize(s2);
  const tokenScore = tokenMatchScore(tokens1, tokens2);

  if (tokenScore >= 0.8) {
    return { score: 0.85 + tokenScore * 0.1, matchType: MatchType.TOKEN_MATCH };
  }

  // 6. Jaro-Winkler similarity on normalized strings
  const jwScore = jaroWinklerSimilarity(stripped1, stripped2);

  if (jwScore >= 0.85) {
    return { score: jwScore * 0.9, matchType: MatchType.JARO_WINKLER };
  }

  // 7. Substring matching (one contains the other)
  if (stripped1.length >= 3 && stripped2.length >= 3) {
    if (stripped1.includes(stripped2) || stripped2.includes(stripped1)) {
      const lengthRatio = Math.min(stripped1.length, stripped2.length) / Math.max(stripped1.length, stripped2.length);

      return { score: 0.7 + lengthRatio * 0.15, matchType: MatchType.SUBSTRING };
    }
  }

  // 8. Partial token match
  if (tokenScore >= 0.5) {
    return { score: 0.5 + tokenScore * 0.2, matchType: MatchType.TOKEN_MATCH };
  }

  // 9. Lower Jaro-Winkler scores
  if (jwScore >= 0.7) {
    return { score: jwScore * 0.7, matchType: MatchType.JARO_WINKLER };
  }

  return { score: 0, matchType: MatchType.NO_MATCH };
}

/**
 * Find the best matching heading for a column key from a list of headings
 * Returns the index of the best match and its score, or -1 if no good match found
 *
 * @param headings Available CSV headings
 * @param key Column key to match
 * @param alternateKeys Optional alternate keys for the column
 * @param threshold Minimum score to consider a match (default 0.6)
 */
export function findBestMatch(
  headings: string[],
  key: string,
  alternateKeys: string[] = [],
  threshold = 0.6
): { index: number; score: number; matchType: MatchType } {
  let bestIndex = -1;
  let bestScore = 0;
  let bestMatchType = MatchType.NO_MATCH;

  // Combine key with alternate keys for matching
  const keysToMatch = [key, ...alternateKeys];

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];

    for (const matchKey of keysToMatch) {
      const result = calculateSimilarity(heading, matchKey);

      if (result.score > bestScore) {
        bestScore = result.score;
        bestIndex = i;
        bestMatchType = result.matchType;
      }

      // Early exit for exact/near-exact matches
      if (bestScore >= 0.98) {
        return { index: bestIndex, score: bestScore, matchType: bestMatchType };
      }
    }
  }

  // Only return a match if it meets the threshold
  if (bestScore >= threshold) {
    return { index: bestIndex, score: bestScore, matchType: bestMatchType };
  }

  return { index: -1, score: 0, matchType: MatchType.NO_MATCH };
}
