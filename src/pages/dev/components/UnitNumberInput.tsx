import { InputNumber, Select, Space } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';

export type UnitNumberOption = {
  label: string;
  value: string;
  multiplier: number;
};

const chooseUnit = (value: number | undefined, units: UnitNumberOption[]) => {
  if (!value || value <= 0) {
    return units[0];
  }
  for (let index = units.length - 1; index >= 0; index -= 1) {
    const unit = units[index];
    if (value >= unit.multiplier && value % unit.multiplier === 0) {
      return unit;
    }
  }
  return units[0];
};

const roundDisplayValue = (value: number) => {
  const rounded = Number(value.toFixed(4));
  return Number.isInteger(rounded) ? rounded : rounded;
};

export const speedLimitUnits: UnitNumberOption[] = [
  { label: 'B/s', value: 'B/s', multiplier: 1 },
  { label: 'KiB/s', value: 'KiB/s', multiplier: 1024 },
  { label: 'MiB/s', value: 'MiB/s', multiplier: 1024 ** 2 },
  { label: 'GiB/s', value: 'GiB/s', multiplier: 1024 ** 3 },
  { label: 'Mbps', value: 'Mbps', multiplier: 125000 },
];

export const trafficThresholdUnits: UnitNumberOption[] = [
  { label: 'KiB', value: 'KiB', multiplier: 1 },
  { label: 'MiB', value: 'MiB', multiplier: 1024 },
  { label: 'GiB', value: 'GiB', multiplier: 1024 ** 2 },
];

export const formatUnitNumber = (
  value: number | undefined | null,
  units: UnitNumberOption[],
  emptyText = '-',
) => {
  if (value === undefined || value === null) {
    return emptyText;
  }
  if (value === 0) {
    return `0 ${units[0].label}`;
  }
  const unit = chooseUnit(value, units);
  return `${roundDisplayValue(value / unit.multiplier)} ${unit.label}`;
};

const UnitNumberInput: React.FC<{
  value?: number;
  onChange?: (value?: number) => void;
  units: UnitNumberOption[];
  min?: number;
  disabled?: boolean;
  style?: React.CSSProperties;
}> = ({ value, onChange, units, min = 0, disabled, style }) => {
  const preferredUnit = useMemo(() => chooseUnit(value, units), [units, value]);
  const [unitValue, setUnitValue] = useState(preferredUnit.value);

  useEffect(() => {
    setUnitValue(preferredUnit.value);
  }, [preferredUnit.value]);

  const currentUnit = units.find((item) => item.value === unitValue) ?? units[0];
  const displayValue =
    value === undefined || value === null
      ? undefined
      : roundDisplayValue(Number(value) / currentUnit.multiplier);

  return (
    <Space.Compact style={{ width: '100%', ...style }}>
      <InputNumber
        style={{ width: '100%' }}
        min={min}
        disabled={disabled}
        value={displayValue}
        onChange={(nextValue) => {
          if (nextValue === undefined || nextValue === null) {
            onChange?.(undefined);
            return;
          }
          onChange?.(Math.round(Number(nextValue) * currentUnit.multiplier));
        }}
      />
      <Select
        style={{ width: 96 }}
        disabled={disabled}
        value={unitValue}
        options={units.map((item) => ({ label: item.label, value: item.value }))}
        onChange={(nextUnitValue) => setUnitValue(nextUnitValue)}
      />
    </Space.Compact>
  );
};

export default UnitNumberInput;
