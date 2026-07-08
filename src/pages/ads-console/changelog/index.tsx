import {CheckCircleOutlined, ClockCircleOutlined, DownOutlined, UpOutlined,} from '@ant-design/icons';
import {PageContainer} from '@ant-design/pro-components';
import {Affix, Anchor, Badge, Button, Empty, Skeleton, Space, Tag, Typography} from 'antd';
import dayjs from 'dayjs';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import AdsConsoleMarkdownRenderer from '@/components/AdsConsoleMarkdownRenderer';
import {listPublishedChangelogs, markChangelogRead} from '@/services/ads-console/changelog';

const {Title, Text} = Typography;

/** 每个版本卡片内容区的默认最大高度 */
const CONTENT_MAX_HEIGHT = 520;
/** 每页显示条数 */
const PAGE_SIZE = 5;

const isSameSet = (a: Set<number>, b: Set<number>) => {
  if (a.size !== b.size) {
    return false;
  }
  for (const value of a) {
    if (!b.has(value)) {
      return false;
    }
  }
  return true;
};

const ChangelogPage: React.FC = () => {
  const [changelogs, setChangelogs] = useState<AdsConsole.SysChangelog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [overflowIds, setOverflowIds] = useState<Set<number>>(new Set());
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const contentRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await listPublishedChangelogs();
      if (res?.success && res.data) {
        setChangelogs(res.data);
        // 对未读的条目自动标记已读
        for (const item of res.data) {
          if (!item.read) {
            markChangelogRead(item.id).catch(() => {
            });
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /** 当前显示的日志列表（分页截取） */
  const visibleChangelogs = useMemo(
    () => changelogs.slice(0, displayCount),
    [changelogs, displayCount],
  );

  const hasMore = displayCount < changelogs.length;

  const recalculateOverflow = useCallback(() => {
    const newOverflowIds = new Set<number>();
    for (const item of visibleChangelogs) {
      const el = contentRefs.current[item.id];
      if (el && el.scrollHeight > CONTENT_MAX_HEIGHT + 1) {
        newOverflowIds.add(item.id);
      }
    }

    setOverflowIds((prev) => (isSameSet(prev, newOverflowIds) ? prev : newOverflowIds));
  }, [visibleChangelogs]);

  // 检测哪些内容区域超出了最大高度
  useEffect(() => {
    if (loading || visibleChangelogs.length === 0) {
      setOverflowIds(new Set());
      return undefined;
    }

    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      recalculateOverflow();
      raf2 = requestAnimationFrame(recalculateOverflow);
    });

    const imageCleanupFns: Array<() => void> = [];
    const resizeObservers: ResizeObserver[] = [];
    const mutationObservers: MutationObserver[] = [];

    for (const item of visibleChangelogs) {
      const el = contentRefs.current[item.id];
      if (!el) {
        continue;
      }

      if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(() => {
          recalculateOverflow();
        });
        resizeObserver.observe(el);
        resizeObservers.push(resizeObserver);
      }

      if (typeof MutationObserver !== 'undefined') {
        const mutationObserver = new MutationObserver(() => {
          recalculateOverflow();
        });
        mutationObserver.observe(el, {
          childList: true,
          subtree: true,
          characterData: true,
        });
        mutationObservers.push(mutationObserver);
      }

      const imgs = Array.from(el.querySelectorAll('img'));
      for (const img of imgs) {
        if (img.complete) {
          continue;
        }

        const handleImageLoad = () => {
          recalculateOverflow();
        };

        img.addEventListener('load', handleImageLoad);
        img.addEventListener('error', handleImageLoad);
        imageCleanupFns.push(() => {
          img.removeEventListener('load', handleImageLoad);
          img.removeEventListener('error', handleImageLoad);
        });
      }
    }

    window.addEventListener('resize', recalculateOverflow);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.removeEventListener('resize', recalculateOverflow);
      for (const cleanup of imageCleanupFns) {
        cleanup();
      }
      for (const observer of resizeObservers) {
        observer.disconnect();
      }
      for (const observer of mutationObservers) {
        observer.disconnect();
      }
    };
  }, [loading, visibleChangelogs, recalculateOverflow]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + PAGE_SIZE);
  };

  const anchorItems = visibleChangelogs.map((item) => ({
    key: `changelog-${item.id}`,
    href: `#changelog-${item.id}`,
    title: (
      <Space size={4}>
        {!item.read && <Badge dot/>}
        <span>{item.version}</span>
      </Space>
    ),
  }));

  return (
    <PageContainer
      title={false}
    >
      <div style={{display: 'flex', gap: 28, alignItems: 'flex-start', justifyContent: 'center'}}>
        {/* 主内容区 */}
        <div style={{flex: 1, minWidth: 0, maxWidth: 880}}>
          {loading ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    background: '#fff',
                    borderRadius: 14,
                    padding: '20px 24px',
                    border: '1px solid #f3f4f6',
                  }}
                >
                  <Skeleton active paragraph={{rows: 4}}/>
                </div>
              ))}
            </div>
          ) : changelogs.length === 0 ? (
            <div
              style={{
                background: '#fff',
                borderRadius: 14,
                padding: '64px 24px',
                textAlign: 'center',
                border: '1px solid #f3f4f6',
              }}
            >
              <Empty description="暂无更新日志"/>
            </div>
          ) : (
            <>
              <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
                {visibleChangelogs.map((item, index) => {
                  const isExpanded = expandedIds.has(item.id);
                  const isOverflow = overflowIds.has(item.id);

                  return (
                    <div
                      key={item.id}
                      id={`changelog-${item.id}`}
                      ref={(el) => {
                        sectionRefs.current[item.id] = el;
                      }}
                      style={{
                        background: '#fff',
                        borderRadius: 14,
                        border: index === 0 ? '1px solid #d7e5ff' : '1px solid #e9edf3',
                        overflow: 'hidden',
                        scrollMarginTop: 80,
                        transition: 'box-shadow 0.2s, border-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 8px 22px rgba(15, 23, 42, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* 卡片头部 */}
                      <div
                        style={{
                          padding: '18px 24px 14px',
                          borderBottom: '1px solid #eef2f7',
                          background: index === 0 ? '#f6faff' : '#fafbfd',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 10,
                            marginBottom: 8,
                          }}
                        >
                          <Tag
                            color={index === 0 ? 'blue' : 'default'}
                            style={{
                              fontSize: 13,
                              padding: '2px 10px',
                              borderRadius: 999,
                              fontWeight: 600,
                              lineHeight: '20px',
                            }}
                          >
                            {item.version}
                          </Tag>
                          {!item.read && (
                            <Tag
                              color="red"
                              style={{
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 500,
                              }}
                            >
                              New
                            </Tag>
                          )}
                          {index === 0 && (
                            <Tag
                              style={{
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 500,
                                background: '#f4fbf5',
                                border: '1px solid #caefcf',
                                color: '#2b8a3e',
                              }}
                            >
                              🎉 最新版本
                            </Tag>
                          )}
                          <Title level={4} style={{margin: 0, flex: 1, fontSize: 15, fontWeight: 600}}>
                            {item.title}
                          </Title>
                        </div>

                        {/* 时间 */}
                        <Space size={6}>
                          {item.read ? (
                            <CheckCircleOutlined style={{color: '#52c41a', fontSize: 12}}/>
                          ) : (
                            <ClockCircleOutlined style={{color: '#faad14', fontSize: 12}}/>
                          )}
                          <Text type="secondary" style={{fontSize: 12}}>
                            {item.publishTime
                              ? dayjs(item.publishTime).format('YYYY年MM月DD日 HH:mm')
                              : dayjs(item.createTime).format('YYYY年MM月DD日 HH:mm')}
                          </Text>
                        </Space>
                      </div>

                      {/* 内容区域 */}
                      <div
                        ref={(el) => {
                          contentRefs.current[item.id] = el;
                        }}
                        style={{
                          padding: '16px 24px 20px',
                          maxHeight: isExpanded ? 'none' : CONTENT_MAX_HEIGHT,
                          overflow: 'hidden',
                          position: 'relative',
                          transition: 'max-height 0.3s ease',
                        }}
                      >
                        <AdsConsoleMarkdownRenderer content={item.content}/>

                        {/* 渐变遮罩 - 仅在内容溢出且未展开时显示 */}
                        {isOverflow && !isExpanded && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: 64,
                              background:
                                'linear-gradient(transparent, rgba(255,255,255,0.9), #fff)',
                              pointerEvents: 'none',
                            }}
                          />
                        )}
                      </div>

                      {/* 展开/收起按钮 */}
                      {isOverflow && (
                        <div
                          style={{
                            padding: '0 22px 12px',
                            textAlign: 'center',
                          }}
                        >
                          <Button
                            type="link"
                            size="small"
                            onClick={() => toggleExpand(item.id)}
                            icon={isExpanded ? <UpOutlined/> : <DownOutlined/>}
                            style={{fontSize: 13, color: '#9096a3'}}
                          >
                            {isExpanded ? '收起内容' : '展开全部'}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 加载更多 / 已全部加载 */}
              <div style={{textAlign: 'center', padding: '20px 0 4px'}}>
                {hasMore ? (
                  <Button
                    onClick={handleLoadMore}
                    style={{
                      borderRadius: 999,
                      padding: '0 24px',
                      height: 34,
                      color: '#667085',
                      borderColor: '#e6e8ec',
                      background: '#fff',
                    }}
                  >
                    加载更多（还有 {changelogs.length - displayCount} 条）
                  </Button>
                ) : (
                  changelogs.length > PAGE_SIZE && (
                    <Text type="secondary" style={{fontSize: 13}}>
                      — 已加载全部 {changelogs.length} 条更新日志 —
                    </Text>
                  )
                )}
              </div>
            </>
          )}
        </div>

        {/* 右侧大纲锚点 */}
        {!loading && changelogs.length > 0 && (
          <Affix offsetTop={80}>
            <div
              style={{
                width: 188,
                background: '#fff',
                borderRadius: 14,
                padding: '14px 0',
                flexShrink: 0,
                border: '1px solid #e9edf3',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#a0a7b4',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  padding: '0 14px 8px',
                  borderBottom: '1px solid #f3f4f6',
                  marginBottom: 4,
                }}
              >
                版本大纲
              </div>
              <Anchor
                affix={false}
                offsetTop={80}
                items={anchorItems}
                style={{padding: '4px 0'}}
              />
            </div>
          </Affix>
        )}
      </div>
    </PageContainer>
  );
};

export default ChangelogPage;

