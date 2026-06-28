import { Input, Modal, Select, Space, Typography } from 'antd';
import React from 'react';

const { Text } = Typography;

type Props = {
  open: boolean;
  accounts: API.AssetProviderAccount[];
  accountId?: number;
  region?: string;
  saving: boolean;
  onAccountIdChange: (value?: number) => void;
  onRegionChange: (value?: string) => void;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
};

const MachineImportModal: React.FC<Props> = ({
  open,
  accounts,
  accountId,
  region,
  saving,
  onAccountIdChange,
  onRegionChange,
  onCancel,
  onSubmit,
}) => (
  <Modal
    title="供应商导入机器"
    open={open}
    width={640}
    destroyOnHidden
    confirmLoading={saving}
    onCancel={onCancel}
    onOk={onSubmit}
  >
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          供应商账号
        </Text>
        <Select
          showSearch
          value={accountId}
          style={{ width: '100%' }}
          optionFilterProp="label"
          options={accounts.map((item) => ({
            label: `${item.name} (#${item.id})`,
            value: item.id,
          }))}
          onChange={onAccountIdChange}
          placeholder="选择供应商账号"
        />
      </div>
      <div>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          地域
        </Text>
        <Input
          value={region}
          onChange={(event) => onRegionChange(event.target.value)}
          placeholder="可选，用于按地域过滤导入"
        />
      </div>
    </Space>
  </Modal>
);

export default MachineImportModal;
