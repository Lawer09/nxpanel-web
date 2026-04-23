import {
  App,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
} from 'antd';
import React, { useEffect } from 'react';
import {
  createProjectMapping,
  updateProjectMapping,
} from '@/services/ad/api';

interface Props {
  open: boolean;
  current?: API.ProjectMapping;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ProjectMappingFormModal: React.FC<Props> = ({
  open,
  current,
  onOpenChange,
  onSuccess,
}) => {
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm();
  const isEdit = !!current;

  useEffect(() => {
    if (open) {
      if (current) {
        form.setFieldsValue({
          project_id: current.project_id,
          source_platform: current.source_platform,
          account_id: current.account_id,
          provider_app_id: current.provider_app_id,
          status: current.status,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ status: 'enabled' });
      }
    }
  }, [open, current]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const res = isEdit
        ? await updateProjectMapping(current!.id, values)
        : await createProjectMapping(values);
      if (res.code !== 0) {
        messageApi.error(res.msg || (isEdit ? '更新失败' : '创建失败'));
        return;
      }
      messageApi.success(isEdit ? '更新成功' : '创建成功');
      onSuccess();
    } catch {
      // validation
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑项目映射' : '新建项目映射'}
      open={open}
      onCancel={() => onOpenChange(false)}
      onOk={handleOk}
      width={520}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="project_id"
          label="项目 ID"
          rules={[{ required: true, message: '请输入项目 ID' }]}
        >
          <InputNumber style={{ width: '100%' }} placeholder="项目 ID" min={1} />
        </Form.Item>
        <Form.Item
          name="source_platform"
          label="平台"
          rules={[{ required: true, message: '请选择平台' }]}
        >
          <Select
            placeholder="选择平台"
            options={[
              { label: 'AdMob', value: 'admob' },
              { label: 'Meta', value: 'meta' },
              { label: 'Unity', value: 'unity' },
              { label: 'AppLovin', value: 'applovin' },
              { label: 'ironSource', value: 'ironsource' },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="account_id"
          label="账号 ID"
          rules={[{ required: true, message: '请输入账号 ID' }]}
        >
          <InputNumber style={{ width: '100%' }} placeholder="广告账号 ID" min={1} />
        </Form.Item>
        <Form.Item
          name="provider_app_id"
          label="Provider App ID"
          rules={[{ required: true, message: '请输入 Provider App ID' }]}
        >
          <Input placeholder="如 ca-app-pub-xxx~yyy" />
        </Form.Item>
        <Form.Item
          name="status"
          label="状态"
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { label: '启用', value: 'enabled' },
              { label: '停用', value: 'disabled' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ProjectMappingFormModal;
