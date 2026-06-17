import { Typography } from 'antd';
import React from 'react';

const { Paragraph, Text } = Typography;

const JsonBlock: React.FC<{ title?: string; value: unknown }> = ({ title, value }) => (
  <div style={{ marginBottom: 16 }}>
    {title ? (
      <Text strong style={{ display: 'block', marginBottom: 8 }}>
        {title}
      </Text>
    ) : null}
    <Paragraph
      copyable
      code
      style={{
        whiteSpace: 'pre-wrap',
        marginBottom: 0,
        maxHeight: 320,
        overflow: 'auto',
      }}
    >
      {JSON.stringify(value ?? null, null, 2)}
    </Paragraph>
  </div>
);

export default JsonBlock;
