import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Space, Typography } from 'antd';
import React, { useState } from 'react';
import { CARD_STYLE } from '../constants';

const { Title } = Typography;

type TrendChartCardProps = {
  title: string;
  children: React.ReactNode;
  hasData: boolean;
  emptyText: string;
  extra?: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
};

const TrendChartCard: React.FC<TrendChartCardProps> = ({
  title,
  children,
  hasData,
  emptyText,
  extra,
  collapsible,
  defaultCollapsed = false,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <Card style={CARD_STYLE} styles={{ body: { padding: 20 } }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: collapsed ? 0 : 8,
          flexWrap: 'wrap',
        }}
      >
        <Title level={5} style={{ margin: 0 }}>
          {title}
        </Title>
        <Space size={8} wrap>
          {extra}
          {collapsible ? (
            <Button
              size="small"
              type="text"
              icon={collapsed ? <DownOutlined /> : <UpOutlined />}
              onClick={() => setCollapsed((prev) => !prev)}
            >
              {collapsed ? '展开' : '收起'}
            </Button>
          ) : null}
        </Space>
      </div>
      {!collapsed ? (hasData ? children : <Empty description={emptyText} />) : null}
    </Card>
  );
};

export default TrendChartCard;
