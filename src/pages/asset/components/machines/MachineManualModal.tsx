import { Descriptions, Form, Modal } from 'antd';
import React from 'react';
import type { MachineFormValues } from '../../types';
import {
  MachineManualBaseFields,
  MachineManualSpecFields,
} from './MachineManualFields';

type Props = {
  open: boolean;
  editing: API.AssetMachine | null;
  form: ReturnType<typeof Form.useForm<MachineFormValues>>[0];
  saving: boolean;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
};

const MachineManualModal: React.FC<Props> = ({
  open,
  editing,
  form,
  saving,
  onCancel,
  onSubmit,
}) => (
  <Modal
    title={editing ? `编辑机器 #${editing.id}` : '手动录入机器'}
    open={open}
    destroyOnHidden
    width={880}
    confirmLoading={saving}
    onCancel={onCancel}
    onOk={onSubmit}
  >
    <Form<MachineFormValues> form={form} layout="vertical">
      {editing ? (
        <Descriptions
          bordered
          column={1}
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Descriptions.Item label="机器 ID">
            {editing.machine_id || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="外部实例 ID">
            {editing.external_instance_id || '-'}
          </Descriptions.Item>
        </Descriptions>
      ) : null}
      <MachineManualBaseFields editing={editing} />
      <MachineManualSpecFields rows={5} />
    </Form>
  </Modal>
);

export default MachineManualModal;
