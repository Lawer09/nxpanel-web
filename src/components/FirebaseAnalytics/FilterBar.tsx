import React, { useEffect, useState } from 'react';
import { Card, Space, Button, Segmented, Row, Col } from 'antd';
import { ProForm, ProFormSelect, ProFormDateRangePicker } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import { getFilterOptions } from '@/services/firebase-analytics/api';

export interface FilterBarProps {
  onFilterChange: (values: any) => void;
  initialValues?: any;
}

const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange, initialValues }) => {
  const [options, setOptions] = useState<any>({});
  const [form] = ProForm.useForm();

  useEffect(() => {
    getFilterOptions().then((res) => {
      if (res.data) {
        setOptions(res.data);
      }
    });
  }, []);

  const handleValuesChange = (changedValues: any, allValues: any) => {
    // If it's a quick time button change, it might be handled differently, but ProForm handles it if we use form.setFieldsValue
    onFilterChange(allValues);
  };

  const setQuickTime = (type: string) => {
    let range: [dayjs.Dayjs, dayjs.Dayjs] = [dayjs().startOf('day'), dayjs().endOf('day')];
    switch (type) {
      case 'today':
        range = [dayjs().startOf('day'), dayjs().endOf('day')];
        break;
      case 'yesterday':
        range = [dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')];
        break;
      case 'last1h':
        range = [dayjs().subtract(1, 'hour'), dayjs()];
        break;
      case 'last6h':
        range = [dayjs().subtract(6, 'hour'), dayjs()];
        break;
      case 'last24h':
        range = [dayjs().subtract(24, 'hour'), dayjs()];
        break;
      case 'last7d':
        range = [dayjs().subtract(7, 'day'), dayjs()];
        break;
      default:
        break;
    }
    form.setFieldsValue({ timeRange: range });
    onFilterChange(form.getFieldsValue());
  };

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
      <ProForm
        form={form}
        layout="inline"
        submitter={false}
        request={async () => {
          return {
            timeRange: [dayjs().subtract(24, 'hour'), dayjs()],
            time_field: 'received_at',
            ...initialValues,
          };
        }}
        onValuesChange={handleValuesChange}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Row gutter={[16, 16]} align="middle">
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
                <Button size="small" onClick={() => setQuickTime('last1h')}>1h</Button>
                <Button size="small" onClick={() => setQuickTime('last6h')}>6h</Button>
                <Button size="small" onClick={() => setQuickTime('last24h')}>24h</Button>
                <Button size="small" onClick={() => setQuickTime('today')}>今天</Button>
                <Button size="small" onClick={() => setQuickTime('yesterday')}>昨天</Button>
                <Button size="small" onClick={() => setQuickTime('last7d')}>7d</Button>
              </Space>
            </Col>
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
          </Row>
          <Row gutter={[16, 16]}>
            <Col span={4}>
              <ProFormSelect name="app_id" label="App" options={options.apps} placeholder="全部 App" />
            </Col>
            <Col span={4}>
              <ProFormSelect name="platform" label="平台" options={options.platforms} placeholder="全部平台" />
            </Col>
            <Col span={4}>
              <ProFormSelect name="app_version" label="版本" options={options.versions} placeholder="全部版本" />
            </Col>
            <Col span={4}>
              <ProFormSelect name="user_country" label="国家/地区" options={options.countries} placeholder="全部国家" />
            </Col>
            <Col span={4}>
              <ProFormSelect name="network_type" label="网络类型" options={options.network_types} placeholder="全部网络" />
            </Col>
            <Col span={4}>
              <ProFormSelect name="isp" label="ISP" options={options.isps} placeholder="全部 ISP" />
            </Col>
          </Row>
        </Space>
      </ProForm>
    </Card>
  );
};

export default FilterBar;
