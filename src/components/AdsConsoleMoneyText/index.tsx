import React from 'react';

interface MoneyTextProps {
  value?: number;
  currency?: string;
  decimal?: number;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  THB: '฿',
  KRW: '₩',
  INR: '₹',
  RUB: '₽',
  BRL: 'R$',
  IDR: 'Rp',
  VND: '₫',
  PHP: '₱',
  MYR: 'RM',
  SGD: 'S$',
  HKD: 'HK$',
  TWD: 'NT$',
  CAD: 'CA$',
  AUD: 'A$',
  NZD: 'NZ$',
  MXN: 'MX$',
  CHF: 'Fr',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  ZAR: 'R',
  TRY: '₺',
  AED: 'AED',
  SAR: 'SR',
  COP: 'COP$',
  CLP: 'CLP$',
  PKR: '₨',
  NGN: '₦',
  EGP: 'E£',
};

const MoneyText: React.FC<MoneyTextProps> = ({
                                               value = 0,
                                               currency = 'USD',
                                               decimal = 2,
                                             }) => {
  const code = (currency || 'USD').toUpperCase();
  const symbol = CURRENCY_SYMBOLS[code];
  const formatted = (value ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: decimal,
    maximumFractionDigits: decimal,
  });

  if (symbol) {
    return <span>{symbol}{formatted}</span>;
  }

  try {
    const intlFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: decimal,
      maximumFractionDigits: decimal,
    }).format(value);
    return <span>{intlFormatted}</span>;
  } catch {
    return <span>{code} {formatted}</span>;
  }
};

export default MoneyText;
