import { ReloadOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { App, Button, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  listAssetProviderAccounts,
  listAssetProviders,
  listAssetSshKeys,
} from '@/services/asset-service/api';
import DevAuthGate from '../../dev/components/DevAuthGate';
import type {
  AssetPageKind,
  AssetResourceKey,
  JumpToResourceHandler,
  SharedFilters,
} from '../types';
import { buildAssetTaskDetailPath, normalizeDevErrorMessage } from '../utils';
import ImagesPanel from './panels/ImagesPanel';
import InstanceTypesPanel from './panels/InstanceTypesPanel';
import IpsPanel from './panels/IpsPanel';
import MachineScriptsPanel from './panels/MachineScriptsPanel';
import MachinesPanel from './panels/MachinesPanel';
import ProviderAccountsPanel from './panels/ProviderAccountsPanel';
import RegionsPanel from './panels/RegionsPanel';
import SecurityGroupsPanel from './panels/SecurityGroupsPanel';
import SshKeysPanel from './panels/SshKeysPanel';
import SubnetsPanel from './panels/SubnetsPanel';
import TagsPanel from './panels/TagsPanel';
import ZonesPanel from './panels/ZonesPanel';
import SharedFilterBar from './SharedFilterBar';

const getAssetPath = (kind: AssetResourceKey) => {
  const pathMap: Record<AssetResourceKey, string> = {
    accounts: '/asset/provider-accounts',
    regions: '/asset/regions',
    zones: '/asset/zones',
    'instance-types': '/asset/instance-types',
    images: '/asset/images',
    'security-groups': '/asset/security-groups',
    subnets: '/asset/subnets',
    tags: '/asset/tags',
    machines: '/asset/machines',
    ips: '/asset/ips',
    'ssh-keys': '/asset/ssh-keys',
    scripts: '/asset/scripts',
  };
  return pathMap[kind];
};

const getAssetTitle = (kind: AssetPageKind) => {
  const titleMap: Record<AssetPageKind, string> = {
    accounts: '供应商账号',
    regions: '区域',
    zones: '可用区',
    'instance-types': '实例规格',
    images: '镜像',
    'security-groups': '安全组',
    subnets: '子网',
    tags: '标签',
    machines: '机器',
    ips: 'IP',
    'ssh-keys': 'SSH 密钥',
    scripts: '脚本',
  };
  return titleMap[kind];
};

const AssetPageContent: React.FC<{ kind: AssetPageKind }> = ({ kind }) => {
  const { message, notification } = App.useApp();
  const [filters, setFilters] = useState<SharedFilters>({});
  const [providers, setProviders] = useState<API.AssetProvider[]>([]);
  const [accounts, setAccounts] = useState<API.AssetProviderAccount[]>([]);
  const [sshKeys, setSshKeys] = useState<API.AssetSshKey[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const isStandaloneResource =
    kind === 'regions' ||
    kind === 'zones' ||
    kind === 'instance-types' ||
    kind === 'images' ||
    kind === 'security-groups' ||
    kind === 'subnets' ||
    kind === 'tags';
  const showSharedFilters = kind !== 'scripts' && !isStandaloneResource;
  const shouldLoadProviders = showSharedFilters || isStandaloneResource;

  const loadProviders = async () => {
    const response = await listAssetProviders({ page: 1, page_size: 200 });
    setProviders(response.data?.items || []);
  };

  const loadAccountsCatalog = async () => {
    const response = await listAssetProviderAccounts({
      page: 1,
      page_size: 200,
    });
    setAccounts(response.data?.items || []);
  };

  const loadSshKeyCatalog = async () => {
    const response = await listAssetSshKeys({ page: 1, page_size: 200 });
    setSshKeys(response.data?.items || []);
  };

  const reloadReferenceData = async () => {
    if (!shouldLoadProviders) {
      return;
    }
    setLoadingMeta(true);
    try {
      if (showSharedFilters) {
        await Promise.all([
          loadProviders(),
          loadAccountsCatalog(),
          loadSshKeyCatalog(),
        ]);
        return;
      }
      await loadProviders();
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
    } finally {
      setLoadingMeta(false);
    }
  };

  useEffect(() => {
    if (shouldLoadProviders) {
      void reloadReferenceData();
    }
  }, [shouldLoadProviders]);

  useEffect(() => {
    const searchParams = new URLSearchParams(history.location.search);
    const accountId = searchParams.get('account_id');
    if (accountId) {
      const parsedAccountId = Number(accountId);
      if (Number.isFinite(parsedAccountId)) {
        setFilters((current) => ({ ...current, account_id: parsedAccountId }));
      }
    }
  }, []);

  const handleTaskAck = (ack: API.AssetTaskAck, title: string) => {
    const taskPath = buildAssetTaskDetailPath(ack.task_id);
    notification.success({
      message: title,
      description: `任务 ID：${ack.task_id}，状态：${ack.status || 'pending'}。`,
      actions: (
        <Button size="small" onClick={() => history.push(taskPath)}>
          查看任务
        </Button>
      ),
    });
    history.push(taskPath);
  };

  const handleJumpToResource: JumpToResourceHandler = (resource, accountId) => {
    history.push({
      pathname: getAssetPath(resource),
      search: accountId ? `account_id=${accountId}` : '',
    });
  };

  return (
    <PageContainer
      title={getAssetTitle(kind)}
      extra={
        shouldLoadProviders
          ? [
              <Button
                key="reload-meta"
                icon={<ReloadOutlined />}
                loading={loadingMeta}
                onClick={() => void reloadReferenceData()}
              >
                刷新引用数据
              </Button>,
            ]
          : undefined
      }
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {showSharedFilters ? (
          <SharedFilterBar
            activeResource={kind}
            filters={filters}
            providers={providers}
            accounts={accounts}
            onApply={setFilters}
            onReset={() => setFilters({})}
          />
        ) : null}
        {kind === 'accounts' ? (
          <ProviderAccountsPanel
            filters={filters}
            providers={providers}
            onAccountCatalogChanged={async () => {
              await Promise.all([loadAccountsCatalog(), loadSshKeyCatalog()]);
            }}
            onJumpToResource={handleJumpToResource}
          />
        ) : null}
        {kind === 'regions' ? <RegionsPanel providers={providers} /> : null}
        {kind === 'zones' ? <ZonesPanel providers={providers} /> : null}
        {kind === 'instance-types' ? (
          <InstanceTypesPanel providers={providers} />
        ) : null}
        {kind === 'images' ? <ImagesPanel providers={providers} /> : null}
        {kind === 'security-groups' ? (
          <SecurityGroupsPanel providers={providers} />
        ) : null}
        {kind === 'subnets' ? <SubnetsPanel providers={providers} /> : null}
        {kind === 'tags' ? <TagsPanel /> : null}
        {kind === 'machines' ? (
          <MachinesPanel
            filters={filters}
            providers={providers}
            accounts={accounts}
            sshKeys={sshKeys}
            onTaskAck={handleTaskAck}
            onResetFilters={() => setFilters({})}
            onApplyFilters={setFilters}
          />
        ) : null}
        {kind === 'ips' ? (
          <IpsPanel
            filters={filters}
            providers={providers}
            accounts={accounts}
            onTaskAck={handleTaskAck}
          />
        ) : null}
        {kind === 'ssh-keys' ? (
          <SshKeysPanel
            filters={filters}
            providers={providers}
            accounts={accounts}
            onTaskAck={async (ack, title) => {
              await loadSshKeyCatalog();
              handleTaskAck(ack, title);
            }}
          />
        ) : null}
        {kind === 'scripts' ? (
          <MachineScriptsPanel onTaskAck={handleTaskAck} />
        ) : null}
      </Space>
    </PageContainer>
  );
};

const AssetPageShell: React.FC<{ kind: AssetPageKind }> = ({ kind }) => (
  <DevAuthGate>
    <AssetPageContent kind={kind} />
  </DevAuthGate>
);

export default AssetPageShell;
