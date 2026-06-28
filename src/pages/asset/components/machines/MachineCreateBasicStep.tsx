import { Descriptions, Form, Input, InputNumber, Select, Space, Tag } from 'antd';
import React from 'react';
import type { MachineCreateWizardMode } from '../../types';
import {
  MachineCreateCatalogSelect,
  MachineCreateHint,
  MachineCreateSection,
} from './MachineCreateShared';
import type { MachineCreateCatalogController } from './useMachineCreateCatalogs';

type Props = {
  mode: MachineCreateWizardMode;
  accounts: API.AssetProviderAccount[];
  catalog: MachineCreateCatalogController;
  retrying?: API.AssetMachine | null;
};

const MachineCreateBasicStep: React.FC<Props> = ({
  mode,
  accounts,
  catalog,
  retrying,
}) => {
  const form = Form.useFormInstance();
  const watchedCountryCode = Form.useWatch(['zone', 'country_code'], form) as
    | string
    | undefined;
  const watchedZoneId = Form.useWatch(['zone', 'zone_id'], form) as
    | string
    | undefined;
  const zoneField = catalog.getFieldStatus('zone.zone_id');
  const instanceTypeField = catalog.getFieldStatus('spec.type');
  const imageField = catalog.getFieldStatus('os.image_id');
  const accountLocked = mode === 'retry';

  return (
    <>
      {mode === 'retry' && retrying ? (
        <Descriptions
          bordered
          column={2}
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Descriptions.Item label="重试机器">
            {retrying.name || retrying.machine_id || `#${retrying.id}`}
          </Descriptions.Item>
          <Descriptions.Item label="所属账号">
            {retrying.account_name || retrying.account_id || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="最近错误" span={2}>
            {retrying.last_error_summary || '-'}
          </Descriptions.Item>
        </Descriptions>
      ) : null}

      {!catalog.available ? (
        <MachineCreateHint message="先选账号，再选资源。可用区、规格、镜像、计费和 SSH 密钥候选会跟着账号收敛。" />
      ) : null}

      {catalog.available && !watchedZoneId ? (
        <MachineCreateHint message="可用区定下来后，规格、镜像、VPC 和公网配置才会继续收敛。" />
      ) : null}

      <MachineCreateSection
        title="基础信息"
        description="先确定账号、机器命名和落地区域。这里决定后续候选范围。"
        extra={
          watchedCountryCode ? (
            <Tag color="blue">{watchedCountryCode.toUpperCase()}</Tag>
          ) : null
        }
      >
        <Space size={16} align="start" style={{ width: '100%' }} wrap>
          <Form.Item
            name="account_id"
            label="供应商账号"
            style={{ flex: 1, minWidth: 280 }}
            rules={[
              { required: true, message: '请选择供应商账号。' },
            ]}
          >
            <Select
              showSearch
              disabled={accountLocked}
              optionFilterProp="label"
              options={accounts.map((item) => ({
                label: `${item.name} (#${item.id})`,
                value: item.id,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="机器名称"
            style={{ flex: 1, minWidth: 280 }}
            rules={[{ required: true, message: '请输入机器名称。' }]}
            extra="批量创建时，后端会自动追加序号后缀。"
          >
            <Input placeholder="na-edge" />
          </Form.Item>
        </Space>

        <Space size={16} align="start" style={{ width: '100%' }} wrap>
          <Form.Item
            name={['zone', 'country_code']}
            label="国家代码"
            style={{ width: 160 }}
            rules={[{ required: true, message: '请输入国家代码。' }]}
          >
            <Input placeholder="US" maxLength={8} />
          </Form.Item>
          <Form.Item
            name={['zone', 'city']}
            label="城市"
            style={{ flex: 1, minWidth: 220 }}
            extra="可选过滤项，Zenlayer 可留空。"
          >
            <Input placeholder="Los Angeles" />
          </Form.Item>
          <Form.Item
            name={['zone', 'zone_id']}
            label="可用区"
            style={{ flex: 1, minWidth: 220 }}
            rules={[{ required: true, message: '请选择可用区。' }]}
          >
            <MachineCreateCatalogSelect
              options={zoneField.options}
              disabled={zoneField.disabled}
              loading={zoneField.loading}
              placeholder={zoneField.placeholder}
              notFoundContent={zoneField.emptyText}
            />
          </Form.Item>
        </Space>
      </MachineCreateSection>

      <MachineCreateSection
        title="规格与镜像"
        description="这里选择真正影响资源成本和兼容性的核心参数。"
      >
        <Space size={16} align="start" style={{ width: '100%' }} wrap>
          <Form.Item
            name={['spec', 'type']}
            label="实例规格"
            style={{ flex: 1, minWidth: 280 }}
            rules={[
              { required: true, message: '请选择实例规格。' },
            ]}
          >
            <MachineCreateCatalogSelect
              options={instanceTypeField.options}
              disabled={instanceTypeField.disabled}
              loading={instanceTypeField.loading}
              placeholder={instanceTypeField.placeholder}
              notFoundContent={instanceTypeField.emptyText}
            />
          </Form.Item>
          <Form.Item
            name={['os', 'image_id']}
            label="系统镜像"
            style={{ flex: 1, minWidth: 280 }}
            rules={[{ required: true, message: '请选择系统镜像。' }]}
          >
            <MachineCreateCatalogSelect
              options={imageField.options}
              disabled={imageField.disabled}
              loading={imageField.loading}
              placeholder={imageField.placeholder}
              notFoundContent={imageField.emptyText}
            />
          </Form.Item>
        </Space>

        <Space size={16} align="start" style={{ width: '100%' }} wrap>
          <Form.Item
            name={['spec', 'cpu_cores']}
            label="CPU 核数"
            style={{ width: 160 }}
          >
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name={['spec', 'memory_mb']}
            label="内存（MiB）"
            style={{ width: 180 }}
          >
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name={['os', 'name']}
            label="系统名称"
            style={{ flex: 1, minWidth: 200 }}
          >
            <Input placeholder="AlmaLinux" />
          </Form.Item>
          <Form.Item
            name={['os', 'version']}
            label="系统版本"
            style={{ width: 180 }}
          >
            <Input placeholder="10.1" />
          </Form.Item>
        </Space>
      </MachineCreateSection>

      <MachineCreateSection
        title="请求控制"
        description="数量和客户端请求 ID 只影响这次提交，不参与机器资源选型。"
      >
        <Space size={16} align="start" style={{ width: '100%' }} wrap>
          <Form.Item name="count" label="数量" style={{ width: 160 }}>
            <InputNumber
              min={1}
              max={100}
              precision={0}
              style={{ width: '100%' }}
              disabled={mode === 'retry'}
            />
          </Form.Item>
          <Form.Item
            name="client_request_id"
            label="客户端请求 ID"
            style={{ flex: 1, minWidth: 320 }}
          >
            <Input
              placeholder="create-na-edge-001"
              disabled={mode === 'retry'}
            />
          </Form.Item>
        </Space>
      </MachineCreateSection>
    </>
  );
};

export default MachineCreateBasicStep;
