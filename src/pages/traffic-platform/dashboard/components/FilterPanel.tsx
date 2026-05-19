import React, { useState } from 'react';
import { Button, DatePicker, Input, Select, Space } from 'antd';
import dayjs from 'dayjs';
import { useDashboard } from '../DashboardContext';

const { RangePicker } = DatePicker;

const FilterPanel: React.FC = () => {
  const { filters, setFilters, platformOptions, accountOptions, reloadKpi } = useDashboard();

  // Local state for filter panel inputs before applying
  const [localFilters, setLocalFilters] = useState(filters);

  const handleSearch = () => {
    setFilters(localFilters);
    reloadKpi();
  };

  const handleReset = () => {
    const defaultFilters = {
      dateRange: [dayjs().subtract(6, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs],
      granularity: 'day' as const,
      platformCode: undefined,
      accountId: undefined,
      geo: undefined,
    };
    setLocalFilters(defaultFilters);
    setFilters(defaultFilters);
    reloadKpi();
  };

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '10px',
      border: '1px solid #E5E7EB',
      padding: '24px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space wrap size={16} align="center" style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#374151' }}>平台</span>
            <Select
              allowClear
              placeholder="全部平台"
              style={{ width: 120, height: '34px' }}
              options={platformOptions}
              value={localFilters.platformCode}
              onChange={(v) => setLocalFilters({ ...localFilters, platformCode: v })}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#374151' }}>账号</span>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="全部账号"
              style={{ width: 180, height: '34px' }}
              options={accountOptions}
              value={localFilters.accountId}
              onChange={(v) => setLocalFilters({ ...localFilters, accountId: v })}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#374151' }}>日期范围</span>
            <RangePicker
              style={{ width: 240, height: '34px' }}
              value={localFilters.dateRange}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setLocalFilters({ ...localFilters, dateRange: [dates[0], dates[1]] });
                }
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#374151' }}>地区</span>
            <Select
              allowClear
              placeholder="全部地区"
              style={{ width: 120, height: '34px' }}
              options={[
                { label: 'SG', value: 'SG' },
                { label: 'US', value: 'US' },
                { label: 'HK', value: 'HK' },
                { label: 'JP', value: 'JP' },
                { label: 'TW', value: 'TW' },
              ]}
              value={localFilters.geo}
              onChange={(v) => setLocalFilters({ ...localFilters, geo: v })}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#374151' }}>时间维度</span>
            <Select
              style={{ width: 120, height: '34px' }}
              value={localFilters.granularity}
              onChange={(v) => setLocalFilters({ ...localFilters, granularity: v })}
              options={[
                { label: '小时', value: 'hour' },
                { label: '日', value: 'day' },
                { label: '月', value: 'month' },
              ]}
            />
          </div>
        </Space>
        
        <Space size={12}>
          <Button onClick={handleReset} style={{ width: '72px', height: '34px' }}>重置</Button>
          <Button type="primary" onClick={handleSearch} style={{ width: '72px', height: '34px', backgroundColor: '#2563EB' }}>查询</Button>
        </Space>
      </div>
    </div>
  );
};

export default FilterPanel;
