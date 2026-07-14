import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Space } from 'antd';
import React from 'react';

type Props = {
  name: string | (string | number)[];
  label?: string;
};

const AssetTagEditor: React.FC<Props> = ({ name, label = 'Tags' }) => (
  <Form.Item label={label}>
    <Form.List name={name}>
      {(fields, { add, remove }) => (
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          {fields.map((field) => (
            <Space
              key={field.key}
              align="start"
              style={{ display: 'flex', width: '100%' }}
            >
              <Form.Item
                name={[field.name, 'key']}
                style={{ flex: 1, marginBottom: 0 }}
                rules={[{ required: true, message: 'Enter tag key.' }]}
              >
                <Input placeholder="key" />
              </Form.Item>
              <Form.Item
                name={[field.name, 'value']}
                style={{ flex: 1, marginBottom: 0 }}
                rules={[{ required: true, message: 'Enter tag value.' }]}
              >
                <Input placeholder="value" />
              </Form.Item>
              <Button
                icon={<DeleteOutlined />}
                onClick={() => remove(field.name)}
              />
            </Space>
          ))}
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => add({ key: '', value: '' })}
          >
            Add Tag
          </Button>
        </Space>
      )}
    </Form.List>
  </Form.Item>
);

export default AssetTagEditor;
