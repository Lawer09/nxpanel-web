export const ACCOUNT_STATUS_OPTIONS = [
  { label: 'active', value: 'active' },
  { label: 'disabled', value: 'disabled' },
  { label: 'deleted', value: 'deleted' },
];

export const MACHINE_STATUS_OPTIONS = [
  { label: 'active', value: 'active' },
  { label: 'creating', value: 'creating' },
  { label: 'create_failed', value: 'create_failed' },
  { label: 'stopped', value: 'stopped' },
  { label: 'destroyed', value: 'destroyed' },
];

export const IP_STATUS_OPTIONS = [
  { label: 'available', value: 'available' },
  { label: 'bound', value: 'bound' },
  { label: 'reserved', value: 'reserved' },
  { label: 'released', value: 'released' },
  { label: 'unknown', value: 'unknown' },
];

export const SSH_KEY_STATUS_OPTIONS = [
  { label: 'active', value: 'active' },
  { label: 'disabled', value: 'disabled' },
  { label: 'deleted', value: 'deleted' },
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
