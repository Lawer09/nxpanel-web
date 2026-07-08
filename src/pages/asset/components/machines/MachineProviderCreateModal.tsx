import { Alert, App, Form, Input, InputNumber, Modal, Select, Space } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  createAssetMachine,
  listAssetImages,
  listAssetInstanceTypes,
  listAssetIps,
  listAssetSecurityGroups,
  listAssetSubnets,
  listAssetZones,
  retryAssetMachineProviderCreateV2,
} from '@/services/asset-service/api';
import AssetTagEditor from '../AssetTagEditor';
import {
  normalizeAssetTags,
  normalizeDevErrorMessage,
} from '../../utils';

type MachineProviderCreateFormValues = {
  account_id?: number;
  name?: string;
  count?: number;
  client_request_id?: string;
  asset_zone_id?: number;
  asset_image_id?: number;
  asset_instance_type_id?: number;
  asset_subnet_id?: number;
  asset_ip_id?: number;
  asset_security_group_ids?: number[];
  tags?: API.AssetTagItem[];
  disk?: {
    system_size_gb?: number;
  };
  login?: {
    auth_type?: 'password' | 'provider_key';
    ssh_key_id?: number;
    username?: string;
    password?: string;
  };
  time_zone?: string;
};

type Props = {
  open: boolean;
  mode: 'create' | 'retry';
  accounts: API.AssetProviderAccount[];
  sshKeys: API.AssetSshKey[];
  retrying?: API.AssetMachine | null;
  initialValues?: Partial<API.AssetMachineProviderCreateParams>;
  onCancel: () => void;
  onSuccess: (ack: API.AssetTaskAck, title: string) => void;
};

const trimText = (value?: string) => {
  const next = value?.trim();
  return next || undefined;
};

const MachineProviderCreateModal: React.FC<Props> = ({
  open,
  mode,
  accounts,
  sshKeys,
  retrying,
  initialValues,
  onCancel,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<MachineProviderCreateFormValues>();
  const [saving, setSaving] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [zones, setZones] = useState<API.AssetZone[]>([]);
  const [images, setImages] = useState<API.AssetImage[]>([]);
  const [instanceTypes, setInstanceTypes] = useState<API.AssetInstanceType[]>([]);
  const [subnets, setSubnets] = useState<API.AssetSubnet[]>([]);
  const [securityGroups, setSecurityGroups] = useState<API.AssetSecurityGroup[]>([]);
  const [ips, setIps] = useState<API.AssetIp[]>([]);

  const accountId = Form.useWatch('account_id', form);
  const zoneId = Form.useWatch('asset_zone_id', form);
  const authType = Form.useWatch(['login', 'auth_type'], form);

  const accountMap = useMemo(
    () => new Map(accounts.map((item) => [item.id, item])),
    [accounts],
  );
  const selectedAccount = accountId ? accountMap.get(accountId) : undefined;
  const selectedZone = useMemo(
    () => zones.find((item) => item.id === zoneId),
    [zoneId, zones],
  );

  const availableSshKeys = useMemo(
    () =>
      sshKeys.filter(
        (item) =>
          item.has_private_key &&
          (!accountId || item.account_id === accountId || item.account_id == null),
      ),
    [accountId, sshKeys],
  );

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setZones([]);
      setImages([]);
      setInstanceTypes([]);
      setSubnets([]);
      setSecurityGroups([]);
      setIps([]);
      setSaving(false);
      return;
    }

    form.setFieldsValue({
      count: 1,
      time_zone: 'Asia/Shanghai',
      login: {
        auth_type: 'provider_key',
      },
      tags: [],
      ...initialValues,
      ...(mode === 'retry' && retrying
        ? {
            account_id: retrying.account_id || undefined,
            name: retrying.name || undefined,
            asset_zone_id: retrying.asset_zone_id || undefined,
            asset_image_id: retrying.asset_image_id || undefined,
            asset_instance_type_id: retrying.asset_instance_type_id || undefined,
            asset_subnet_id: retrying.asset_subnet_id || undefined,
            asset_ip_id: retrying.asset_ip_id || undefined,
            asset_security_group_ids: retrying.asset_security_group_ids || [],
            disk: {
              system_size_gb: retrying.system_disk_size_gb || undefined,
            },
            tags: retrying.tags || [],
          }
        : {}),
    });
  }, [form, initialValues, mode, open, retrying]);

  useEffect(() => {
    if (!open || !selectedAccount?.provider_code) {
      return;
    }

    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const [zonesRes, securityGroupsRes, ipsRes] = await Promise.all([
          listAssetZones({
            page: 1,
            page_size: 200,
            provider_code: selectedAccount.provider_code,
          }),
          listAssetSecurityGroups({
            page: 1,
            page_size: 200,
            provider_code: selectedAccount.provider_code,
          }),
          listAssetIps({
            page: 1,
            page_size: 200,
            provider_code: selectedAccount.provider_code,
            account_id: selectedAccount.id,
          }),
        ]);
        setZones(zonesRes.data?.items || []);
        setSecurityGroups(securityGroupsRes.data?.items || []);
        setIps(ipsRes.data?.items || []);
      } catch (error: any) {
        message.error(normalizeDevErrorMessage(error));
      } finally {
        setLoadingOptions(false);
      }
    };

    void loadOptions();
  }, [message, open, selectedAccount]);

  useEffect(() => {
    if (!open || !selectedAccount?.provider_code || !zoneId) {
      setImages([]);
      setInstanceTypes([]);
      setSubnets([]);
      return;
    }

    const loadZoneScopedOptions = async () => {
      setLoadingOptions(true);
      try {
        const regionId =
          selectedZone?.region_ids && selectedZone.region_ids.length > 0
            ? String(selectedZone.region_ids[0])
            : undefined;
        const [imagesRes, instanceTypesRes, subnetsRes] = await Promise.all([
          listAssetImages({
            page: 1,
            page_size: 200,
            provider_code: selectedAccount.provider_code,
            zone_id: String(zoneId),
          }),
          listAssetInstanceTypes({
            page: 1,
            page_size: 200,
            provider_code: selectedAccount.provider_code,
            zone_id: String(zoneId),
          }),
          listAssetSubnets({
            page: 1,
            page_size: 200,
            provider_code: selectedAccount.provider_code,
            region_id: regionId,
          }),
        ]);
        setImages(imagesRes.data?.items || []);
        setInstanceTypes(instanceTypesRes.data?.items || []);
        setSubnets(subnetsRes.data?.items || []);
      } catch (error: any) {
        message.error(normalizeDevErrorMessage(error));
      } finally {
        setLoadingOptions(false);
      }
    };

    void loadZoneScopedOptions();
  }, [message, open, selectedAccount, selectedZone, zoneId]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: API.AssetMachineProviderCreateParams = {
        account_id: values.account_id!,
        name: values.name!.trim(),
        count: values.count || 1,
        client_request_id: trimText(values.client_request_id),
        asset_zone_id: values.asset_zone_id!,
        asset_image_id: values.asset_image_id!,
        asset_instance_type_id: values.asset_instance_type_id!,
        asset_subnet_id: values.asset_subnet_id!,
        asset_ip_id: values.asset_ip_id,
        asset_security_group_ids:
          values.asset_security_group_ids && values.asset_security_group_ids.length > 0
            ? values.asset_security_group_ids
            : undefined,
        tags: normalizeAssetTags(values.tags),
        disk: {
          system_size_gb: values.disk?.system_size_gb!,
        },
        login: {
          auth_type: values.login?.auth_type || 'provider_key',
          ssh_key_id: values.login?.ssh_key_id,
          username: trimText(values.login?.username),
          password: trimText(values.login?.password),
        },
        time_zone: trimText(values.time_zone),
      };

      setSaving(true);
      if (mode === 'retry' && retrying) {
        const response = await retryAssetMachineProviderCreateV2(retrying.id, {
          name: payload.name,
          asset_zone_id: payload.asset_zone_id,
          asset_image_id: payload.asset_image_id,
          asset_instance_type_id: payload.asset_instance_type_id,
          asset_subnet_id: payload.asset_subnet_id,
          asset_ip_id: payload.asset_ip_id,
          asset_security_group_ids: payload.asset_security_group_ids,
          tags: payload.tags,
          disk: payload.disk,
          login: payload.login,
          time_zone: payload.time_zone,
        });
        onSuccess(response.data, `Machine #${retrying.id} retry submitted`);
      } else {
        const response = await createAssetMachine(payload);
        onSuccess(response.data, 'Machine create submitted');
      }
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={mode === 'retry' ? 'Retry provider create' : 'Create machine'}
      open={open}
      width={920}
      destroyOnHidden
      confirmLoading={saving}
      onCancel={onCancel}
      onOk={() => void handleSubmit()}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="Create uses local asset references"
          description="Zone, image, instance type, subnet, IP, security group, and SSH key are all selected from local asset tables. Public billing and internet custom fields are no longer submitted here."
        />
        <Form<MachineProviderCreateFormValues> form={form} layout="vertical">
          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item
              name="account_id"
              label="Account"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Select an account.' }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={accounts.map((item) => ({
                  label: `${item.name} (#${item.id})`,
                  value: item.id,
                }))}
                disabled={mode === 'retry'}
              />
            </Form.Item>
            {mode === 'create' ? (
              <Form.Item name="count" label="Count" style={{ width: 140 }}>
                <InputNumber min={1} max={100} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            ) : null}
          </Space>

          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item
              name="name"
              label="Name"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Enter machine name.' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="client_request_id" label="Client Request ID" style={{ flex: 1 }}>
              <Input disabled={mode === 'retry'} />
            </Form.Item>
          </Space>

          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item
              name="asset_zone_id"
              label="Zone"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Select a zone.' }]}
            >
              <Select
                loading={loadingOptions}
                showSearch
                optionFilterProp="label"
                options={zones.map((item) => ({
                  label: `${item.city_name || item.provider_zone_id || item.id} (#${item.id})`,
                  value: item.id,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="asset_image_id"
              label="Image"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Select an image.' }]}
            >
              <Select
                loading={loadingOptions}
                showSearch
                optionFilterProp="label"
                options={images.map((item) => ({
                  label: `${item.name || item.provider_image_id || item.id} (#${item.id})`,
                  value: item.id,
                }))}
              />
            </Form.Item>
          </Space>

          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item
              name="asset_instance_type_id"
              label="Instance Type"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Select an instance type.' }]}
            >
              <Select
                loading={loadingOptions}
                showSearch
                optionFilterProp="label"
                options={instanceTypes.map((item) => ({
                  label: `${item.name || item.provider_instance_type_id || item.id} (#${item.id})`,
                  value: item.id,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="asset_subnet_id"
              label="Subnet"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Select a subnet.' }]}
            >
              <Select
                loading={loadingOptions}
                showSearch
                optionFilterProp="label"
                options={subnets.map((item) => ({
                  label: `${item.provider_subnet_id || item.cidr_block || item.id} (#${item.id})`,
                  value: item.id,
                }))}
              />
            </Form.Item>
          </Space>

          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item name="asset_ip_id" label="IP" style={{ flex: 1 }}>
              <Select
                allowClear
                loading={loadingOptions}
                showSearch
                optionFilterProp="label"
                options={ips.map((item) => ({
                  label: `${item.ip || item.external_ip_id || item.id} (#${item.id})`,
                  value: item.id,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="asset_security_group_ids"
              label="Security Groups"
              style={{ flex: 1 }}
            >
              <Select
                allowClear
                mode="multiple"
                loading={loadingOptions}
                optionFilterProp="label"
                options={securityGroups.map((item) => ({
                  label: `${item.name || item.provider_security_group_id || item.id} (#${item.id})`,
                  value: item.id,
                }))}
              />
            </Form.Item>
          </Space>

          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item
              name={['disk', 'system_size_gb']}
              label="System Disk (GB)"
              style={{ width: 220 }}
              rules={[{ required: true, message: 'Enter system disk size.' }]}
            >
              <InputNumber min={1} precision={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="time_zone" label="Time Zone" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>

          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item
              name={['login', 'auth_type']}
              label="Login Auth Type"
              style={{ width: 220 }}
              rules={[{ required: true, message: 'Select login auth type.' }]}
            >
              <Select
                options={[
                  { label: 'Provider SSH Key', value: 'provider_key' },
                  { label: 'Password', value: 'password' },
                ]}
              />
            </Form.Item>
            {authType === 'provider_key' ? (
              <Form.Item
                name={['login', 'ssh_key_id']}
                label="SSH Key"
                style={{ flex: 1 }}
                rules={[{ required: true, message: 'Select an SSH key.' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={availableSshKeys.map((item) => ({
                    label: `${item.name || item.external_key_id || item.id} (#${item.id})`,
                    value: item.id,
                  }))}
                />
              </Form.Item>
            ) : (
              <Space size={16} align="start" style={{ flex: 1 }}>
                <Form.Item
                  name={['login', 'username']}
                  label="Username"
                  style={{ flex: 1 }}
                  rules={[{ required: true, message: 'Enter username.' }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name={['login', 'password']}
                  label="Password"
                  style={{ flex: 1 }}
                  rules={[{ required: true, message: 'Enter password.' }]}
                >
                  <Input.Password />
                </Form.Item>
              </Space>
            )}
          </Space>

          <AssetTagEditor name="tags" label="Tags" />
        </Form>
      </Space>
    </Modal>
  );
};

export default MachineProviderCreateModal;
