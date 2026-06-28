import { Button, Flex, Form, Input, Select, Space, Tag, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import type { AssetResourceKey, SharedFilters } from '../types';
import { getStatusOptions } from '../utils';

const { Text } = Typography;

const CONTROL_WIDTH = {
  name: 220,
  provider: 200,
  account: 220,
  region: 160,
  status: 160,
  source: 160,
  tagKey: 180,
  tagValue: 180,
} as const;

const SOURCE_OPTIONS = [
  { label: '云上创建', value: 'provider' },
  { label: '云上导入', value: 'import' },
  { label: '手动录入', value: 'manual' },
];

const SharedFilterBar: React.FC<{
  activeResource: AssetResourceKey;
  filters: SharedFilters;
  providers: API.AssetProvider[];
  accounts: API.AssetProviderAccount[];
  onApply: (filters: SharedFilters) => void;
  onReset: () => void;
}> = ({ activeResource, filters, providers, accounts, onApply, onReset }) => {
  const [form] = Form.useForm<SharedFilters>();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const selectedProvider = Form.useWatch('provider_code', form);
  const showAccountFilter = activeResource !== 'accounts';
  const showNameFilter = activeResource === 'machines';
  const showRegionFilter =
    activeResource === 'machines' || activeResource === 'ips';
  const showSourceFilter = activeResource === 'machines';
  const useAdvancedFilters = activeResource === 'machines';
  const showTagFilters =
    activeResource === 'accounts' ||
    activeResource === 'machines' ||
    activeResource === 'ips' ||
    activeResource === 'ssh-keys';

  const filteredAccounts = useMemo(
    () =>
      accounts
        .filter(
          (item) =>
            !selectedProvider || item.provider_code === selectedProvider,
        )
        .map((item) => ({
          label: `${item.name} (#${item.id})`,
          value: item.id,
        })),
    [accounts, selectedProvider],
  );

  const advancedFilterCount = useMemo(
    () =>
      [filters.source, filters.tag_key, filters.tag_value].filter(Boolean).length,
    [filters.source, filters.tag_key, filters.tag_value],
  );

  useEffect(() => {
    form.setFieldsValue(filters);
  }, [filters, form]);

  useEffect(() => {
    const currentAccountId = form.getFieldValue('account_id');
    if (
      currentAccountId &&
      !filteredAccounts.some((item) => item.value === currentAccountId)
    ) {
      form.setFieldValue('account_id', undefined);
    }
  }, [filteredAccounts, form]);

  useEffect(() => {
    if (useAdvancedFilters) {
      setShowAdvanced(advancedFilterCount > 0);
    }
  }, [advancedFilterCount, useAdvancedFilters]);

  return (
    <Form<SharedFilters>
      form={form}
      onFinish={(values) =>
        onApply({
          provider_code: values.provider_code,
          account_id: values.account_id,
          region: values.region?.trim() || undefined,
          status: values.status,
          source: values.source,
          name: values.name?.trim() || undefined,
          tag_key: values.tag_key?.trim() || undefined,
          tag_value: values.tag_value?.trim() || undefined,
        })
      }
      style={{ width: '100%' }}
    >
      <Flex vertical gap={12}>
        <Flex gap={12} wrap="wrap" align="flex-end">
          {showNameFilter ? (
            <Form.Item name="name" label="机器名" style={{ marginBottom: 0 }}>
              <Input
                placeholder="按机器名搜索"
                style={{ width: CONTROL_WIDTH.name }}
              />
            </Form.Item>
          ) : null}
          <Form.Item name="provider_code" label="供应商" style={{ marginBottom: 0 }}>
            <Select
              allowClear
              showSearch
              style={{ width: CONTROL_WIDTH.provider }}
              optionFilterProp="label"
              placeholder="全部供应商"
              options={providers.map((item) => ({
                label: `${item.name} (${item.code})`,
                value: item.code,
              }))}
            />
          </Form.Item>
          {showAccountFilter ? (
            <Form.Item name="account_id" label="账号" style={{ marginBottom: 0 }}>
              <Select
                allowClear
                showSearch
                style={{ width: CONTROL_WIDTH.account }}
                optionFilterProp="label"
                placeholder="全部账号"
                options={filteredAccounts}
              />
            </Form.Item>
          ) : null}
          {showRegionFilter ? (
            <Form.Item name="region" label="地域" style={{ marginBottom: 0 }}>
              <Input
                placeholder="地域"
                style={{ width: CONTROL_WIDTH.region }}
              />
            </Form.Item>
          ) : null}
          <Form.Item name="status" label="状态" style={{ marginBottom: 0 }}>
            <Select
              allowClear
              style={{ width: CONTROL_WIDTH.status }}
              options={getStatusOptions(activeResource)}
              placeholder="全部状态"
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space wrap>
              <Button type="primary" htmlType="submit">
                应用
              </Button>
              <Button
                onClick={() => {
                  form.resetFields();
                  onReset();
                }}
              >
                重置
              </Button>
              {useAdvancedFilters ? (
                <Button type="link" onClick={() => setShowAdvanced((value) => !value)}>
                  {showAdvanced ? '收起高级筛选' : '高级筛选'}
                </Button>
              ) : null}
            </Space>
          </Form.Item>
        </Flex>
        {useAdvancedFilters && showAdvanced ? (
          <Flex gap={12} wrap="wrap" align="flex-end">
            {showSourceFilter ? (
              <Form.Item name="source" label="来源" style={{ marginBottom: 0 }}>
                <Select
                  allowClear
                  style={{ width: CONTROL_WIDTH.source }}
                  placeholder="全部来源"
                  options={SOURCE_OPTIONS}
                />
              </Form.Item>
            ) : null}
            {showTagFilters ? (
              <Form.Item name="tag_key" label="标签 Key" style={{ marginBottom: 0 }}>
                <Input placeholder="标签 Key" style={{ width: CONTROL_WIDTH.tagKey }} />
              </Form.Item>
            ) : null}
            {showTagFilters ? (
              <Form.Item name="tag_value" label="标签 Value" style={{ marginBottom: 0 }}>
                <Input
                  placeholder="标签 Value"
                  style={{ width: CONTROL_WIDTH.tagValue }}
                />
              </Form.Item>
            ) : null}
            <Text type="secondary">
              高级筛选用于补充来源和标签条件。
              {advancedFilterCount > 0 ? (
                <Tag color="blue" style={{ marginInlineStart: 8, marginInlineEnd: 0 }}>
                  {`已启用 ${advancedFilterCount} 项`}
                </Tag>
              ) : null}
            </Text>
          </Flex>
        ) : null}
        {!useAdvancedFilters && showTagFilters ? (
          <Flex gap={12} wrap="wrap" align="flex-end">
            <Form.Item name="tag_key" label="标签 Key" style={{ marginBottom: 0 }}>
              <Input placeholder="标签 Key" style={{ width: CONTROL_WIDTH.tagKey }} />
            </Form.Item>
            <Form.Item name="tag_value" label="标签 Value" style={{ marginBottom: 0 }}>
              <Input
                placeholder="标签 Value"
                style={{ width: CONTROL_WIDTH.tagValue }}
              />
            </Form.Item>
          </Flex>
        ) : null}
      </Flex>
    </Form>
  );
};

export default SharedFilterBar;
