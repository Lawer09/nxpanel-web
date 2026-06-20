import { Button, Form, Input, Select, Space } from 'antd';
import React, { useEffect, useMemo } from 'react';
import type { AssetResourceKey, SharedFilters } from '../types';
import { getStatusOptions } from '../utils';

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
      layout="inline"
      onFinish={(values) =>
        onApply({
          provider_code: values.provider_code,
          account_id: values.account_id,
          region: values.region?.trim() || undefined,
          status: values.status,
        })
      }
      style={{ rowGap: 12 }}
    >
      <Form.Item name="provider_code" label="Provider">
        <Select
          allowClear
          showSearch
          style={{ width: 180 }}
          optionFilterProp="label"
          options={providers.map((item) => ({
            label: `${item.name} (${item.code})`,
            value: item.code,
          }))}
        />
      </Form.Item>
      {showAccountFilter ? (
        <Form.Item name="account_id" label="Account">
          <Select
            allowClear
            showSearch
            style={{ width: 240 }}
            optionFilterProp="label"
            options={filteredAccounts}
          />
        </Form.Item>
      ) : null}
      {showRegionFilter ? (
        <Form.Item name="region" label="Region">
          <Input placeholder="Region" style={{ width: 180 }} />
        </Form.Item>
      ) : null}
      <Form.Item name="status" label="Status">
        <Select
          allowClear
          style={{ width: 180 }}
          options={getStatusOptions(activeResource)}
          placeholder="All statuses"
        />
      </Form.Item>
      <Form.Item>
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
    </Form>
  );
};

export default SharedFilterBar;
