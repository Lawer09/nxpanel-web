import { ModalForm, ProFormDigit, ProFormRadio, ProFormSelect, ProFormSwitch, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { App } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  getGiftCardTemplates,
  getInviteGiftCardOptions,
  saveInviteGiftCardRule,
} from '@/services/invite-gift-card/api';

interface RuleFormModalProps {
  open: boolean;
  current?: API.InviteGiftCardRule;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const RuleFormModal: React.FC<RuleFormModalProps> = ({
  open,
  current,
  onOpenChange,
  onSuccess,
}) => {
  const { message: messageApi } = App.useApp();
  const [templates, setTemplates] = useState<API.GiftCardTemplate[]>([]);
  const [options, setOptions] = useState<API.InviteGiftCardOptions>();
  const [triggerType, setTriggerType] = useState<API.TriggerType>('register');

  useEffect(() => {
    if (open) {
      // 加载模板列表
      getGiftCardTemplates().then((res) => {
        if (res.code === 0 && res.data) {
          setTemplates(res.data);
        }
      });
      // 加载配置选项
      getInviteGiftCardOptions().then((res) => {
        if (res.code === 0 && res.data) {
          setOptions(res.data);
        }
      });
      // 设置初始触发类型
      if (current) {
        setTriggerType(current.trigger_type);
      }
    }
  }, [open, current]);

  const handleSubmit = async (values: any) => {
    const params: API.InviteGiftCardRuleSaveParams = {
      ...values,
      id: current?.id,
    };

    const res = await saveInviteGiftCardRule(params);
    if (res.code !== 0) {
      messageApi.error(res.msg || '保存失败');
      return false;
    }

    messageApi.success(current ? '编辑成功' : '创建成功');
    onSuccess();
    return true;
  };

  return (
    <ModalForm
      title={current ? '编辑规则' : '新增规则'}
      open={open}
      onOpenChange={onOpenChange}
      modalProps={{
        destroyOnHidden: true,
        width: 700,
      }}
      initialValues={
        current
          ? {
              name: current.name,
              trigger_type: current.trigger_type,
              template_id: current.template_id,
              target: current.target,
              auto_redeem: current.auto_redeem,
              min_order_amount: current.min_order_amount
                ? current.min_order_amount / 100
                : undefined,
              order_type: current.order_type,
              max_issue_per_user: current.max_issue_per_user || 0,
              expires_hours: current.expires_hours,
              status: current.status,
              sort: current.sort || 0,
              description: current.description,
            }
          : {
              trigger_type: 'register',
              target: 'both',
              auto_redeem: true,
              max_issue_per_user: 0,
              expires_hours: 720,
              status: true,
              sort: 0,
            }
      }
      onFinish={handleSubmit}
      layout="horizontal"
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 16 }}
    >
      <ProFormText
        name="name"
        label="规则名称"
        placeholder="请输入规则名称"
        rules={[{ required: true, message: '请输入规则名称' }]}
      />

      <ProFormRadio.Group
        name="trigger_type"
        label="触发类型"
        rules={[{ required: true }]}
        fieldProps={{
          onChange: (e) => setTriggerType(e.target.value),
        }}
        options={
          options
            ? Object.entries(options.trigger_types).map(([value, label]) => ({
                label,
                value,
              }))
            : []
        }
      />

      <ProFormSelect
        name="template_id"
        label="礼品卡模板"
        placeholder="选择礼品卡模板"
        rules={[{ required: true, message: '请选择礼品卡模板' }]}
        options={templates.map((t) => ({
          label: t.name,
          value: t.id,
          disabled: !t.status,
        }))}
        fieldProps={{
          showSearch: true,
          optionFilterProp: 'label',
        }}
      />

      <ProFormRadio.Group
        name="target"
        label="发放对象"
        rules={[{ required: true }]}
        options={
          options
            ? Object.entries(options.targets).map(([value, label]) => ({
                label,
                value,
              }))
            : []
        }
      />

      <ProFormSwitch
        name="auto_redeem"
        label="自动兑换"
        tooltip="开启后，礼品卡将自动兑换到用户账户"
      />

      {triggerType === 'order_paid' && (
        <>
          <ProFormDigit
            name="min_order_amount"
            label="最低订单金额"
            placeholder="请输入最低订单金额(元)"
            tooltip="仅当订单金额达到此值时才触发"
            fieldProps={{
              precision: 2,
              min: 0,
              addonAfter: '元',
            }}
          />

          <ProFormSelect
            name="order_type"
            label="订单类型"
            placeholder="不限"
            tooltip="限制触发的订单类型，不选则不限"
            options={
              options
                ? Object.entries(options.order_types).map(([value, label]) => ({
                    label,
                    value: Number(value),
                  }))
                : []
            }
            fieldProps={{
              allowClear: true,
            }}
          />
        </>
      )}

      <ProFormDigit
        name="max_issue_per_user"
        label="每人最多发放"
        tooltip="每个邀请人最多可获得的次数，0表示不限"
        fieldProps={{
          min: 0,
          precision: 0,
          addonAfter: '次',
        }}
      />

      <ProFormDigit
        name="expires_hours"
        label="有效期"
        tooltip="兑换码的有效期(小时)，留空表示永久有效"
        fieldProps={{
          min: 1,
          precision: 0,
          addonAfter: '小时',
        }}
      />

      <ProFormSwitch name="status" label="启用状态" />

      <ProFormDigit
        name="sort"
        label="排序"
        tooltip="数值越小越靠前"
        fieldProps={{
          precision: 0,
        }}
      />

      <ProFormTextArea
        name="description"
        label="规则描述"
        placeholder="请输入规则描述"
        fieldProps={{
          rows: 3,
          maxLength: 500,
          showCount: true,
        }}
      />
    </ModalForm>
  );
};

export default RuleFormModal;
