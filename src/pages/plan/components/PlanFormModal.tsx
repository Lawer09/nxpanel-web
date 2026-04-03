import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { App, Divider, Form, InputNumber, Space, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { savePlan } from '@/services/plan/api';

const PERIOD_LABELS: Record<string, string> = {
  weekly: '周付',
  monthly: '月付',
  quarterly: '季付',
  half_yearly: '半年付',
  yearly: '年付',
  two_yearly: '两年付',
  three_yearly: '三年付',
  onetime: '一次性',
  reset_traffic: '重置流量',
};

const RESET_TRAFFIC_OPTIONS = [
  { label: '跟随系统设置', value: -1 },
  { label: '每月1号重置', value: 0 },
  { label: '按月重置（从订阅日算）', value: 1 },
  { label: '不重置', value: 2 },
  { label: '每年1月1日重置', value: 3 },
  { label: '按年重置', value: 4 },
];

interface PlanFormModalProps {
  open: boolean;
  current?: API.PlanItem;
  groups?: API.PlanGroupLite[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const PlanFormModal: React.FC<PlanFormModalProps> = ({
  open,
  current,
  groups = [],
  onOpenChange,
  onSuccess,
}) => {
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm();
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      if (current) {
        const prices = current.prices ?? {};
        form.setFieldsValue({
          ...current,
          reset_traffic_method: current.reset_traffic_method ?? -1,
          ...Object.fromEntries(
            Object.entries(PERIOD_LABELS).map(([key]) => [
              `price_${key}`,
              prices[key as keyof API.PlanPrices] != null
                ? Number(prices[key as keyof API.PlanPrices])
                : undefined,
            ]),
          ),
        });
        setTags(current.tags ?? []);
      } else {
        form.resetFields();
        setTags([]);
      }
    }
  }, [open, current]);

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const buildPrices = (values: Record<string, any>): API.PlanPrices => {
    const prices: API.PlanPrices = {};
    for (const key of Object.keys(PERIOD_LABELS)) {
      const v = values[`price_${key}`];
      prices[key as keyof API.PlanPrices] =
        v != null && v !== '' ? Math.round(Number(v)) : null;
    }
    return prices;
  };

  return (
    <ModalForm
      title={current ? `编辑套餐 — ${current.name}` : '新增套餐'}
      open={open}
      form={form}
      width={680}
      modalProps={{ destroyOnHidden: true }}
      onOpenChange={onOpenChange}
      onFinish={async (values) => {
        const reset = values.reset_traffic_method;
        const payload: API.PlanSaveParams = {
          id: current?.id,
          name: values.name,
          transfer_enable: values.transfer_enable,
          group_id: values.group_id ?? null,
          speed_limit: values.speed_limit ?? null,
          device_limit: values.device_limit ?? null,
          capacity_limit: values.capacity_limit ?? null,
          content: values.content ?? null,
          reset_traffic_method: reset === -1 ? null : reset,
          prices: buildPrices(values),
          tags: tags.length ? tags : null,
          force_update: values.force_update ?? false,
        };

        const res = await savePlan(payload);
        if (res.code !== 0) {
          messageApi.error(res.msg || '保存失败');
          return false;
        }
        messageApi.success(current ? '套餐已更新' : '套餐已创建');
        onSuccess();
        return true;
      }}
    >
      <ProFormText
        name="name"
        label="套餐名称"
        rules={[{ required: true, message: '请输入套餐名称' }]}
        fieldProps={{ maxLength: 255 }}
      />

      <Space style={{ width: '100%', gap: 16 }} align="start">
        <ProFormDigit
          name="transfer_enable"
          label="流量配额 (GB)"
          rules={[{ required: true, message: '请输入流量配额' }]}
          fieldProps={{ min: 1, style: { width: 180 } }}
        />
        <ProFormDigit
          name="speed_limit"
          label="限速 (Mbps)"
          fieldProps={{ min: 0, style: { width: 160 }, placeholder: '0=不限' }}
        />
        <ProFormDigit
          name="device_limit"
          label="设备数量限制"
          fieldProps={{ min: 0, style: { width: 160 }, placeholder: '0=不限' }}
        />
      </Space>

      <Space style={{ width: '100%', gap: 16 }} align="start">
        <ProFormDigit
          name="capacity_limit"
          label="订阅人数上限"
          fieldProps={{ min: 0, style: { width: 180 }, placeholder: '0=不限' }}
        />
        <ProFormSelect
          name="group_id"
          label="权限组"
          style={{ width: 200 }}
          options={groups.map((g) => ({ label: g.name, value: g.id }))}
          fieldProps={{ allowClear: true, placeholder: '无' }}
        />
        <ProFormSelect
          name="reset_traffic_method"
          label="流量重置方式"
          style={{ width: 220 }}
          options={RESET_TRAFFIC_OPTIONS}
          initialValue={-1}
        />
      </Space>

      <Divider orientation="left" style={{ fontSize: 13 }}>
        价格配置
      </Divider>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px 16px',
        }}
      >
        {Object.entries(PERIOD_LABELS).map(([key, label]) => (
          <Form.Item
            key={key}
            name={`price_${key}`}
            label={label}
            style={{ marginBottom: 8 }}
          >
            <InputNumber
              min={0}
              precision={2}
              style={{ width: '100%' }}
              placeholder="留空不售卖"
              prefix="¥"
            />
          </Form.Item>
        ))}
      </div>

      <Divider orientation="left" style={{ fontSize: 13 }}>
        其他配置
      </Divider>

      <ProFormTextArea
        name="content"
        label="套餐描述"
        fieldProps={{ rows: 3 }}
      />

      {/* Tag input */}
      <Form.Item label="标签">
        <Space wrap>
          {tags.map((t) => (
            <Tag
              key={t}
              closable
              onClose={() => setTags(tags.filter((x) => x !== t))}
            >
              {t}
            </Tag>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="输入标签后按 Enter"
            style={{
              border: '1px dashed #d9d9d9',
              borderRadius: 4,
              padding: '2px 8px',
              fontSize: 13,
              outline: 'none',
              width: 140,
            }}
          />
        </Space>
      </Form.Item>

      {current && (
        <ProFormSwitch
          name="force_update"
          label="强制更新已有用户"
          tooltip="同步更新已订阅此套餐的用户的权限组、流量、限速、设备数量"
        />
      )}
    </ModalForm>
  );
};

export default PlanFormModal;
