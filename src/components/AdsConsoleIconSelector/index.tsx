import * as Icons from '@ant-design/icons';
import {ClearOutlined, SearchOutlined} from '@ant-design/icons';
import {Empty, Input, Modal, Tooltip} from 'antd';
import React, {useMemo, useState} from 'react';

/** 常用 Ant Design 图标列表 */
const ICON_LIST = [
  'DashboardOutlined', 'HomeOutlined', 'SettingOutlined', 'UserOutlined',
  'TeamOutlined', 'LockOutlined', 'SafetyOutlined', 'AppstoreOutlined',
  'MenuOutlined', 'FileOutlined', 'FolderOutlined', 'FolderOpenOutlined',
  'DatabaseOutlined', 'CloudOutlined', 'DesktopOutlined', 'BarsOutlined',
  'TableOutlined', 'FormOutlined', 'LineChartOutlined', 'BarChartOutlined',
  'PieChartOutlined', 'AreaChartOutlined', 'RadarChartOutlined', 'AimOutlined',
  'ShoppingOutlined', 'ShoppingCartOutlined', 'TagOutlined', 'TagsOutlined',
  'FileTextOutlined', 'ProfileOutlined', 'MoneyCollectOutlined', 'DollarOutlined',
  'CreditCardOutlined', 'TransactionOutlined', 'BankOutlined', 'ShopOutlined',
  'GlobalOutlined', 'ApiOutlined', 'CodeOutlined', 'BugOutlined',
  'ToolOutlined', 'ExperimentOutlined', 'RocketOutlined', 'BellOutlined',
  'MailOutlined', 'MessageOutlined', 'NotificationOutlined', 'CalendarOutlined',
  'ClockCircleOutlined', 'HistoryOutlined', 'ScheduleOutlined', 'CheckCircleOutlined',
  'InfoCircleOutlined', 'AlertOutlined', 'StarOutlined', 'HeartOutlined',
  'FireOutlined', 'ThunderboltOutlined', 'TrophyOutlined', 'ApartmentOutlined',
  'BranchesOutlined', 'ClusterOutlined', 'FundOutlined', 'HeatMapOutlined',
  'ProjectOutlined', 'ReadOutlined', 'SolutionOutlined', 'InteractionOutlined',
  'ImportOutlined', 'ExportOutlined', 'SearchOutlined', 'FilterOutlined',
  'OrderedListOutlined', 'KeyOutlined', 'UnlockOutlined', 'EyeOutlined',
  'EditOutlined', 'PrinterOutlined', 'BuildOutlined', 'CrownOutlined',
  'InboxOutlined', 'GiftOutlined', 'TruckOutlined', 'EnvironmentOutlined',
  'CompassOutlined', 'PhoneOutlined', 'VideoCameraOutlined', 'MobileOutlined',
  'MonitorOutlined', 'WifiOutlined', 'PoweroffOutlined', 'FileAddOutlined',
  'FileDoneOutlined', 'FileExcelOutlined', 'FilePdfOutlined', 'PictureOutlined',
  'CameraOutlined', 'AudioOutlined', 'SoundOutlined', 'CustomerServiceOutlined',
  'CarOutlined', 'IdcardOutlined', 'AuditOutlined', 'ContactsOutlined',
  'ReconciliationOutlined', 'AccountBookOutlined', 'InsuranceOutlined',
  'SafetyCertificateOutlined', 'RedEnvelopeOutlined', 'NodeIndexOutlined',
  'DeploymentUnitOutlined', 'RobotOutlined', 'QrcodeOutlined', 'BarcodeOutlined',
  'ScanOutlined', 'LinkOutlined', 'TabletOutlined', 'LaptopOutlined',
  'CloudServerOutlined', 'CloudUploadOutlined', 'CloudDownloadOutlined',
  'CloudSyncOutlined', 'SyncOutlined', 'ReloadOutlined', 'PlusSquareOutlined',
  'MinusSquareOutlined', 'SignatureOutlined', 'BorderOutlined', 'AppstoreAddOutlined',
];

export interface IconSelectorProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
}

const IconSelector: React.FC<IconSelectorProps> = ({
                                                     value,
                                                     onChange,
                                                     placeholder = '点击选择图标',
                                                   }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return ICON_LIST;
    const q = search.toLowerCase();
    return ICON_LIST.filter((name) => name.toLowerCase().includes(q));
  }, [search]);

  const SelectedIcon = value ? (Icons as any)[value] : null;

  const handleSelect = (name: string) => {
    onChange?.(name);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(undefined);
  };

  return (
    <>
      <div
        style={{
          border: '1px solid #d9d9d9',
          borderRadius: 6,
          padding: '4px 11px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 32,
          background: '#fff',
          transition: 'border-color 0.2s',
        }}
        onClick={() => setOpen(true)}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#4096ff')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#d9d9d9')}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          {SelectedIcon ? (
            <>
              <SelectedIcon style={{fontSize: 16}}/>
              <span style={{fontSize: 13}}>{value}</span>
            </>
          ) : (
            <span style={{color: '#bfbfbf'}}>{placeholder}</span>
          )}
        </div>
        {value && (
          <ClearOutlined
            style={{color: '#999', fontSize: 12}}
            onClick={handleClear}
          />
        )}
      </div>

      <Modal
        title="选择图标"
        open={open}
        onCancel={() => {
          setOpen(false);
          setSearch('');
        }}
        footer={null}
        width={700}
        styles={{body: {paddingTop: 8}}}
      >
        <Input
          prefix={<SearchOutlined/>}
          placeholder="搜索图标名称，如 User、Setting、Home..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{marginBottom: 12}}
          allowClear
        />
        <div style={{height: 400, overflowY: 'auto'}}>
          {filtered.length === 0 ? (
            <Empty description="没有找到匹配的图标" style={{marginTop: 60}}/>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))',
                gap: 6,
              }}
            >
              {filtered.map((name) => {
                const IconComp = (Icons as any)[name];
                if (!IconComp) return null;
                const isSelected = value === name;
                return (
                  <Tooltip key={name} title={name} mouseEnterDelay={0.6}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px 4px 6px',
                        border: isSelected ? '2px solid #1677ff' : '1px solid #f0f0f0',
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: isSelected ? '#e6f4ff' : '#fafafa',
                        gap: 4,
                        transition: 'all 0.15s',
                      }}
                      onClick={() => handleSelect(name)}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = '#f0f7ff';
                          e.currentTarget.style.borderColor = '#91caff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = '#fafafa';
                          e.currentTarget.style.borderColor = '#f0f0f0';
                        }
                      }}
                    >
                      <IconComp style={{fontSize: 22, color: isSelected ? '#1677ff' : '#555'}}/>
                      <span
                        style={{
                          fontSize: 10,
                          color: isSelected ? '#1677ff' : '#888',
                          maxWidth: 68,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          textAlign: 'center',
                        }}
                      >
                        {name.replace(/Outlined|Filled|TwoTone$/, '')}
                      </span>
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default IconSelector;
