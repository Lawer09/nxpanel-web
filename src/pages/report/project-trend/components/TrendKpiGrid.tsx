import { Card, Statistic } from 'antd';
import React from 'react';
import { CARD_STYLE } from '../constants';
import type { KpiItem } from '../types';

type TrendKpiGridProps = {
  items: KpiItem[];
};

const TrendKpiGrid: React.FC<TrendKpiGridProps> = ({ items }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 16,
    }}
  >
    {items.map((item) => (
      <Card key={item.key} style={CARD_STYLE} styles={{ body: { padding: 18 } }}>
        {item.customValue ? (
          <div>
            <div style={{ marginBottom: 8, color: 'rgba(0, 0, 0, 0.45)', fontSize: 14 }}>{item.title}</div>
            <div style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.2, color: 'rgba(0, 0, 0, 0.88)' }}>
              {item.customValue}
            </div>
          </div>
        ) : (
          <Statistic title={item.title} value={item.value as any} />
        )}
        {item.extra ? <div>{item.extra}</div> : null}
      </Card>
    ))}
  </div>
);

export default TrendKpiGrid;
