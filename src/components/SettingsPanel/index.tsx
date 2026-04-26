import { Menu } from 'antd';
import React, { useEffect, useState } from 'react';

export interface SettingsPanelItem {
  key: string;
  label: string;
  content: React.ReactNode;
}

interface SettingsPanelProps {
  items: SettingsPanelItem[];
  activeKey?: string;
  style?: React.CSSProperties;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ items, activeKey, style }) => {
  const [selected, setSelected] = useState(activeKey ?? items[0]?.key);

  useEffect(() => {
    if (activeKey) setSelected(activeKey);
  }, [activeKey]);

  const current = items.find((i) => i.key === selected);

  return (
    <div style={{ display: 'flex', minHeight: 320, ...style }}>
      <div style={{ width: 180, borderRight: '1px solid #f0f0f0', flexShrink: 0 }}>
        <Menu
          mode="inline"
          selectedKeys={selected ? [selected] : []}
          onClick={({ key }) => setSelected(key)}
          items={items.map((i) => ({ key: i.key, label: i.label }))}
          style={{ border: 'none' }}
        />
      </div>
      <div style={{ flex: 1, padding: '16px 24px', overflow: 'auto' }}>
        {current?.content}
      </div>
    </div>
  );
};

export default SettingsPanel;
