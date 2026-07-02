import { Select, Switch, Tag } from 'antd';
import React, { useMemo, useState } from 'react';

export type IncludeExcludeValue = {
  include?: string[];
  exclude?: string[];
};

type IncludeExcludeSelectOption = {
  label: React.ReactNode;
  value: string;
};

type IncludeExcludeTagRenderProps = {
  label: React.ReactNode;
  value: string;
  closable: boolean;
  onClose: (event?: React.MouseEvent<HTMLElement>) => void;
};

type InternalOption = IncludeExcludeSelectOption & {
  selectedMode?: 'include' | 'exclude';
};

type IncludeExcludeSelectProps = {
  mode?: 'multiple' | 'tags';
  value?: IncludeExcludeValue;
  onChange?: (value: IncludeExcludeValue) => void;
  options?: IncludeExcludeSelectOption[];
  normalizeValue?: (value: string) => string;
  placeholder?: string;
  style?: React.CSSProperties;
  maxTagCount?: 'responsive' | number;
  allowClear?: boolean;
  showSearch?: boolean;
  filterOption?: boolean;
  onSearch?: (value: string) => void;
  tokenSeparators?: string[];
};

const normalizeValues = (values: string[] | undefined, normalizeValue: (value: string) => string) => {
  if (!Array.isArray(values) || !values.length) {
    return [];
  }

  const normalized = values.map((item) => normalizeValue(item)).filter(Boolean);
  return Array.from(new Set(normalized));
};

const compactIncludeExcludeValue = (value: IncludeExcludeValue): IncludeExcludeValue => ({
  include: value.include?.length ? value.include : undefined,
  exclude: value.exclude?.length ? value.exclude : undefined,
});

const IncludeExcludeSelect: React.FC<IncludeExcludeSelectProps> = ({
  mode = 'multiple',
  value,
  onChange,
  options,
  normalizeValue = (item) => item.trim(),
  placeholder,
  style,
  maxTagCount = 'responsive',
  allowClear = true,
  showSearch,
  filterOption,
  onSearch,
  tokenSeparators,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const includeValues = useMemo(
    () => normalizeValues(value?.include, normalizeValue),
    [normalizeValue, value?.include],
  );
  const excludeValues = useMemo(
    () => normalizeValues(value?.exclude, normalizeValue),
    [normalizeValue, value?.exclude],
  );
  const mergedValues = useMemo(
    () => Array.from(new Set([...includeValues, ...excludeValues])),
    [excludeValues, includeValues],
  );
  const includeSet = useMemo(() => new Set(includeValues), [includeValues]);
  const excludeSet = useMemo(() => new Set(excludeValues), [excludeValues]);

  const displayOptions = useMemo<InternalOption[]>(
    () =>
      (options || []).map((option) => {
        const normalizedValue = normalizeValue(option.value);
        const selectedMode = excludeSet.has(normalizedValue)
          ? 'exclude'
          : includeSet.has(normalizedValue)
            ? 'include'
            : undefined;

        return {
          ...option,
          selectedMode,
        };
      }),
    [excludeSet, includeSet, normalizeValue, options],
  );

  const emitChange = (nextValue: IncludeExcludeValue) => {
    onChange?.(compactIncludeExcludeValue(nextValue));
  };

  const applyNextMode = (targetValue: string, targetMode: 'include' | 'exclude') => {
    const normalizedTargetValue = normalizeValue(targetValue);
    if (!normalizedTargetValue) {
      return;
    }

    const nextInclude = mergedValues.filter(
      (item) => item !== normalizedTargetValue && includeSet.has(item),
    );
    const nextExclude = mergedValues.filter(
      (item) => item !== normalizedTargetValue && excludeSet.has(item),
    );

    if (targetMode === 'exclude') {
      nextExclude.push(normalizedTargetValue);
    } else {
      nextInclude.push(normalizedTargetValue);
    }

    emitChange({
      include: Array.from(new Set(nextInclude)),
      exclude: Array.from(new Set(nextExclude)),
    });
  };

  const handleSelectChange = (nextValues: string[]) => {
    const normalizedNextValues = Array.from(
      new Set(nextValues.map((item) => normalizeValue(`${item}`)).filter(Boolean)),
    );
    setSearchValue('');

    if (!normalizedNextValues.length) {
      emitChange({});
      return;
    }

    const nextInclude = normalizedNextValues.filter((item) => !excludeSet.has(item));
    const nextExclude = normalizedNextValues.filter((item) => excludeSet.has(item));

    emitChange({
      include: nextInclude,
      exclude: nextExclude,
    });
  };

  const tagRender = ({ label, value: tagValue, closable, onClose }: IncludeExcludeTagRenderProps) => {
    const excluded = excludeSet.has(normalizeValue(`${tagValue}`));

    return (
      <Tag
        bordered={false}
        color={excluded ? 'error' : undefined}
        style={{
          marginInlineEnd: 4,
          background: excluded ? '#fff1f0' : '#f5f5f5',
          color: excluded ? '#ff4d4f' : 'rgba(0, 0, 0, 0.88)',
        }}
        closable={closable}
        onClose={(event) => {
          event?.preventDefault();
          onClose(event);
        }}
      >
        <span
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          {label}
        </span>
      </Tag>
    );
  };

  return (
    <Select
      mode={mode}
      value={mergedValues}
      options={displayOptions}
      menuItemSelectedIcon={null}
      defaultActiveFirstOption={false}
      allowClear={allowClear}
      showSearch={showSearch}
      searchValue={showSearch ? searchValue : undefined}
      filterOption={filterOption}
      onSearch={(nextValue) => {
        setSearchValue(nextValue);
        onSearch?.(nextValue);
      }}
      tokenSeparators={tokenSeparators}
      placeholder={placeholder}
      style={style}
      maxTagCount={maxTagCount}
      optionRender={(option) => {
        const rawData = option.data as InternalOption;
        const activeInclude = rawData.selectedMode === 'include';
        const activeExclude = rawData.selectedMode === 'exclude';

        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              width: '100%',
            }}
          >
            <span style={{ flex: 1, minWidth: 0 }}>{rawData.label}</span>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              <Switch
                size="small"
                checked={activeExclude}
                checkedChildren="排除"
                unCheckedChildren="包含"
                style={{
                  backgroundColor: activeExclude ? '#ff4d4f' : '#1677ff',
                }}
                onClick={(checked, event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  applyNextMode(rawData.value, checked ? 'exclude' : 'include');
                }}
                aria-label={`${activeExclude ? '排除' : '包含'} ${rawData.value}`}
              />
            </div>
          </div>
        );
      }}
      tagRender={(props) => tagRender(props as IncludeExcludeTagRenderProps)}
      onChange={(nextValues) => handleSelectChange((nextValues as string[]) || [])}
    />
  );
};

export default IncludeExcludeSelect;
