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
import IpsPanel from './panels/IpsPanel';
import MachineScriptsPanel from './panels/MachineScriptsPanel';
import MachinesPanel from './panels/MachinesPanel';
import ProviderAccountsPanel from './panels/ProviderAccountsPanel';
import SshKeysPanel from './panels/SshKeysPanel';
import SharedFilterBar from './SharedFilterBar';

const getAssetPath = (kind: AssetResourceKey) => {
  const pathMap: Record<AssetResourceKey, string> = {
    accounts: '/asset/provider-accounts',
    machines: '/asset/machines',
    ips: '/asset/ips',
    'ssh-keys': '/asset/ssh-keys',
    scripts: '/asset/scripts',
  };
  return pathMap[kind];
};

const getAssetTitle = (kind: AssetPageKind) => {
  const titleMap: Record<AssetPageKind, string> = {
    accounts: 'Provider Accounts',
    machines: 'Machines',
    ips: 'IPs',
    'ssh-keys': 'SSH Keys',
    scripts: 'Machine Scripts',
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
  const showSharedFilters = kind !== 'scripts';

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
    if (!showSharedFilters) {
      return;
    }
    setLoadingMeta(true);
    try {
      await Promise.all([
        loadProviders(),
        loadAccountsCatalog(),
        loadSshKeyCatalog(),
      ]);
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
    } finally {
      setLoadingMeta(false);
    }
  };

  useEffect(() => {
    if (showSharedFilters) {
      void reloadReferenceData();
    }
  }, [showSharedFilters]);

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
      description: `Task ID: ${ack.task_id}, status: ${ack.status || 'pending'}.`,
      actions: (
        <Button size="small" onClick={() => history.push(taskPath)}>
          View Task
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
      extra={[
        <Button
          key="reload-meta"
          icon={<ReloadOutlined />}
          loading={loadingMeta}
          onClick={() => void reloadReferenceData()}
        >
          Reload Reference Data
        </Button>,
      ]}
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
        {kind === 'machines' ? (
          <MachinesPanel
            filters={filters}
            providers={providers}
            accounts={accounts}
            sshKeys={sshKeys}
            onTaskAck={handleTaskAck}
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
