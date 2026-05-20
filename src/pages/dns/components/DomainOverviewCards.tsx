import { ApiOutlined, DatabaseOutlined } from '@ant-design/icons';
import { Card, Col, Row, Space, Statistic, Typography } from 'antd';
import React from 'react';

export interface DnsOverviewData {
  domainTotal: number;
  availableDomains: number;
  missingDomains: number;
  providerTotal: number;
  accountTotal: number;
}

interface DomainOverviewCardsProps {
  mode: 'domains' | 'bindings' | 'providers' | 'accounts';
  loading: boolean;
  overview: DnsOverviewData;
  onModeChange: (mode: 'domains' | 'providers' | 'accounts') => void;
}

const DomainOverviewCards: React.FC<DomainOverviewCardsProps> = ({
  mode,
  loading,
  overview,
  onModeChange,
}) => {
  return (
    <Row gutter={12} style={{ marginBottom: 16 }} align="stretch">
      <Col span={8} style={{ display: 'flex' }}>
        <Card
          hoverable
          loading={loading}
          className={`overview-card ${mode === 'domains' ? 'overview-card-active' : ''}`}
          style={{ width: '100%' }}
          onClick={() => onModeChange('domains')}
        >
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            <Statistic title="域名池" value={overview.domainTotal} prefix={<DatabaseOutlined />} />
            <Space size={16} wrap>
              <Typography.Text type="secondary">可用 {overview.availableDomains}</Typography.Text>
              <Typography.Text type="secondary">缺失 {overview.missingDomains}</Typography.Text>
            </Space>
          </Space>
        </Card>
      </Col>
      <Col span={8} style={{ display: 'flex' }}>
        <Card
          hoverable
          loading={loading}
          className={`overview-card ${mode === 'providers' ? 'overview-card-active' : ''}`}
          style={{ width: '100%' }}
          onClick={() => onModeChange('providers')}
        >
          <Statistic title="Provider" value={overview.providerTotal} prefix={<ApiOutlined />} />
        </Card>
      </Col>
      <Col span={8} style={{ display: 'flex' }}>
        <Card
          hoverable
          loading={loading}
          className={`overview-card ${mode === 'accounts' ? 'overview-card-active' : ''}`}
          style={{ width: '100%' }}
          onClick={() => onModeChange('accounts')}
        >
          <Statistic title="Provider 账号" value={overview.accountTotal} prefix={<ApiOutlined />} />
        </Card>
      </Col>
    </Row>
  );
};

export default DomainOverviewCards;
