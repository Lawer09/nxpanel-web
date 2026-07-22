import React, { useEffect } from 'react';
import {
  ModalForm,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import type { FormInstance, Rule } from 'antd/es/form';
import { App, AutoComplete, Col, Form, Input, Row, Tabs } from 'antd';
import { createProject, updateProject } from '@/services/project/api';
import type { ProjectItem } from '@/services/project/types';
import {
  normalizeProjectFormValues,
  PROJECT_FIELD_GROUPS,
  type ProjectFieldConfig,
} from '../fields';

interface ProjectTableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (project?: Partial<ProjectItem>) => void;
  initialValues?: ProjectItem;
}

const STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
  { label: '已归档', value: 'archived' },
];

const isAndroidPlatform = (value: unknown) => `${value ?? ''}`.trim().toUpperCase() === 'ANDROID';

const renderField = (field: ProjectFieldConfig, isEdit: boolean, form: FormInstance) => {
  const rules: Rule[] = field.required ? [{ required: true, message: `请输入${field.label}` }] : [];
  if (field.name === 'storePageUrl') {
    rules.push({
      validator: async (_, value) => {
        if (!isAndroidPlatform(form.getFieldValue('appPlatform'))) return;
        if (typeof value === 'string' && value.trim()) return;
        return Promise.reject(new Error('请输入商店页链接'));
      },
    });
  }
  const commonProps = {
    name: field.name,
    label: field.label,
    rules: rules.length ? rules : undefined,
  };

  if (field.multiline) {
    return <ProFormTextArea {...commonProps} fieldProps={{ rows: 4 }} />;
  }

  if (field.allowCustomInput) {
    return (
      <Form.Item {...commonProps}>
        <AutoComplete
          allowClear
          options={field.options}
          placeholder={`选择或输入${field.label}`}
          filterOption={(inputValue, option) =>
            `${option?.value ?? ''}`.toLowerCase().includes(inputValue.toLowerCase())
          }
        >
          <Input />
        </AutoComplete>
      </Form.Item>
    );
  }

  if (field.name === 'storePageUrl') {
    return (
      <Form.Item {...commonProps} dependencies={['appPlatform']}>
        <Input />
      </Form.Item>
    );
  }

  if (field.options) {
    return (
      <ProFormSelect
        {...commonProps}
        options={field.options}
        showSearch
        fieldProps={{ optionFilterProp: 'label' }}
      />
    );
  }

  return (
    <ProFormText
      {...commonProps}
      disabled={isEdit && field.disabledOnEdit}
    />
  );
};

const ProjectTableForm: React.FC<ProjectTableFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
  initialValues,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const isEdit = !!initialValues;

  useEffect(() => {
    if (!open) return;
    if (initialValues) {
      form.setFieldsValue(initialValues);
      return;
    }
    form.resetFields();
    form.setFieldsValue({ status: 'active' });
  }, [form, initialValues, open]);

  return (
    <ModalForm
      title={isEdit ? '编辑项目' : '新建项目'}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      width={900}
      modalProps={{ destroyOnHidden: true }}
      onFinish={async (values) => {
        const payload = normalizeProjectFormValues(values);
        try {
          if (isEdit) {
            await updateProject({ ...payload, id: initialValues.id });
            message.success('编辑成功');
            onSuccess({ ...initialValues, ...payload });
          } else {
            await createProject(payload as any);
            message.success('创建成功');
            onSuccess();
          }
          return true;
        } catch (_error) {
          return false;
        }
      }}
      onValuesChange={(changedValues) => {
        if (Object.prototype.hasOwnProperty.call(changedValues, 'appPlatform')) {
          void form.validateFields(['storePageUrl']).catch(() => undefined);
        }
      }}
    >
      <Tabs
        items={PROJECT_FIELD_GROUPS.map((group) => ({
          key: group.key,
          label: group.label,
          children: (
            <Row gutter={16}>
              {group.key === 'base' ? (
                <Col span={8}>
                  <ProFormSelect
                    name="status"
                    label="状态"
                    options={STATUS_OPTIONS}
                    rules={[{ required: true, message: '请选择状态' }]}
                  />
                </Col>
              ) : null}
              {group.fields.map((field) => (
                <Col span={field.multiline ? 24 : 8} key={field.name}>
                  {renderField(field, isEdit, form)}
                </Col>
              ))}
            </Row>
          ),
        }))}
      />
    </ModalForm>
  );
};

export default ProjectTableForm;
