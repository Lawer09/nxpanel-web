import { Card, Empty, Typography } from 'antd';
import React from 'react';
import { CARD_STYLE } from '../constants';

const { Title } = Typography;

type TrendChartCardProps = {
  title: string;
  children: React.ReactNode;
  hasData: boolean;
  emptyText: string;
  extra?: React.ReactNode;
};

const TrendChartCard: React.FC<TrendChartCardProps> = ({ title, children, hasData, emptyText, extra }) => (
  <Card style={CARD_STYLE} styles={{ body: { padding: 20 } }}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
        flexWrap: 'wrap',
      }}
    >
      <Title level={5} style={{ margin: 0 }}>
        {title}
      </Title>
      {extra}
    </div>
    {hasData ? children : <Empty description={emptyText} />}
  </Card>
);

export default TrendChartCard;
