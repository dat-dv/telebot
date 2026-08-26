'use client';

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { localeTag } from '@telebot/contracts';
import { useLocale } from './locale-provider';

export interface MoneyVisibilityContextValue {
  isMoneyVisible: boolean;
  toggleMoneyVisibility: () => void;
  setMoneyVisibility: (visible: boolean) => void;
  money: (value: number) => string;
}

const MoneyVisibilityContext = createContext<MoneyVisibilityContextValue | null>(null);

export function MoneyVisibilityProvider({ children }: { children: ReactNode }) {
  const [isMoneyVisible, setIsMoneyVisible] = useState(true);
  const { locale, t } = useLocale();

  const toggleMoneyVisibility = useCallback(() => {
    setIsMoneyVisible((prev) => !prev);
  }, []);

  const setMoneyVisibility = useCallback((visible: boolean) => {
    setIsMoneyVisible(visible);
  }, []);

  const money = useCallback(
    (value: number) => {
      if (!isMoneyVisible) {
        return t('common.maskedAmount');
      }
      return new Intl.NumberFormat(localeTag(locale), {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(value);
    },
    [isMoneyVisible, locale, t],
  );

  const value = useMemo(
    () => ({
      isMoneyVisible,
      toggleMoneyVisibility,
      setMoneyVisibility,
      money,
    }),
    [isMoneyVisible, toggleMoneyVisibility, setMoneyVisibility, money],
  );

  return (
    <MoneyVisibilityContext.Provider value={value}>{children}</MoneyVisibilityContext.Provider>
  );
}

export function useMoneyVisibility() {
  const context = useContext(MoneyVisibilityContext);
  if (!context) {
    throw new Error('useMoneyVisibility must be used within MoneyVisibilityProvider');
  }
  return context;
}

export function useMoneyFormatter() {
  const { money } = useMoneyVisibility();
  return money;
}
