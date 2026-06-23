import type { ProjectItem } from '@/services/project/types';
import { PROJECT_AD_STATUS_OPTIONS } from '@/pages/project/constants';

export type ProjectTextField = keyof Pick<
  ProjectItem,
  | 'projectCode'
  | 'projectName'
  | 'ownerName'
  | 'department'
  | 'adStatus'
  | 'adspowerEnv'
  | 'developerGmail'
  | 'appName'
  | 'packageName'
  | 'domainInfoStatus'
  | 'admobPubId'
  | 'domainUrl'
  | 'privacyPolicyUrl'
  | 'termsUrl'
  | 'facebookInfoStatus'
  | 'facebookAppId'
  | 'facebookAppToken'
  | 'facebookKeyHash'
  | 'facebookClassName'
  | 'admobAccountStatus'
  | 'admobAppId'
  | 'admobAdIds'
  | 'admobAppAdsTxt'
  | 'firebaseConfigNote'
  | 'yandexAccount'
  | 'yandexAdIds'
  | 'yandexAppAdsTxt'
  | 'storePageUrl'
  | 'remark'
>;

export interface ProjectFieldConfig {
  name: ProjectTextField;
  label: string;
  multiline?: boolean;
  required?: boolean;
  disabledOnEdit?: boolean;
  options?: { label: string; value: string }[];
  width?: number;
}

export interface ProjectFieldGroup {
  key: string;
  label: string;
  fields: ProjectFieldConfig[];
}

export const PROJECT_FIELD_GROUPS: ProjectFieldGroup[] = [
  {
    key: 'base',
    label: '基础信息',
    fields: [
      { name: 'projectCode', label: '项目代号', required: true, disabledOnEdit: true, width: 140 },
      { name: 'projectName', label: '项目名称', required: true, width: 180 },
      { name: 'ownerName', label: '负责人', width: 120 },
      { name: 'department', label: '所属部门', width: 140 },
      { name: 'adStatus', label: '投放状态', options: PROJECT_AD_STATUS_OPTIONS, width: 120 },
      { name: 'adspowerEnv', label: 'Adspower 环境', width: 160 },
    ],
  },
  {
    key: 'app',
    label: '应用信息',
    fields: [
      { name: 'developerGmail', label: '开发者 Gmail', width: 180 },
      { name: 'appName', label: '应用名称', width: 180 },
      { name: 'packageName', label: '项目包名', width: 220 },
      { name: 'storePageUrl', label: '商店页链接', width: 240 },
    ],
  },
  {
    key: 'domain',
    label: '域名信息',
    fields: [
      { name: 'domainInfoStatus', label: '域名信息状态', width: 150 },
      { name: 'admobPubId', label: 'Admob pub id', width: 160 },
      { name: 'domainUrl', label: '域名 URL', width: 220 },
      { name: 'privacyPolicyUrl', label: '隐私协议 URL', width: 240 },
      { name: 'termsUrl', label: '服务条款 URL', width: 240 },
    ],
  },
  {
    key: 'facebook',
    label: 'Facebook',
    fields: [
      { name: 'facebookInfoStatus', label: 'FB 信息状态', width: 140 },
      { name: 'facebookAppId', label: 'Facebook 应用 ID', width: 180 },
      { name: 'facebookAppToken', label: 'Facebook 应用 Token', width: 220 },
      { name: 'facebookKeyHash', label: 'Facebook 秘钥散列', width: 220 },
      { name: 'facebookClassName', label: 'Facebook 类名', width: 200 },
    ],
  },
  {
    key: 'admob',
    label: 'Admob',
    fields: [
      { name: 'admobAccountStatus', label: 'Admob 账号状态', width: 150 },
      { name: 'admobAppId', label: 'Admob 应用 ID', width: 180 },
      { name: 'admobAdIds', label: 'Admob 广告 ID 配置', multiline: true, width: 240 },
      { name: 'admobAppAdsTxt', label: 'Admob app-ads.txt 内容', multiline: true, width: 260 },
    ],
  },
  {
    key: 'firebase-yandex',
    label: 'Firebase / Yandex',
    fields: [
      { name: 'firebaseConfigNote', label: 'Firebase 配置说明', multiline: true, width: 220 },
      { name: 'yandexAccount', label: 'Yandex 账号', width: 160 },
      { name: 'yandexAdIds', label: 'Yandex 广告 ID 配置', multiline: true, width: 240 },
      { name: 'yandexAppAdsTxt', label: 'Yandex app-ads.txt 内容', multiline: true, width: 260 },
    ],
  },
  {
    key: 'remark',
    label: '备注',
    fields: [{ name: 'remark', label: '备注', multiline: true, width: 220 }],
  },
];

export const PROJECT_TABLE_FIELDS = PROJECT_FIELD_GROUPS.flatMap((group) => group.fields);

export const normalizeProjectFormValues = (values: Record<string, unknown>) => {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      typeof value === 'string' && value.trim() === '' ? null : value,
    ]),
  );
};
