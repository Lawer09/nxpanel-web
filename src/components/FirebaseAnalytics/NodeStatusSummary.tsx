import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Empty, List, Row, Space, Statistic, Tag, Typography } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import { getNodeStatusList } from '@/services/firebase-analytics/api';
import type { FirebaseAnalyticsFilter, NodeDiagnosisStatus, NodeStatusListItem } from '@/services/firebase-analytics/types';
import {
  formatDateTimeShort,
  formatNodeLabel,
  formatPercentPointGap,
  formatRate,
  getNodeDiagnosisMeta,
} from '@/utils/firebase-analytics';

export interface NodeStatusSummaryProps {
  filters: FirebaseAnalyticsFilter;
  viewHref: string;
}

const ABNORMAL_STATUSES: NodeDiagnosisStatus[] = [
  'connect_gap',
  'probe_only',
  'dual_risk',
  'session_risk',
  'probe_risk',
  'session_only',
];

const NodeStatusSummary: React.FC<NodeStatusSummaryProps> = ({ filters, viewHref }) => {
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<Record<NodeDiagnosisStatus, number>>({
    connect_gap: 0,
    probe_only: 0,
    dual_risk: 0,
    session_risk: 0,
    probe_risk: 0,
    session_only: 0,
    healthy: 0,
  });
  const [items, setItems] = useState<NodeStatusListItem[]>([]);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const requests = [
          getNodeStatusList({
            ...filters,
            page: 1,
            page_size: 6,
            sort_by: 'diagnosis_priority',
            order: 'asc',
          }),
          ...ABNORMAL_STATUSES.map((status) =>
            getNodeStatusList({
              ...filters,
              diagnosis_status: status,
              page: 1,
              page_size: 1,
            }),
          ),
        ];

        const [listRes, ...countResponses] = await Promise.all(requests);

        if (!active) {
          return;
        }

        const nextCounts: Record<NodeDiagnosisStatus, number> = {
          connect_gap: 0,
          probe_only: 0,
          dual_risk: 0,
          session_risk: 0,
          probe_risk: 0,
          session_only: 0,
          healthy: 0,
        };
        ABNORMAL_STATUSES.forEach((status, index) => {
          nextCounts[status] = countResponses[index]?.data?.total || 0;
        });
        setCounts(nextCounts);
        setItems((listRes.data?.items || []).filter((item) => item.diagnosis_status !== 'healthy'));
      } catch (error) {
        if (active) {
          setCounts({
            connect_gap: 0,
            probe_only: 0,
            dual_risk: 0,
            session_risk: 0,
            probe_risk: 0,
            session_only: 0,
            healthy: 0,
          });
          setItems([]);
        }
        console.error(error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [JSON.stringify(filters)]);

  const abnormalCount = useMemo(
    () =>
      ABNORMAL_STATUSES.reduce((total, status) => {
        return total + (counts[status] || 0);
      }, 0),
    [counts],
  );

  const highRiskCount = (counts.dual_risk || 0) + (counts.session_risk || 0) + (counts.probe_risk || 0);

  return (
    <Card
      title="节点状态摘要"
      loading={loading}
      variant="borderless"
      extra={
        <Button type="link" onClick={() => history.push(viewHref)} icon={<RightOutlined />}>
          查看节点状态
        </Button>
      }
      style={{
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
      }}
      styles={{ body: { padding: '16px 20px 20px' } }}
    >
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
        只保留节点总览信号和排查入口。完整的节点筛查、排序和单节点诊断已迁移到“节点状态”菜单。
      </Typography.Paragraph>

      <Alert
        showIcon
        type={abnormalCount > 0 ? 'warning' : 'success'}
        style={{ marginBottom: 16 }}
        message={
          abnormalCount > 0
            ? `当前筛选下发现 ${abnormalCount} 个异常节点，建议进入节点状态页继续筛查。`
            : '当前筛选下未发现明显异常节点。'
        }
        description={
          abnormalCount > 0
            ? `其中 ${counts.probe_only || 0} 个仅探测未连接，${counts.connect_gap || 0} 个探测正常但连接偏差，${highRiskCount} 个高风险节点。`
            : '可继续关注趋势波动，或切换更细的时间窗做排查。'
        }
      />

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xl={6} sm={12} xs={24}>
          <div style={{ borderRadius: 12, padding: 16, background: '#fff7ed' }}>
            <Statistic title="异常节点" value={abnormalCount} suffix="个" valueStyle={{ color: '#d97706' }} />
          </div>
        </Col>
        <Col xl={6} sm={12} xs={24}>
          <div style={{ borderRadius: 12, padding: 16, background: '#fff1f2' }}>
            <Statistic
              title="连接偏差"
              value={counts.connect_gap || 0}
              suffix="个"
              valueStyle={{ color: '#dc2626' }}
            />
          </div>
        </Col>
        <Col xl={6} sm={12} xs={24}>
          <div style={{ borderRadius: 12, padding: 16, background: '#fefce8' }}>
            <Statistic
              title="仅探测未连接"
              value={counts.probe_only || 0}
              suffix="个"
              valueStyle={{ color: '#ca8a04' }}
            />
          </div>
        </Col>
        <Col xl={6} sm={12} xs={24}>
          <div style={{ borderRadius: 12, padding: 16, background: '#fdf2f8' }}>
            <Statistic title="高风险" value={highRiskCount} suffix="个" valueStyle={{ color: '#be123c' }} />
          </div>
        </Col>
      </Row>

      {items.length > 0 ? (
        <List
          dataSource={items.slice(0, 5)}
          renderItem={(item) => {
            const diagnosisMeta = getNodeDiagnosisMeta(item.diagnosis_status);
            const label = formatNodeLabel(item);
            return (
              <List.Item
                actions={[
                  <Button key="detail" type="link" onClick={() => history.push(viewHref)}>
                    去排查
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space size={8}>
                      <span>{label.title}</span>
                      <Tag color={diagnosisMeta.color}>{diagnosisMeta.label}</Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      <Typography.Text type="secondary">{label.meta || '无节点元信息'}</Typography.Text>
                      <Typography.Text type="secondary">
                        探测 {formatRate(item.probe_success_rate)} / 连接 {formatRate(item.session_success_rate)} / 落差{' '}
                        {formatPercentPointGap(item.rate_gap)}
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        最近探测 {formatDateTimeShort(item.last_probe_received_at)} / 最近连接{' '}
                        {formatDateTimeShort(item.last_session_received_at)}
                      </Typography.Text>
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      ) : (
        <Empty description="当前筛选下暂无异常节点预览" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Card>
  );
};

export default NodeStatusSummary;
