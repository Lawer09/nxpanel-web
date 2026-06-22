import {
  ModalForm,
  ProFormDateTimePicker,
  ProFormGroup,
  ProFormList,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { App } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { saveAidLoginBanRule, updateAidLoginBanRule } from '@/services/user/api';

type AidLoginBanRuleFormModalProps = {
  open: boolean;
  current?: API.AidLoginBanRuleItem;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

type AidLoginBanRuleFormValues = Omit<API.AidLoginBanRuleSaveParams, 'weeklyWindows'> & {
  cutoffAt?: string;
  weeklyWindows?: API.AidLoginBanRuleWeeklyWindow[];
};

const WEEKDAY_OPTIONS = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 },
];

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const normalizeTags = (value?: string[]) =>
  (value ?? []).map((item) => String(item).trim()).filter(Boolean);

const normalizeCountries = (value?: string[]) =>
  normalizeTags(value).map((item) => item.toUpperCase());

const AidLoginBanRuleFormModal: React.FC<AidLoginBanRuleFormModalProps> = ({
  open,
  current,
  onOpenChange,
  onSuccess,
}) => {
  const { message: messageApi } = App.useApp();

  const initialValues = current
    ? {
        ...current,
        cutoffAt: current.cutoffAt || undefined,
        enabled: current.enabled,
        weeklyWindows: current.weeklyWindows ?? [],
        packageNames: current.packageNames ?? [],
        projectCodes: current.projectCodes ?? [],
        countries: current.countries ?? [],
      }
    : {
        enabled: true,
        weeklyWindows: [],
        packageNames: [],
        projectCodes: [],
        countries: [],
      };

  return (
    <ModalForm
      title={current ? `编辑封禁策略 ${current.name}` : '新增封禁策略'}
      open={open}
      initialValues={initialValues}
      modalProps={{ destroyOnHidden: true, width: 760 }}
      onOpenChange={onOpenChange}
      submitter={{ searchConfig: { submitText: current ? '保存' : '新增' } }}
      onFinish={async (values: AidLoginBanRuleFormValues) => {
        const weeklyWindows = (values.weeklyWindows ?? [])
          .filter((item) => item?.weekday || item?.start || item?.end)
          .map((item) => ({
            weekday: Number(item.weekday),
            start: item.start,
            end: item.end,
          }));

        const incompleteRange = weeklyWindows.find((item) => !item.weekday || !item.start || !item.end);
        if (incompleteRange) {
          messageApi.error('生效时间段填写后需补全星期、开始时间和结束时间');
          return false;
        }

        const invalidRange = weeklyWindows.find((item) => item.start && item.end && item.end <= item.start);
        if (invalidRange) {
          messageApi.error('生效时间段的结束时间必须大于开始时间');
          return false;
        }

        const basePayload: API.AidLoginBanRuleSaveParams = {
          name: values.name,
          enabled: values.enabled ?? true,
          cutoffAt: values.cutoffAt ? dayjs(values.cutoffAt).format('YYYY-MM-DD HH:mm:ss') : undefined,
          weeklyWindows,
          packageNames: normalizeTags(values.packageNames),
          projectCodes: normalizeTags(values.projectCodes),
          countries: normalizeCountries(values.countries),
          reason: values.reason || undefined,
        };

        const res = current
          ? await updateAidLoginBanRule({ id: current.id, ...basePayload })
          : await saveAidLoginBanRule(basePayload);

        if (res.code !== 0) {
          messageApi.error(res.msg || '保存失败');
          return false;
        }
        messageApi.success(current ? '封禁策略已更新' : '封禁策略已新增');
        onSuccess();
        return true;
      }}
    >
      <ProFormGroup>
        <ProFormText
          name="name"
          label="规则名称"
          colProps={{ span: 14 }}
          rules={[
            { required: true, message: '请输入规则名称' },
            { max: 191, message: '规则名称最多 191 个字符' },
          ]}
        />
        <ProFormSwitch name="enabled" label="启用" colProps={{ span: 5 }} />
      </ProFormGroup>

      <ProFormDateTimePicker
        name="cutoffAt"
        label="有效截止时间"
        placeholder="留空表示不限制截止时间"
        fieldProps={{ format: 'YYYY-MM-DD HH:mm:ss' }}
      />

      <ProFormList
        name="weeklyWindows"
        label="生效时间段"
        creatorButtonProps={{ creatorButtonText: '添加时间段' }}
      >
        <ProFormGroup>
          <ProFormSelect
            name="weekday"
            label="星期"
            width="xs"
            options={WEEKDAY_OPTIONS}
          />
          <ProFormText
            name="start"
            label="开始"
            width="xs"
            placeholder="00:00"
            rules={[
              { pattern: TIME_PATTERN, message: '时间格式应为 HH:mm' },
            ]}
          />
          <ProFormText
            name="end"
            label="结束"
            width="xs"
            placeholder="06:00"
            rules={[
              { pattern: TIME_PATTERN, message: '时间格式应为 HH:mm' },
            ]}
          />
        </ProFormGroup>
      </ProFormList>

      <ProFormGroup>
        <ProFormSelect
          name="packageNames"
          label="封禁匹配包名列表"
          mode="tags"
          colProps={{ span: 12 }}
          fieldProps={{ tokenSeparators: [','] }}
          placeholder="留空表示不限制"
        />
        <ProFormSelect
          name="projectCodes"
          label="封禁匹配项目代号"
          mode="tags"
          colProps={{ span: 12 }}
          fieldProps={{ tokenSeparators: [','] }}
          placeholder="留空表示不限制"
        />
      </ProFormGroup>

      <ProFormGroup>
        <ProFormSelect
          name="countries"
          label="封禁匹配国家列表"
          mode="tags"
          colProps={{ span: 12 }}
          fieldProps={{ tokenSeparators: [','] }}
          placeholder="留空表示不限制"
        />
      </ProFormGroup>

      <ProFormTextArea
        name="reason"
        label="封禁原因"
        fieldProps={{ rows: 3, maxLength: 500, showCount: true }}
        rules={[{ max: 500, message: '封禁原因最多 500 个字符' }]}
      />
    </ModalForm>
  );
};

export default AidLoginBanRuleFormModal;
