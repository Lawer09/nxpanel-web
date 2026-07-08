import {
  ModalForm,
  ProFormGroup,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { App } from 'antd';
import React from 'react';
import type { ProjectUserAppMapping } from '@/services/project/types';
import { saveIpAllowlistRule, updateIpAllowlistRule } from '@/services/user/api';

type IpAllowlistRuleFormModalProps = {
  open: boolean;
  current?: API.IpAllowlistRuleItem;
  mappings: ProjectUserAppMapping[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const normalizeTags = (value?: string[]) =>
  (value ?? []).map((item) => String(item).trim()).filter(Boolean);

const normalizeCountries = (value?: string[]) =>
  normalizeTags(value).map((item) => item.toUpperCase());

const buildPackageOptions = (mappings: ProjectUserAppMapping[]) => {
  const seen = new Set<string>();
  return mappings.flatMap((item) =>
    (item.packageNames ?? []).reduce<{ label: string; value: string }[]>((options, packageName) => {
      const value = String(packageName || '').trim();
      if (!value || seen.has(value)) return options;
      seen.add(value);
      options.push({
        value,
        label: item.projectCode ? `${value}（${item.projectCode}）` : value,
      });
      return options;
    }, []),
  );
};

const buildProjectCodeOptions = (mappings: ProjectUserAppMapping[]) => {
  const seen = new Set<string>();
  return mappings.reduce<{ label: string; value: string }[]>((options, item) => {
    const value = String(item.projectCode || '').trim();
    if (!value || seen.has(value)) return options;
    seen.add(value);
    options.push({ label: value, value });
    return options;
  }, []);
};

const IpAllowlistRuleFormModal: React.FC<IpAllowlistRuleFormModalProps> = ({
  open,
  current,
  mappings,
  onOpenChange,
  onSuccess,
}) => {
  const { message: messageApi } = App.useApp();

  const packageOptions = buildPackageOptions(mappings);
  const projectCodeOptions = buildProjectCodeOptions(mappings);

  const initialValues = current
    ? {
        ...current,
        enabled: current.enabled,
        countries: current.countries ?? [],
        projectCodes: current.projectCodes ?? [],
        packageNames: current.packageNames ?? [],
      }
    : {
        enabled: true,
        countries: [],
        projectCodes: [],
        packageNames: [],
      };

  return (
    <ModalForm
      title={current ? `编辑白名单策略 ${current.name}` : '新增白名单策略'}
      open={open}
      initialValues={initialValues}
      modalProps={{ destroyOnHidden: true, width: 720 }}
      onOpenChange={onOpenChange}
      submitter={{ searchConfig: { submitText: current ? '保存' : '新增' } }}
      onFinish={async (values) => {
        const countries = normalizeCountries(values.countries);
        const projectCodes = normalizeTags(values.projectCodes);
        const packageNames = normalizeTags(values.packageNames);

        if (!countries.length && !projectCodes.length && !packageNames.length) {
          messageApi.error('国家、项目代号、包名至少需要配置一类条件');
          return false;
        }

        const payload: API.IpAllowlistRuleSaveParams = {
          name: values.name,
          enabled: values.enabled ?? true,
          countries,
          projectCodes,
          packageNames,
          reason: values.reason?.trim() || undefined,
        };

        const res = current
          ? await updateIpAllowlistRule({ id: current.id, ...payload })
          : await saveIpAllowlistRule(payload);

        if (res.code !== 0) {
          messageApi.error(res.msg || '保存失败');
          return false;
        }
        messageApi.success(current ? '白名单策略已更新' : '白名单策略已新增');
        onSuccess();
        return true;
      }}
    >
      <ProFormGroup>
        <ProFormText
          name="name"
          label="规则名称"
          colProps={{ span: 16 }}
          rules={[
            { required: true, message: '请输入规则名称' },
            { max: 191, message: '规则名称最多 191 个字符' },
          ]}
        />
        <ProFormSwitch name="enabled" label="启用" colProps={{ span: 6 }} />
      </ProFormGroup>

      <ProFormSelect
        name="countries"
        label="国家"
        mode="tags"
        width="xl"
        fieldProps={{ tokenSeparators: [','], style: { width: '100%' } }}
        placeholder="可输入多个国家缩写，例如 US, CA"
      />

      <ProFormSelect
        name="projectCodes"
        label="项目代号"
        mode="tags"
        width="xl"
        options={projectCodeOptions}
        fieldProps={{ tokenSeparators: [','], style: { width: '100%' } }}
        placeholder="可选已有项目代号，也可直接输入"
      />

      <ProFormSelect
        name="packageNames"
        label="包名 / 应用 ID"
        mode="tags"
        width="xl"
        options={packageOptions}
        fieldProps={{ tokenSeparators: [','], style: { width: '100%' } }}
        placeholder="可选已有包名，也可直接输入"
      />

      <ProFormTextArea
        name="reason"
        label="自动加入原因"
        fieldProps={{ rows: 3, maxLength: 500, showCount: true }}
        rules={[{ max: 500, message: '自动加入原因最多 500 个字符' }]}
      />
    </ModalForm>
  );
};

export default IpAllowlistRuleFormModal;
