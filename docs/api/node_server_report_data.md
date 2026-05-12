# 节点上报数据结构与字段含义

本文基于当前代码实现分析节点统一上报接口 `/api/v2/server/report` 的请求体结构、字段语义、取值来源与单位。

## 1. 上报入口与周期

- 上报接口：`POST /api/v2/server/report`
- 客户端方法：`ReportNodeData(req *NodeReportRequest)`
- 定时任务：`reportUserTrafficTask()`
- 上报周期：由节点配置 `push_interval` 决定（解析为 `NodeInfo.PushInterval`）

说明：每个上报周期内会采集并上报 traffic/alive/online/status/metrics 五类数据。

## 2. 顶层数据结构

```json
{
  "traffic": {
    "1001": [12345, 67890]
  },
  "alive": {
    "1001": ["1.2.3.4", "5.6.7.8"]
  },
  "online": {
    "1001": 3
  },
  "status": {
    "cpu": 12.5,
    "mem": {"total": 17179869184, "used": 4294967296},
    "swap": {"total": 2147483648, "used": 0},
    "disk": {"total": 536870912000, "used": 107374182400},
    "inbound_speed": 2048,
    "outbound_speed": 4096
  },
  "metrics": {
    "uptime": 3600,
    "goroutines": 55,
    "tcp_connections": 120,
    "total_users": 200,
    "active_users": 35,
    "inbound_speed": 2048,
    "outbound_speed": 4096,
    "cpu_per_core": [10.2, 15.4],
    "load": [0.12, 0.20, 0.33],
    "kernel_status": false
  }
}
```

## 3. 顶层字段说明

### traffic

- 类型：`map[int][]int64`
- 结构：`{ uid: [upload, download] }`
- 含义：当前上报周期内每个用户的上传/下载字节数。
- 单位：字节（bytes）。
- 来源：核心流量计数器（xray/sing/hy2），读取后会重置本周期计数。
- 过滤：仅当 `upload + download > ReportMinTraffic * 1024` 时，该用户才会进入 `traffic`。

### alive

- 类型：`map[int][]string`
- 结构：`{ uid: [ipIdentifier, ...] }`
- 含义：在线 IP 标识集合（按用户聚合）。
- 来源：限速器在线设备列表。
- 过滤：低流量用户会被过滤（阈值 `DeviceOnlineMinTraffic * 1000`）。

### online

- 类型：`map[int]int`
- 结构：`{ uid: connectionCount }`
- 含义：每个用户当前连接数。
- 来源：同一份在线设备列表按 UID 计数。
- 特点：`online` 统计所有连接，不受 `alive` 的低流量过滤影响。

### status

- 类型：`NodeStatus`
- 含义：节点系统资源与本周期聚合带宽状态。
- 采集项：CPU、内存、Swap、磁盘、上下行速率。

### metrics

- 类型：`NodeMetrics`
- 含义：节点运行时指标（进程、连接、活跃用户、细分 CPU/负载等）。

## 4. status 字段明细（NodeStatus）

- `cpu` (`float64`)：CPU 使用率（百分比，1 秒采样）。
- `mem.total` (`int64`)：总内存字节数。
- `mem.used` (`int64`)：已用内存字节数。
- `swap.total` (`int64`)：Swap 总量字节数。
- `swap.used` (`int64`)：Swap 已用字节数。
- `disk.total` (`int64`)：磁盘总量字节数（根分区）。
- `disk.used` (`int64`)：磁盘已用字节数（根分区）。
- `kernel_status` (`interface{}`，omitempty)：内核状态扩展字段（当前实现未赋值，通常不出现）。
- `inbound_speed` (`int64`)：本周期入站速率（bytes/s），计算为 `totalUpload / pushIntervalSeconds`。
- `outbound_speed` (`int64`)：本周期出站速率（bytes/s），计算为 `totalDownload / pushIntervalSeconds`。

备注：当 `pushInterval <= 0` 时，速率计算回退为 60 秒分母。

## 5. metrics 字段明细（NodeMetrics）

- `uptime` (`int64`)：当前进程启动后运行时长（秒）。
- `goroutines` (`int`)：Go 协程数量。
- `active_connections` (`int`)：活跃连接数（当前实现未赋值，默认 0）。
- `total_connections` (`int64`)：累计连接数（当前实现未赋值，默认 0）。
- `tcp_connections` (`int`)：系统 ESTABLISHED TCP 连接数。
- `total_users` (`int`)：节点当前总用户数（`len(c.userList)`）。
- `active_users` (`int`)：本周期有流量上报的用户数（`len(userTraffic)`）。
- `inbound_speed` (`int64`)：与 `status.inbound_speed` 同值。
- `outbound_speed` (`int64`)：与 `status.outbound_speed` 同值。
- `cpu_per_core` (`[]float64`，omitempty)：每核 CPU 使用率（百分比）。
- `load` (`[]float64`，omitempty)：系统负载 `[1m, 5m, 15m]`（Linux/macOS 有效）。
- `speed_limiter` (`interface{}`，omitempty)：限速器扩展指标（当前实现未赋值）。
- `gc` (`interface{}`，omitempty)：GC 扩展指标（当前实现未赋值）。
- `api` (`interface{}`，omitempty)：API 扩展指标（当前实现未赋值）。
- `ws` (`interface{}`，omitempty)：WS 扩展指标（当前实现未赋值）。
- `limits` (`interface{}`，omitempty)：系统限制扩展指标（当前实现未赋值）。
- `kernel_status` (`bool`)：内核状态布尔值（当前实现未赋值，默认 `false`，不会省略）。

## 6. 关键口径与注意点

- `traffic` 是“周期增量”，因为读取后会重置计数器。
- `inbound_speed/outbound_speed` 是用“本周期累计字节 / 周期秒数”得到的平均速率，不是瞬时速率。
- `alive` 与 `online` 都按 UID 聚合，但过滤规则不同：
  - `alive` 会过滤低流量用户；
  - `online` 不过滤，反映真实连接计数。
- 多个字段定义为扩展位（`interface{}`）但当前版本尚未填充，服务端应按可选字段兼容处理。

## 7. 代码定位

- 数据结构定义：`api/panel/report.go`
- 上报调用：`api/panel/user.go`
- 上报组装逻辑：`node/user.go`
- 系统信息采集：`common/sysinfo/sysinfo.go`
- 周期任务启动：`node/task.go`
- 阈值配置定义：`conf/node.go`
