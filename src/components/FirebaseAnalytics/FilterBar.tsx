import React, { useEffect, useState } from 'react';
import { AutoComplete, Button, Card, Col, Row, Segmented, Space } from 'antd';
import {
  ProForm,
  ProFormDateRangePicker,
  ProFormText,
} from '@ant-design/pro-components';
import dayjs from 'dayjs';
import { getFilterOptions } from '@/services/firebase-analytics/api';
import type {
  FilterOptionsResponse,
  FirebaseAnalyticsFilterFormValues,
} from '@/services/firebase-analytics/types';
import { getDefaultFirebaseTimeRange } from '@/utils/firebase-analytics-filters';

export type FirebaseFilterField =
  | 'timeRange'
  | 'time_field'
  | 'app_id'
  | 'platform'
  | 'app_version'
  | 'user_country'
  | 'user_region'
  | 'network_type'
  | 'isp'
  | 'asn'
  | 'node_id'
  | 'node_name'
  | 'node_country'
  | 'node_region'
  | 'protocol';

export interface FilterBarProps {
  onFilterChange: (values: FirebaseAnalyticsFilterFormValues) => void;
  initialValues?: FirebaseAnalyticsFilterFormValues;
  onOptionsLoaded?: (options: FilterOptionsResponse) => void;
  fields?: FirebaseFilterField[];
}

const DEFAULT_FIELDS: FirebaseFilterField[] = [
  'timeRange',
  'time_field',
  'app_id',
  'platform',
  'app_version',
  'user_country',
  'network_type',
  'isp',
];

const FilterBar: React.FC<FilterBarProps> = ({
  onFilterChange,
  initialValues,
  onOptionsLoaded,
  fields = DEFAULT_FIELDS,
}) => {
  const [options, setOptions] = useState<Partial<FilterOptionsResponse>>({});
  const [form] = ProForm.useForm<FirebaseAnalyticsFilterFormValues>();

  const renderEditableSelect = (
    name: keyof FirebaseAnalyticsFilterFormValues,
    label: string,
    optionList: FilterOptionsResponse[keyof FilterOptionsResponse] | undefined,
    placeholder: string,
  ) => (
    <ProForm.Item name={name} label={label} style={{ marginBottom: 0 }}>
      <AutoComplete
        allowClear
        options={optionList || []}
        placeholder={placeholder}
        filterOption={(inputValue, option) =>
          `${option?.label ?? option?.value ?? ''}`.toLowerCase().includes(inputValue.toLowerCase())
        }
      />
    </ProForm.Item>
  );

  useEffect(() => {
    getFilterOptions().then((res) => {
      if (res.data) {
        setOptions(res.data);
        onOptionsLoaded?.(res.data);
      }
    });
  }, [onOptionsLoaded]);

  useEffect(() => {
    form.setFieldsValue({
      timeRange: getDefaultFirebaseTimeRange(),
      time_field: 'received_at',
      ...initialValues,
    });
  }, [form, initialValues]);

  const setQuickTime = (type: string) => {
    let range: [dayjs.Dayjs, dayjs.Dayjs] = getDefaultFirebaseTimeRange();
    const now = dayjs();

    switch (type) {
      case 'today':
        range = [now.startOf('day'), now.endOf('day')];
        break;
      case 'yesterday':
        range = [now.subtract(1, 'day').startOf('day'), now.subtract(1, 'day').endOf('day')];
        break;
      case 'last1h':
        range = [now.subtract(1, 'hour'), now];
        break;
      case 'last6h':
        range = [now.subtract(6, 'hour'), now];
        break;
      case 'last24h':
        range = [now.subtract(24, 'hour'), now];
        break;
      case 'last7d':
        range = [now.subtract(7, 'day'), now];
        break;
      default:
        break;
    }

    form.setFieldValue('timeRange', range);
  };

  const hasField = (field: FirebaseFilterField) => fields.includes(field);

  return (
    <Card
      variant="borderless"
      style={{
        marginBottom: 16,
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
      }}
      styles={{ body: { padding: '16px 20px' } }}
    >
      <ProForm<FirebaseAnalyticsFilterFormValues>
        form={form}
        layout="inline"
        submitter={false}
        initialValues={{
          timeRange: getDefaultFirebaseTimeRange(),
          time_field: 'received_at',
          ...initialValues,
        }}
        onFinish={async (values) => {
          onFilterChange(values);
        }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {hasField('timeRange') || hasField('time_field') ? (
            <Row gutter={[16, 16]} align="middle">
              {hasField('timeRange') ? (
                <>
                  <Col>
                    <ProFormDateRangePicker
                      name="timeRange"
                      label="时间范围"
                      fieldProps={{
                        showTime: true,
                        format: 'YYYY-MM-DD HH:mm:ss',
                      }}
                    />
                  </Col>
                  <Col>
                    <Space size={4}>
                      <Button size="small" onClick={() => setQuickTime('last1h')}>
                        1h
                      </Button>
                      <Button size="small" onClick={() => setQuickTime('last6h')}>
                        6h
                      </Button>
                      <Button size="small" onClick={() => setQuickTime('last24h')}>
                        24h
                      </Button>
                      <Button size="small" onClick={() => setQuickTime('today')}>
                        今天
                      </Button>
                      <Button size="small" onClick={() => setQuickTime('yesterday')}>
                        昨天
                      </Button>
                      <Button size="small" onClick={() => setQuickTime('last7d')}>
                        7d
                      </Button>
                    </Space>
                  </Col>
                </>
              ) : null}
              {hasField('time_field') ? (
                <Col>
                  <ProForm.Item name="time_field" label="时间字段" style={{ marginBottom: 0 }}>
                    <Segmented
                      options={[
                        { label: '接收时间', value: 'received_at' },
                        { label: '事件时间', value: 'event_time' },
                      ]}
                    />
                  </ProForm.Item>
                </Col>
              ) : null}
            </Row>
          ) : null}

          <Row gutter={[16, 16]}>
            {hasField('app_id') ? (
              <Col xl={4} md={8} span={24}>
                {renderEditableSelect('app_id', 'App', options.apps, '全部 App')}
              </Col>
            ) : null}
            {hasField('platform') ? (
              <Col xl={4} md={8} span={24}>
                {renderEditableSelect('platform', '平台', options.platforms, '全部平台')}
              </Col>
            ) : null}
            {hasField('app_version') ? (
              <Col xl={4} md={8} span={24}>
                {renderEditableSelect('app_version', '版本', options.versions, '全部版本')}
              </Col>
            ) : null}
            {hasField('user_country') ? (
              <Col xl={4} md={8} span={24}>
                {renderEditableSelect('user_country', '用户国家', options.countries, '全部国家')}
              </Col>
            ) : null}
            {hasField('user_region') ? (
              <Col xl={4} md={8} span={24}>
                <ProFormText name="user_region" label="用户区域" placeholder="输入用户区域" />
              </Col>
            ) : null}
            {hasField('network_type') ? (
              <Col xl={4} md={8} span={24}>
                {renderEditableSelect('network_type', '网络类型', options.network_types, '全部网络')}
              </Col>
            ) : null}
            {hasField('isp') ? (
              <Col xl={4} md={8} span={24}>
                {renderEditableSelect('isp', 'ISP', options.isps, '全部 ISP')}
              </Col>
            ) : null}
            {hasField('asn') ? (
              <Col xl={4} md={8} span={24}>
                {renderEditableSelect('asn', 'ASN', options.asns, '全部 ASN')}
              </Col>
            ) : null}
            {hasField('node_id') ? (
              <Col xl={4} md={8} span={24}>
                <ProFormText name="node_id" label="节点 ID" placeholder="输入节点 ID" />
              </Col>
            ) : null}
            {hasField('node_name') ? (
              <Col xl={4} md={8} span={24}>
                <ProFormText name="node_name" label="节点名称" placeholder="输入节点名称" />
              </Col>
            ) : null}
            {hasField('node_country') ? (
              <Col xl={4} md={8} span={24}>
                {renderEditableSelect('node_country', '节点国家', options.node_countries, '全部节点国家')}
              </Col>
            ) : null}
            {hasField('node_region') ? (
              <Col xl={4} md={8} span={24}>
                {renderEditableSelect('node_region', '节点区域', options.node_regions, '全部节点区域')}
              </Col>
            ) : null}
            {hasField('protocol') ? (
              <Col xl={4} md={8} span={24}>
                {renderEditableSelect('protocol', '协议', options.protocols, '全部协议')}
              </Col>
            ) : null}
          </Row>

          <Row justify="end">
            <Col>
              <Button type="primary" htmlType="submit">
                查询
              </Button>
            </Col>
          </Row>
        </Space>
      </ProForm>
    </Card>
  );
};

export default FilterBar;
