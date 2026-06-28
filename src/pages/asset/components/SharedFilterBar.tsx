import { Button, Flex, Form, Input, Select, Space } from 'antd';
import React, { useEffect, useMemo } from 'react';
import type { AssetResourceKey, SharedFilters } from '../types';
import { getStatusOptions } from '../utils';

const CONTROL_WIDTH = {
  provider: 220,
  account: 260,
  region: 180,
  status: 180,
  tagKey: 180,
  tagValue: 180,
} as const;

const SharedFilterBar: React.FC<{
  activeResource: AssetResourceKey;
  filters: SharedFilters;
  providers: API.AssetProvider[];
  accounts: API.AssetProviderAccount[];
  onApply: (filters: SharedFilters) => void;
  onReset: () => void;
}> = ({ activeResource, filters, providers, accounts, onApply, onReset }) => {
  const [form] = Form.useForm<SharedFilters>();
  const selectedProvider = Form.useWatch('provider_code', form);
  const showAccountFilter = activeResource !== 'accounts';
  const showRegionFilter =
    activeResource === 'machines' || activeResource === 'ips';
  const showTagFilters =
    activeResource === 'accounts' ||
    activeResource === 'machines' ||
    activeResource === 'ips' ||
    activeResource === 'ssh-keys';

  useEffect(() => {
    form.setFieldsValue(filters);
  }, [filters, form]);

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

  return (
    <Form<SharedFilters>
      form={form}
      onFinish={(values) =>
        onApply({
          provider_code: values.provider_code,
          account_id: values.account_id,
          region: values.region?.trim() || undefined,
          status: values.status,
          tag_key: values.tag_key?.trim() || undefined,
          tag_value: values.tag_value?.trim() || undefined,
        })
      }
      style={{ width: '100%' }}
    >
      <Flex gap={12} wrap="wrap" align="flex-end">
        <Form.Item name="provider_code" label="Provider" style={{ marginBottom: 0 }}>
          <Select
            allowClear
            showSearch
            style={{ width: CONTROL_WIDTH.provider }}
            optionFilterProp="label"
            options={providers.map((item) => ({
              label: `${item.name} (${item.code})`,
              value: item.code,
            }))}
          />
        </Form.Item>
        {showAccountFilter ? (
          <Form.Item name="account_id" label="Account" style={{ marginBottom: 0 }}>
            <Select
              allowClear
              showSearch
              style={{ width: CONTROL_WIDTH.account }}
              optionFilterProp="label"
              options={filteredAccounts}
            />
          </Form.Item>
        ) : null}
        {showRegionFilter ? (
          <Form.Item name="region" label="Region" style={{ marginBottom: 0 }}>
            <Input placeholder="Region" style={{ width: CONTROL_WIDTH.region }} />
          </Form.Item>
        ) : null}
        <Form.Item name="status" label="Status" style={{ marginBottom: 0 }}>
          <Select
            allowClear
            style={{ width: CONTROL_WIDTH.status }}
            options={getStatusOptions(activeResource)}
            placeholder="All statuses"
          />
        </Form.Item>
        {showTagFilters ? (
          <Form.Item name="tag_key" label="Tag Key" style={{ marginBottom: 0 }}>
            <Input placeholder="Tag key" style={{ width: CONTROL_WIDTH.tagKey }} />
          </Form.Item>
        ) : null}
        {showTagFilters ? (
          <Form.Item name="tag_value" label="Tag Value" style={{ marginBottom: 0 }}>
            <Input
              placeholder="Tag value"
              style={{ width: CONTROL_WIDTH.tagValue }}
            />
          </Form.Item>
        ) : null}
        <Form.Item style={{ marginBottom: 0 }}>
          <Space>
            <Button type="primary" htmlType="submit">
              Apply
            </Button>
            <Button
              onClick={() => {
                form.resetFields();
                onReset();
              }}
            >
              Reset
            </Button>
          </Space>
        </Form.Item>
      </Flex>
    </Form>
  );
};

export default SharedFilterBar;
