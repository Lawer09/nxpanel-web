import React, { useEffect } from 'react';
import { ModalForm, ProFormText, ProFormSelect, ProFormTextArea } from '@ant-design/pro-components';
import { Form, App } from 'antd';
import { createProject, updateProject } from '@/services/project/api';
import type { ProjectItem } from '@/services/project/types';

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialValues?: ProjectItem;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ open, onOpenChange, onSuccess, initialValues }) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const isEdit = !!initialValues;

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue(initialValues);
      } else {
        form.resetFields();
      }
    }
  }, [open, initialValues, form]);

  return (
    <ModalForm
      title={isEdit ? '编辑项目' : '新建项目'}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      modalProps={{ destroyOnHidden: true }}
      onFinish={async (values) => {
        try {
          if (isEdit) {
            await updateProject({ ...values, id: initialValues.id });
            message.success('编辑成功');
          } else {
            await createProject(values as any);
            message.success('创建成功');
          }
          onSuccess();
          return true;
        } catch (error) {
          // Error handled by request interceptor
          return false;
        }
      }}
    >
      <ProFormText
        name="projectCode"
        label="项目代号"
        rules={[{ required: true, message: '请输入项目代号' }]}
        disabled={isEdit}
        placeholder="例如: P001"
      />
      <ProFormText
        name="projectName"
        label="项目名称"
        rules={[{ required: true, message: '请输入项目名称' }]}
      />
      <ProFormText
        name="department"
        label="部门"
      />
      <ProFormText
        name="ownerId"
        label="负责人 ID"
        fieldProps={{ type: 'number' }}
      />
      <ProFormText
        name="ownerName"
        label="负责人名称"
      />
      <ProFormSelect
        name="status"
        label="状态"
        initialValue="active"
        options={[
          { label: '启用', value: 'active' },
          { label: '停用', value: 'inactive' },
          { label: '已归档', value: 'archived' },
        ]}
        rules={[{ required: true, message: '请选择状态' }]}
      />
      <ProFormTextArea
        name="remark"
        label="备注"
      />
    </ModalForm>
  );
};

export default ProjectForm;
