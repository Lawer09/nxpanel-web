import { Modal, Spin, Input, Button, Space, Typography, App, Avatar, Tag } from 'antd';
import { SendOutlined, UserOutlined, CustomerServiceOutlined } from '@ant-design/icons';
import React, { useEffect, useRef, useState } from 'react';
import { getTicketDetail, replyTicket } from '@/services/ticket/api';

const { TextArea } = Input;
const { Text } = Typography;

interface TicketDetailModalProps {
  open: boolean;
  ticket?: API.TicketItem;
  onClose: () => void;
  onSuccess?: () => void;
}

const formatTimestamp = (timestamp?: number) => {
  if (!timestamp) return '';
  const d = new Date(timestamp * 1000);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (isToday) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
};

const formatFullTime = (timestamp?: number) => {
  if (!timestamp) return '';
  return new Date(timestamp * 1000).toLocaleString('zh-CN');
};

const LEVEL_COLOR: Record<string, string> = {
  '0': 'default',
  '1': 'warning',
  '2': 'error',
};
const LEVEL_TEXT: Record<string, string> = {
  '0': '低',
  '1': '中',
  '2': '高',
};

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  open,
  ticket,
  onClose,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<API.TicketDetail | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && ticket?.id) {
      loadDetail();
    } else {
      setDetail(null);
      setReplyContent('');
    }
  }, [open, ticket?.id]);

  useEffect(() => {
    // 自动滚动到底部
    if (detail?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [detail?.messages]);

  const loadDetail = async () => {
    if (!ticket?.id) return;

    setLoading(true);
    try {
      const res = await getTicketDetail({ id: ticket.id });
      if (res.code === 0 && res.data) {
        setDetail(res.data);
      } else {
        message.error(res.msg || '获取工单详情失败');
      }
    } catch (error) {
      message.error('获取工单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!ticket?.id) return;
    if (!replyContent.trim()) {
      message.warning('请输入回复内容');
      return;
    }

    setSubmitting(true);
    try {
      const res = await replyTicket({
        id: ticket.id,
        message: replyContent.trim(),
      });

      if (res.code === 0) {
        message.success('回复成功');
        setReplyContent('');
        await loadDetail();
        onSuccess?.();
      } else {
        message.error(res.msg || '回复失败');
      }
    } catch (error) {
      message.error('回复失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleReply();
    }
  };

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      width={720}
      footer={null}
      destroyOnHidden
      styles={{ body: { padding: 0, height: 600 } }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: 600 }}>
          {/* 顶部标题栏 */}
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid #f0f0f0',
              backgroundColor: '#fafafa',
            }}
          >
            <Space>
              <Text strong style={{ fontSize: 16 }}>
                {ticket?.subject}
              </Text>
              <Tag color={LEVEL_COLOR[ticket?.level || '0']}>
                {LEVEL_TEXT[ticket?.level || '0']}
              </Tag>
              {ticket?.status === 0 ? (
                <Tag color="success">开启</Tag>
              ) : (
                <Tag color="default">已关闭</Tag>
              )}
            </Space>
            <div style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                用户：{detail?.user?.email || '-'}
              </Text>
            </div>
          </div>

          {/* 消息列表区域 - 微信风格聊天记录 */}
          <Spin spinning={loading}>
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 24px',
                backgroundColor: '#f5f5f5',
              }}
            >
              {detail?.messages && detail.messages.length > 0 ? (
                <>
                  {detail.messages.map((msg, index) => {
                    // 判断是否显示日期分隔
                    const showDateDivider =
                      index === 0 ||
                      new Date(msg.created_at * 1000).toDateString() !==
                        new Date(detail.messages![index - 1].created_at * 1000).toDateString();

                    return (
                      <React.Fragment key={msg.id}>
                        {showDateDivider && (
                          <div
                            style={{
                              textAlign: 'center',
                              margin: '16px 0 8px',
                            }}
                          >
                            <Text
                              type="secondary"
                              style={{
                                fontSize: 12,
                                padding: '4px 12px',
                                backgroundColor: 'rgba(0,0,0,0.05)',
                                borderRadius: 4,
                              }}
                            >
                              {new Date(msg.created_at * 1000).toLocaleDateString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                              })}
                            </Text>
                          </div>
                        )}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: msg.is_from_admin ? 'flex-end' : 'flex-start',
                            marginBottom: 12,
                          }}
                        >
                          <div
                            style={{
                              maxWidth: '70%',
                              display: 'flex',
                              flexDirection: msg.is_from_admin ? 'row-reverse' : 'row',
                              gap: 8,
                              alignItems: 'flex-start',
                            }}
                          >
                            <Avatar
                              style={{
                                backgroundColor: msg.is_from_admin ? '#1890ff' : '#87d068',
                                flexShrink: 0,
                              }}
                              icon={<UserOutlined />}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  justifyContent: msg.is_from_admin ? 'flex-end' : 'flex-start',
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 12,
                                    color: '#999',
                                  }}
                                >
                                  {msg.is_from_admin ? '管理员' : detail.user?.email || '用户'}
                                </Text>
                                <Text
                                  type="secondary"
                                  style={{
                                    fontSize: 11,
                                  }}
                                >
                                  {new Date(msg.created_at * 1000).toLocaleTimeString('zh-CN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Text>
                              </div>
                              <div
                                style={{
                                  padding: '10px 14px',
                                  borderRadius: msg.is_from_admin ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                                  backgroundColor: msg.is_from_admin ? '#1890ff' : '#fff',
                                  color: msg.is_from_admin ? '#fff' : '#000',
                                  wordBreak: 'break-word',
                                  whiteSpace: 'pre-wrap',
                                  lineHeight: 1.6,
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                }}
                              >
                                {msg.message}
                              </div>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 0',
                    color: '#999',
                  }}
                >
                  暂无消息
                </div>
              )}
            </div>
          </Spin>

          {/* 底部输入区域 */}
          {detail?.status === 0 ? (
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #f0f0f0',
                backgroundColor: '#fff',
              }}
            >
              <Space.Compact style={{ width: '100%' }}>
                <TextArea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="输入回复内容... (Ctrl+Enter 发送)"
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  maxLength={2000}
                  style={{ resize: 'none' }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleReply}
                  loading={submitting}
                  disabled={!replyContent.trim()}
                  style={{ height: 'auto' }}
                >
                  发送
                </Button>
              </Space.Compact>
              <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
                {replyContent.length}/2000
              </Text>
            </div>
          ) : (
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #f0f0f0',
                backgroundColor: '#fafafa',
                textAlign: 'center',
              }}
            >
              <Text type="secondary">工单已关闭，无法回复</Text>
            </div>
          )}
      </div>
    </Modal>
  );
};

export default TicketDetailModal;
