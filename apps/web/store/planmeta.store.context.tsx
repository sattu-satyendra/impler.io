import { createContext, useState, ReactNode, useContext } from 'react';
import { IPlanMeta, IPlanMetaContext } from 'types/store.types';

const PlanMetaContext = createContext<IPlanMetaContext | undefined>(undefined);

interface PlanMetaProviderProps {
  children: ReactNode;
}

// Default plan meta with all features enabled
const DEFAULT_PLAN_META: IPlanMeta = {
  IMAGE_IMPORT: true,
  IMPORTED_ROWS: [], // Not used in self-hosted mode
  ADVANCED_VALIDATORS: true,
  FREEZE_COLUMNS: true,
  TEAM_MEMBERS: 999,
  ROWS: 999999999,
  REMOVE_BRANDING: true,
  REQUIRED_VALUES: true,
  UNIQUE_VALUES: true,
  DEFAULT_VALUES: true,
  DATE_FORMATS: true,
  BUBBLE_INTEGRATION: true,
  WEBHOOK_RETRY_SETTINGS: true,
  MULTI_SELECT_VALUES: true,
  CUSTOM_CODE_VALIDATOR: true,
  LENGTH_VALIDATION: true,
  RANGE_VALIDATION: true,
  DIGITS_VALIDATION: true,
  MULTIPLE_COLUMNS_COMBINATION_UNIQUE_VALIDATION: true,
};

export const PlanMetaProvider = ({ children }: PlanMetaProviderProps) => {
  const [meta, setMeta] = useState<IPlanMeta | null>(DEFAULT_PLAN_META);

  const setPlanMeta = (newMeta: IPlanMeta) => {
    setMeta(newMeta);
  };

  return <PlanMetaContext.Provider value={{ meta, setPlanMeta }}>{children}</PlanMetaContext.Provider>;
};

export const usePlanMetaData = () => {
  const context = useContext(PlanMetaContext);

  if (!context) {
    throw new Error('usePlanMetaData must be used within a PlanMetaProvider');
  }

  return context;
};

export { PlanMetaContext };
