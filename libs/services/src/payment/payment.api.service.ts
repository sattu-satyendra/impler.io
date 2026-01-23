import axios from 'axios';
import { ISubscriptionData, BILLABLEMETRIC_CODE_ENUM, handleApiError } from '@impler/shared';

interface ICheckData {
  units: number;
  billableMetricCode: BILLABLEMETRIC_CODE_ENUM;
}

export class PaymentAPIService {
  private AUTH_KEY: string;
  private AUTH_VALUE: string;
  private PAYMENT_API_BASE_URL: string;

  constructor() {
    this.AUTH_KEY = process.env.PAYMENT_API_AUTH_KEY;
    this.AUTH_VALUE = process.env.PAYMENT_API_AUTH_VALUE;
    this.PAYMENT_API_BASE_URL = process.env.PAYMENT_API_BASE_URL;
  }

  async createEvent(createEventData: ICheckData, userExternalIdOrEmail: string) {
    if (!this.PAYMENT_API_BASE_URL) return;

    const createEventAPIBody = {
      customerId: userExternalIdOrEmail,
      billableMetricCode: createEventData.billableMetricCode ?? BILLABLEMETRIC_CODE_ENUM.ROWS,
      timestamp: new Date(),
      metadata: {
        units: createEventData.units,
      },
    };

    const url = `${this.PAYMENT_API_BASE_URL}/api/v1/events`;
    try {
      const response = await axios.post(url, createEventAPIBody, {
        headers: {
          [this.AUTH_KEY]: this.AUTH_VALUE,
        },
      });

      return response.data;
    } catch (error) {
      const errorMessage = handleApiError({
        axiosInstance: axios,
        error,
        context: 'createEvent',
        shouldLog: process.env.NODE_ENV === 'development',
      });
      throw new Error(errorMessage);
    }
  }

  fetchActiveSubscription(): ISubscriptionData {
    // Always return a subscription with all features enabled
    return {
      plan: {
        code: 'SELF_HOSTED',
        name: 'Self Hosted',
        fixedCost: 0,
        interval: 'lifetime',
        charges: [],
        charge: 0,
      },
      isActive: true,
      usage: {
        IMPORTED_ROWS: 0,
        ROWS: 0,
        TEAM_MEMBERS: 0,
      },
      expiryDate: new Date('2099-12-31').toISOString(),
      meta: {
        IMPORTED_ROWS: [],
        REMOVE_BRANDING: true,
        AUTOMATIC_IMPORTS: true,
        ADVANCED_VALIDATORS: true,
        FREEZE_COLUMNS: true,
        TEAM_MEMBERS: 999,
        ROWS: 999999999,
        MANUAL_ENTRY: true,
        DOWNLOAD_SAMPLE_FILE: true,
        MAX_RECORDS: true,
        REQUIRED_VALUES: true,
        DEFAULT_VALUES: true,
        RUNTIME_SCHEMA: true,
        DATA_SEEDING: true,
        IMAGE_IMPORT: true,
        UNIQUE_VALUES: true,
        DATE_FORMATS: true,
        BUBBLE_INTEGRATION: true,
        ALTERNATE_COLUMN_KEYS: true,
        MULTI_SELECT_VALUES: true,
        CUSTOM_CODE_VALIDATOR: true,
        LENGTH_VALIDATION: true,
        RANGE_VALIDATION: true,
        DIGITS_VALIDATION: true,
        MULTIPLE_COLUMNS_COMBINATION_UNIQUE_VALIDATION: true,
        WEBHOOK_RETRY_SETTINGS: true,
      },
    };
  }
}
