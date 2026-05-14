import { GiftOutlined, RiseOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons';
import { Card, Col, Row, Statistic, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';
import { Area } from '@ant-design/plots';

interface StatisticsPanelProps {
  data?: API.InviteGiftCardStatistics;
  loading?: boolean;
  onViewLogs?: (ruleId: number, ruleName: string) => void;
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ data, loading, onViewLogs }) => {
  if (!data) return null;

  // 趋势图配置
  const chartConfig = {
    data: data.recent_days || [],
    xField: 'date',
    yField: 'count',
    height: 200,
    smooth: true,
    areaStyle: {
      fill: 'l(270) 0:#ffffff 0.5:#7ec2f3 1:#1890ff',
    },
    line: {
      color: '#1890ff',
    },
    xAxis: {
      label: {
        formatter: (text: string) => {
          const date = new Date(text);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        },
      },
    },
    yAxis: {
      label: {
        formatter: (text: string) => `${text}`,
      },
    },
    tooltip: {
      formatter: (datum: any) => {
        return { name: '发放数量', value: datum.count };
      },
    },
  };

  // Top规则表格列
  const topRulesColumns: ColumnsType<any> = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_, __, index) => {
        const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
        return (
          <Tag color={colors[index] || 'default'}>
            {index + 1}
          </Tag>
        );
      },
    },
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '发放次数',
      dataIndex: 'count',
      key: 'count',
      align: 'right',
      render: (count: number) => (
        <span style={{ fontWeight: 600, color: '#1890ff' }}>{count}</span>
      ),
    },
  ];

  return (
    <div style={{ marginBottom: 24 }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="规则总数"
              value={data.total_rules}
              prefix={<GiftOutlined />}
              suffix={
                <span style={{ fontSize: 14, color: '#52c41a', marginLeft: 8 }}>
                  启用 {data.active_rules}
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="累计发放"
              value={data.total_issued}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="已自动兑换"
              value={data.auto_redeemed_count}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={
                <span style={{ fontSize: 14, color: '#999', marginLeft: 8 }}>
                  {data.total_issued > 0
                    ? `${((data.auto_redeemed_count / data.total_issued) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="待兑换"
              value={data.pending_count}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 触发类型分布 & Top规则 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={8}>
          <Card title="触发类型分布" loading={loading}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="注册触发"
                  value={data.by_trigger_type.register}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="订单触发"
                  value={data.by_trigger_type.order_paid}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title="卡片发放记录" loading={loading}>
            <Table
              columns={topRulesColumns}
              dataSource={data.top_rules}
              pagination={false}
              size="small"
              rowKey="id"
              onRow={(record) => ({
                onClick: () => onViewLogs?.(record.id, record.name),
                style: { cursor: 'pointer' },
              })}
            />
          </Card>
        </Col>
      </Row>

      {/* 近7日趋势 */}
      <Card title="近7日发放趋势" loading={loading}>
        <Area {...chartConfig} />
      </Card>
    </div>
  );
};

export default StatisticsPanel;
