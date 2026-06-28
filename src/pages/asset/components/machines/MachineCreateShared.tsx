import { ReloadOutlined } from '@ant-design/icons';
import { Button, Select, Space, Tooltip, Typography } from 'antd';
import type { SelectProps } from 'antd';
import React from 'react';
import type { MachineCreateCatalogOption } from './machineCreateCatalog';

const { Text, Title, Paragraph } = Typography;

const toSelectValue = (value: string | number | boolean) =>
  typeof value === 'boolean' ? String(value) : value;

const noticePalette = {
  info: {
    border: '#dbeafe',
    background: '#f8fbff',
    text: '#1d4ed8',
  },
  warning: {
    border: '#fde68a',
    background: '#fffbeb',
    text: '#b45309',
  },
};

export const MachineCreateSection: React.FC<{
  title: string;
  description?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, description, extra, children }) => (
  <div
    style={{
      marginBottom: 16,
      padding: '16px 16px 4px',
      border: '1px solid #f0f0f0',
      borderRadius: 12,
      background: '#fff',
    }}
  >
    <Space
      align="start"
      style={{ width: '100%', justifyContent: 'space-between' }}
      wrap
    >
      <div>
        <Title level={5} style={{ marginBottom: 4 }}>
          {title}
        </Title>
        {description ? (
          <Paragraph type="secondary" style={{ marginBottom: 16 }}>
            {description}
          </Paragraph>
        ) : null}
      </div>
      {extra}
    </Space>
    {children}
  </div>
);

export const MachineCreateHint: React.FC<{
  message: React.ReactNode;
  tone?: 'info' | 'warning';
  style?: React.CSSProperties;
}> = ({ message, tone = 'info', style }) => {
  const palette = noticePalette[tone];
  return (
    <div
      style={{
        marginBottom: 12,
        padding: '8px 12px',
        border: `1px solid ${palette.border}`,
        borderRadius: 10,
        background: palette.background,
        color: palette.text,
        fontSize: 12,
        lineHeight: '18px',
        ...style,
      }}
    >
      {message}
    </div>
  );
};

export const MachineCreateSummaryStrip: React.FC<{
  items: Array<{
    label: string;
    value?: React.ReactNode;
  }>;
}> = ({ items }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: 12,
      marginBottom: 16,
    }}
  >
    {items.map((item) => (
      <div
        key={item.label}
        style={{
          padding: '10px 12px',
          border: '1px solid #f0f0f0',
          borderRadius: 12,
          background: '#fafafa',
          minHeight: 64,
        }}
      >
        <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
          {item.label}
        </Text>
        <Text strong ellipsis style={{ display: 'block', marginTop: 4 }}>
          {item.value || '-'}
        </Text>
      </div>
    ))}
  </div>
);

type MachineCreateCatalogSelectProps = Omit<SelectProps, 'options'> & {
  options?: MachineCreateCatalogOption[];
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  mode?: 'multiple';
  allowClear?: boolean;
  notFoundContent?: React.ReactNode;
};

export const MachineCreateCatalogSelect: React.FC<
  MachineCreateCatalogSelectProps
> = ({
  options = [],
  placeholder,
  loading = false,
  disabled = false,
  mode,
  allowClear = true,
  notFoundContent,
  ...selectProps
}) => (
  <Select
    {...selectProps}
    showSearch
    allowClear={allowClear}
    mode={mode}
    disabled={disabled}
    loading={loading}
    optionFilterProp="searchLabel"
    placeholder={placeholder}
    notFoundContent={notFoundContent}
    options={options.map((item) => ({
      label: item.selectable ? (
        item.label
      ) : (
        <Tooltip title={item.reason || '该选项当前不可用。'}>
          <Space size={6}>
            <span>{item.label}</span>
            <Text type="secondary">（不可用）</Text>
          </Space>
        </Tooltip>
      ),
      searchLabel: item.label,
      value: toSelectValue(item.value),
      disabled: !item.selectable,
    }))}
  />
);

export const MachineCreateCatalogStatus: React.FC<{
  available: boolean;
  loading: boolean;
  refreshing: boolean;
  errors: string[];
  staleMessages: string[];
  onRefresh: () => void;
}> = ({
  available,
  loading,
  refreshing,
  errors,
  staleMessages,
  onRefresh,
}) => {
  if (!available) {
    return (
      <MachineCreateHint message="先选择供应商账号，目录候选会按账号自动加载。" />
    );
  }

  return (
    <div
      style={{
        marginBottom: 12,
        padding: '10px 12px',
        border: '1px solid #f0f0f0',
        borderRadius: 12,
        background: '#fafafa',
      }}
    >
      <Space style={{ justifyContent: 'space-between', width: '100%' }} wrap>
        <Text strong>创建参数目录</Text>
        <Button
          size="small"
          icon={<ReloadOutlined />}
          loading={refreshing}
          onClick={onRefresh}
        >
          刷新目录
        </Button>
      </Space>
      {loading ? (
        <MachineCreateHint
          message="正在按当前条件拉取可用候选。"
          style={{ marginBottom: 0, marginTop: 10 }}
        />
      ) : null}
      {staleMessages.length ? (
        <MachineCreateHint
          tone="warning"
          message={staleMessages.join(' ')}
          style={{ marginBottom: 0, marginTop: 10 }}
        />
      ) : null}
      {errors.length ? (
        <MachineCreateHint
          tone="warning"
          message={errors.join(' ')}
          style={{ marginBottom: 0, marginTop: 10 }}
        />
      ) : null}
    </div>
  );
};
