import React from 'react';
import { Row, Col } from 'antd';
import TrafficTrendChart from './TrafficTrendChart';
import TrafficRankingCard from './TrafficRankingCard';

const AnalysisSection: React.FC = () => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={14}>
        <TrafficTrendChart />
      </Col>
      <Col xs={24} lg={10}>
        <TrafficRankingCard />
      </Col>
    </Row>
  );
};

export default AnalysisSection;
