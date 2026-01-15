import { expect } from 'chai';
import {
  tokenize,
  normalizeString,
  jaroWinklerSimilarity,
  tokenMatchScore,
  findSynonymMatch,
  calculateSimilarity,
  findBestMatch,
  MatchType,
  COLUMN_SYNONYMS,
} from '@impler/shared';

describe('String Matching Utilities', () => {
  describe('tokenize', () => {
    it('should tokenize camelCase strings', () => {
      expect(tokenize('firstName')).to.deep.equal(['first', 'name']);
      expect(tokenize('lastName')).to.deep.equal(['last', 'name']);
      expect(tokenize('userEmailAddress')).to.deep.equal(['user', 'email', 'address']);
    });

    it('should tokenize PascalCase strings', () => {
      expect(tokenize('FirstName')).to.deep.equal(['first', 'name']);
      expect(tokenize('UserEmailAddress')).to.deep.equal(['user', 'email', 'address']);
    });

    it('should tokenize snake_case strings', () => {
      expect(tokenize('first_name')).to.deep.equal(['first', 'name']);
      expect(tokenize('user_email_address')).to.deep.equal(['user', 'email', 'address']);
    });

    it('should tokenize kebab-case strings', () => {
      expect(tokenize('first-name')).to.deep.equal(['first', 'name']);
      expect(tokenize('user-email-address')).to.deep.equal(['user', 'email', 'address']);
    });

    it('should tokenize strings with spaces', () => {
      expect(tokenize('First Name')).to.deep.equal(['first', 'name']);
      expect(tokenize('User Email Address')).to.deep.equal(['user', 'email', 'address']);
    });

    it('should handle mixed separators', () => {
      expect(tokenize('first_name-Test')).to.deep.equal(['first', 'name', 'test']);
    });

    it('should handle empty strings', () => {
      expect(tokenize('')).to.deep.equal([]);
      expect(tokenize(null as unknown as string)).to.deep.equal([]);
      expect(tokenize(undefined as unknown as string)).to.deep.equal([]);
    });
  });

  describe('normalizeString', () => {
    it('should convert to lowercase', () => {
      expect(normalizeString('HELLO')).to.equal('hello');
      expect(normalizeString('HelloWorld')).to.equal('helloworld');
    });

    it('should remove accents/diacritics', () => {
      expect(normalizeString('café')).to.equal('cafe');
      expect(normalizeString('naïve')).to.equal('naive');
      expect(normalizeString('señor')).to.equal('senor');
      expect(normalizeString('niño')).to.equal('nino');
    });

    it('should trim whitespace', () => {
      expect(normalizeString('  hello  ')).to.equal('hello');
      expect(normalizeString('\thello\n')).to.equal('hello');
    });

    it('should remove special characters', () => {
      expect(normalizeString('hello@world!')).to.equal('helloworld');
      expect(normalizeString('test#123')).to.equal('test123');
    });

    it('should preserve underscores, hyphens, and spaces', () => {
      expect(normalizeString('first_name')).to.equal('first_name');
      expect(normalizeString('first-name')).to.equal('first-name');
      expect(normalizeString('first name')).to.equal('first name');
    });

    it('should handle empty strings', () => {
      expect(normalizeString('')).to.equal('');
      expect(normalizeString(null as unknown as string)).to.equal('');
    });
  });

  describe('jaroWinklerSimilarity', () => {
    it('should return 1 for identical strings', () => {
      expect(jaroWinklerSimilarity('hello', 'hello')).to.equal(1);
      expect(jaroWinklerSimilarity('test', 'test')).to.equal(1);
    });

    it('should return 0 for completely different strings', () => {
      expect(jaroWinklerSimilarity('abc', 'xyz')).to.equal(0);
    });

    it('should return high scores for similar strings', () => {
      expect(jaroWinklerSimilarity('email', 'emails')).to.be.greaterThan(0.9);
      expect(jaroWinklerSimilarity('name', 'names')).to.be.greaterThan(0.9);
    });

    it('should handle transposed characters', () => {
      const score = jaroWinklerSimilarity('email', 'emial');
      expect(score).to.be.greaterThan(0.85);
    });

    it('should favor strings with matching prefixes', () => {
      const scoreMatchingPrefix = jaroWinklerSimilarity('prefix123', 'prefix456');
      const scoreNonMatchingPrefix = jaroWinklerSimilarity('123suffix', '456suffix');
      expect(scoreMatchingPrefix).to.be.greaterThan(scoreNonMatchingPrefix);
    });

    it('should handle empty strings', () => {
      expect(jaroWinklerSimilarity('', '')).to.equal(1);
      expect(jaroWinklerSimilarity('hello', '')).to.equal(0);
      expect(jaroWinklerSimilarity('', 'hello')).to.equal(0);
    });
  });

  describe('tokenMatchScore', () => {
    it('should return 1 for identical token sets', () => {
      expect(tokenMatchScore(['first', 'name'], ['first', 'name'])).to.equal(1);
    });

    it('should return correct score for partial matches', () => {
      const score = tokenMatchScore(['first', 'name', 'extra'], ['first', 'name']);
      expect(score).to.equal(1); // All of smaller set matches
    });

    it('should return 0 for no matches', () => {
      expect(tokenMatchScore(['abc', 'def'], ['xyz', 'uvw'])).to.equal(0);
    });

    it('should handle empty arrays', () => {
      expect(tokenMatchScore([], ['first', 'name'])).to.equal(0);
      expect(tokenMatchScore(['first', 'name'], [])).to.equal(0);
    });
  });

  describe('findSynonymMatch', () => {
    it('should find canonical name for common variations', () => {
      expect(findSynonymMatch('e-mail')).to.equal('email');
      expect(findSynonymMatch('emailaddress')).to.equal('email');
      expect(findSynonymMatch('telephone')).to.equal('phone');
      expect(findSynonymMatch('mobile')).to.equal('phone');
    });

    it('should return canonical name if input is canonical', () => {
      expect(findSynonymMatch('email')).to.equal('email');
      expect(findSynonymMatch('phone')).to.equal('phone');
    });

    it('should be case insensitive', () => {
      expect(findSynonymMatch('EMAIL')).to.equal('email');
      expect(findSynonymMatch('E-Mail')).to.equal('email');
    });

    it('should ignore separators', () => {
      expect(findSynonymMatch('first_name')).to.equal('firstname');
      expect(findSynonymMatch('first-name')).to.equal('firstname');
    });

    it('should return null for unknown terms', () => {
      expect(findSynonymMatch('xyzabc123')).to.be.null;
    });
  });

  describe('calculateSimilarity', () => {
    it('should return exact match for identical strings', () => {
      const result = calculateSimilarity('email', 'email');
      expect(result.score).to.equal(1);
      expect(result.matchType).to.equal(MatchType.EXACT);
    });

    it('should return normalized match for case differences', () => {
      const result = calculateSimilarity('Email', 'email');
      expect(result.score).to.equal(0.99);
      expect(result.matchType).to.equal(MatchType.NORMALIZED_EXACT);
    });

    it('should return normalized match for accent differences', () => {
      const result = calculateSimilarity('café', 'cafe');
      expect(result.score).to.be.greaterThan(0.95);
    });

    it('should return normalized match for separator differences', () => {
      const result = calculateSimilarity('first_name', 'firstName');
      expect(result.score).to.equal(0.98);
      expect(result.matchType).to.equal(MatchType.NORMALIZED_EXACT);
    });

    it('should return synonym match for known synonyms', () => {
      const result = calculateSimilarity('e-mail', 'emailaddress');
      expect(result.score).to.equal(0.95);
      expect(result.matchType).to.equal(MatchType.SYNONYM);
    });

    it('should return token match for tokenized matches', () => {
      const result = calculateSimilarity('user_first_name', 'first_name');
      expect(result.matchType).to.equal(MatchType.TOKEN_MATCH);
      expect(result.score).to.be.greaterThan(0.8);
    });

    it('should return substring match when one contains the other', () => {
      // 'email' vs 'user_email_address' - token match has higher precedence
      // because 'email' appears as a full token in 'user_email_address'
      const result = calculateSimilarity('email', 'user_email_address');
      expect(result.score).to.be.greaterThan(0.7);
      // Token match or substring are both acceptable here
      expect([MatchType.TOKEN_MATCH, MatchType.SUBSTRING]).to.include(result.matchType);

      // Test pure substring (no token match, no synonym)
      const result2 = calculateSimilarity('prod', 'myproductlist');
      expect(result2.matchType).to.equal(MatchType.SUBSTRING);
      expect(result2.score).to.be.greaterThan(0.7);
    });

    it('should return no match for completely different strings', () => {
      const result = calculateSimilarity('abc', 'xyz');
      expect(result.matchType).to.equal(MatchType.NO_MATCH);
      expect(result.score).to.equal(0);
    });

    it('should handle empty strings', () => {
      const result = calculateSimilarity('', 'test');
      expect(result.matchType).to.equal(MatchType.NO_MATCH);
      expect(result.score).to.equal(0);
    });
  });

  describe('findBestMatch', () => {
    const headings = ['First Name', 'Last Name', 'E-Mail Address', 'Phone Number', 'Date of Birth'];

    it('should find exact matches', () => {
      const result = findBestMatch(headings, 'First Name');
      expect(result.index).to.equal(0);
      expect(result.score).to.be.greaterThan(0.9);
    });

    it('should find matches with different casing', () => {
      const result = findBestMatch(headings, 'first name');
      expect(result.index).to.equal(0);
      expect(result.score).to.be.greaterThan(0.9);
    });

    it('should find matches with different separators', () => {
      const result = findBestMatch(headings, 'first_name');
      expect(result.index).to.equal(0);
      expect(result.score).to.be.greaterThan(0.9);
    });

    it('should find matches using synonyms', () => {
      const result = findBestMatch(headings, 'email');
      expect(result.index).to.equal(2); // E-Mail Address
      expect(result.score).to.be.greaterThan(0.6);
    });

    it('should find matches using alternate keys', () => {
      const result = findBestMatch(headings, 'dob', ['Date of Birth', 'birthday']);
      expect(result.index).to.equal(4);
      expect(result.score).to.be.greaterThan(0.9);
    });

    it('should return -1 when no match found above threshold', () => {
      const result = findBestMatch(headings, 'zzz_unknown_field');
      expect(result.index).to.equal(-1);
      expect(result.matchType).to.equal(MatchType.NO_MATCH);
    });

    it('should respect custom threshold', () => {
      const strictResult = findBestMatch(headings, 'nam', [], 0.9);
      expect(strictResult.index).to.equal(-1);

      const lenientResult = findBestMatch(headings, 'nam', [], 0.5);
      // Might find a substring match with lower threshold
    });

    it('should handle camelCase to space-separated matching', () => {
      const result = findBestMatch(headings, 'firstName');
      expect(result.index).to.equal(0);
    });

    it('should handle snake_case to space-separated matching', () => {
      const result = findBestMatch(headings, 'phone_number');
      expect(result.index).to.equal(3);
    });
  });

  describe('Real-world column mapping scenarios', () => {
    it('should match common CSV header variations', () => {
      const csvHeaders = ['customer_email', 'First Name', 'LAST_NAME', 'phone-number', 'Street Address', 'postal code'];

      // Test various column keys against these headers
      expect(findBestMatch(csvHeaders, 'email').index).to.equal(0);
      expect(findBestMatch(csvHeaders, 'firstName').index).to.equal(1);
      expect(findBestMatch(csvHeaders, 'last_name').index).to.equal(2);
      expect(findBestMatch(csvHeaders, 'telephone').index).to.equal(3); // via synonym
      expect(findBestMatch(csvHeaders, 'address').index).to.equal(4);
      expect(findBestMatch(csvHeaders, 'zipcode').index).to.equal(5); // via synonym
    });

    it('should handle international characters', () => {
      const headings = ['Nombre', 'Correo Electrónico', 'Teléfono'];
      expect(findBestMatch(headings, 'nombre').index).to.equal(0);
      expect(findBestMatch(headings, 'correo electronico').index).to.equal(1);
    });

    it('should match common business fields', () => {
      const headings = ['Company Name', 'Job Title', 'Department'];
      expect(findBestMatch(headings, 'company').index).to.equal(0);
      expect(findBestMatch(headings, 'jobtitle').index).to.equal(1);
      expect(findBestMatch(headings, 'dept').index).to.equal(2); // via synonym
    });
  });
});
