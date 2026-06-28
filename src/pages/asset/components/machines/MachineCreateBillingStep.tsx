import { Form, InputNumber, Space } from 'antd';
import React from 'react';
import {
  MachineCreateCatalogSelect,
  MachineCreateHint,
  MachineCreateSection,
} from './MachineCreateShared';
import type { MachineCreateCatalogController } from './useMachineCreateCatalogs';

type Props = {
  catalog: MachineCreateCatalogController;
  zoneReady: boolean;
};

const MachineCreateBillingStep: React.FC<Props> = ({ catalog, zoneReady }) => {
  const billingModeField = catalog.getFieldStatus('billing.mode');
  const periodUnitField = catalog.getFieldStatus('billing.period_unit');

  return (
    <>
      {!zoneReady ? (
        <MachineCreateHint message="先确认可用区。计费模式和系统盘大小通常依赖可用区后才能准确选择。" />
      ) : null}

      <MachineCreateSection
        title="计费"
        description="这里只保留实际提交给创建接口的核心计费字段。"
      >
        <Space size={16} align="start" style={{ width: '100%' }} wrap>
          <Form.Item
            name={['billing', 'mode']}
            label="计费模式"
            style={{ flex: 1, minWidth: 220 }}
            rules={[{ required: true, message: '请选择计费模式。' }]}
          >
            <MachineCreateCatalogSelect
              options={billingModeField.options}
              loading={billingModeField.loading}
              disabled={billingModeField.disabled}
              placeholder={billingModeField.placeholder}
              notFoundContent={billingModeField.emptyText}
            />
          </Form.Item>
          <Form.Item name={['billing', 'period']} label="周期" style={{ width: 140 }}>
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name={['billing', 'period_unit']}
            label="周期单位"
            style={{ width: 180 }}
          >
            <MachineCreateCatalogSelect
              options={periodUnitField.options}
              loading={periodUnitField.loading}
              disabled={periodUnitField.disabled}
              placeholder={periodUnitField.placeholder}
              notFoundContent={periodUnitField.emptyText}
            />
          </Form.Item>
        </Space>
      </MachineCreateSection>

      <MachineCreateSection
        title="系统盘"
        description="系统盘大小是询价和创建都依赖的必填项。"
      >
        <Form.Item
          name={['disk', 'system_size_gb']}
          label="系统盘大小（GiB）"
          rules={[
            { required: true, message: '请输入系统盘大小。' },
          ]}
          extra="当前不再暴露供应商专属磁盘类型，避免创建参数过散。"
        >
          <InputNumber
            min={1}
            precision={0}
            style={{ width: 240 }}
            disabled={!zoneReady}
          />
        </Form.Item>
      </MachineCreateSection>
    </>
  );
};

export default MachineCreateBillingStep;
