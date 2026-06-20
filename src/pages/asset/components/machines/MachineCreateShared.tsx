import { ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Select, Space, Tooltip, Typography } from 'antd';
import React from 'react';
import type { MachineCreateCatalogOption } from './machineCreateCatalog';

const { Text, Title, Paragraph } = Typography;

export const MachineCreateSection: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => (
  <div style={{ marginBottom: 24 }}>
    <Title level={5} style={{ marginBottom: 4 }}>
      {title}
    </Title>
    {description ? (
      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
        {description}
      </Paragraph>
    ) : null}
    {children}
  </div>
);

export const MachineCreateCatalogSelect: React.FC<{
  options?: MachineCreateCatalogOption[];
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  mode?: 'multiple';
  allowClear?: boolean;
  notFoundContent?: React.ReactNode;
}> = ({
  options = [],
  placeholder,
  loading = false,
  disabled = false,
  mode,
  allowClear = true,
  notFoundContent,
}) => (
  <Select
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
        <Tooltip title={item.reason || 'This option is not selectable.'}>
          <Space size={6}>
            <span>{item.label}</span>
            <Text type="secondary">(Unavailable)</Text>
          </Space>
        </Tooltip>
      ),
      searchLabel: item.label,
      value: item.value,
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
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Select a provider account first"
        description="Catalog candidates are loaded after an account is selected."
      />
    );
  }

  return (
    <Space direction="vertical" size={12} style={{ width: '100%', marginBottom: 16 }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }} wrap>
        <Text strong>Create Catalog</Text>
        <Button
          size="small"
          icon={<ReloadOutlined />}
          loading={refreshing}
          onClick={onRefresh}
        >
          Refresh Catalog
        </Button>
      </Space>
      {loading ? (
        <Alert
          type="info"
          showIcon
          message="Loading candidate parameters"
          description="The wizard is pulling provider-neutral create options for the current selection."
        />
      ) : null}
      {staleMessages.length ? (
        <Alert
          type="warning"
          showIcon
          message="Catalog cache fallback in use"
          description={staleMessages.join(' ')}
        />
      ) : null}
      {errors.length ? (
        <Alert
          type="warning"
          showIcon
          message="Some candidate parameters failed to load"
          description={errors.join(' ')}
        />
      ) : null}
    </Space>
  );
};
