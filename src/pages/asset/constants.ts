export const ACCOUNT_STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'disabled' },
  { label: '已删除', value: 'deleted' },
];

export const MACHINE_STATUS_OPTIONS = [
  { label: '运行中', value: 'active' },
  { label: '创建中', value: 'creating' },
  { label: '创建失败', value: 'create_failed' },
  { label: '已停机', value: 'stopped' },
  { label: '已销毁', value: 'destroyed' },
];

export const IP_STATUS_OPTIONS = [
  { label: '可用', value: 'available' },
  { label: '已绑定', value: 'bound' },
  { label: '已保留', value: 'reserved' },
  { label: '已释放', value: 'released' },
  { label: '未知', value: 'unknown' },
];

export const SSH_KEY_STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'disabled' },
  { label: '缺失', value: 'missing' },
  { label: '已删除', value: 'deleted' },
];

export const ACCOUNT_PROVIDER_ACTION_KEYS = ['test_connection'];
export const MACHINE_CREATE_ACTION_KEYS = [
  'create_machine',
  'create_instance',
  'create_from_provider',
];
export const MACHINE_IMPORT_ACTION_KEYS = [
  'import_machine',
  'import_instances',
  'import_from_provider',
];
export const MACHINE_SYNC_ACTION_KEYS = ['sync_machine', 'sync_instance'];
export const MACHINE_DESTROY_ACTION_KEYS = [
  'destroy_machine',
  'destroy_instance',
  'destroy_provider_instance',
];
export const IP_IMPORT_ACTION_KEYS = [
  'import_ip',
  'import_ips',
  'import_from_provider',
];
export const IP_SWITCH_PRIMARY_ACTION_KEYS = [
  'switch_primary_ip',
  'set_primary_ip',
];
export const SSH_IMPORT_ACTION_KEYS = [
  'import_ssh_key',
  'import_ssh_keys',
  'import_provider_key',
];
export const SSH_CREATE_ACTION_KEYS = ['create_ssh_key', 'create_provider_key'];
