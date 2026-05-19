import React from 'react';
import { Row, Col } from 'antd';
import UsageDataTabs from './UsageDataTabs';
import TodaySyncJobList from './TodaySyncJobList';

const DetailSection: React.FC = () => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={16}>
        <UsageDataTabs />
      </Col>
      <Col xs={24} lg={8}>
        <TodaySyncJobList />
      </Col>
    </Row>
  );
};

export default DetailSection;
