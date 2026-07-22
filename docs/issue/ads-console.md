## AdsConsole 线上登录跨域预检失败

### 出现场景

线上站点 `https://pupu.apptilaus.com` 进入投放管理登录页后，登录请求访问 `https://console.adsmakeup.com/api/auth/login`，浏览器在 `OPTIONS` 预检阶段拦截请求。

### 问题原因

浏览器跨域请求要求 `Access-Control-Allow-Origin` 只能返回一个合法值。当前接口响应中同时出现 `https://pupu.apptilaus.com` 和 `*`，导致浏览器报错：

```text
The 'Access-Control-Allow-Origin' header contains multiple values 'https://pupu.apptilaus.com, *', but only one is allowed.
```

本地开发正常是因为 `/ads-api` 走 Umi dev proxy，浏览器看到的是同源 `http://127.0.0.1:3000/ads-api/auth/login`，不会触发跨域限制。线上如果前端把 `/ads-api` 改写成 `https://console.adsmakeup.com/api`，就会直接暴露 CORS 配置问题。

### 解决方式

前端 AdsConsole 请求保持使用相对路径 `/ads-api/*`，不在浏览器侧改写为 `https://console.adsmakeup.com/api/*`。线上部署层需要配置同源反向代理，将：

```text
https://pupu.apptilaus.com/ads-api/*
```

转发到：

```text
https://console.adsmakeup.com/api/*
```

如果必须允许浏览器直连 `https://console.adsmakeup.com`，则后端或网关只能返回单个 `Access-Control-Allow-Origin`，不能同时返回具体域名和 `*`。

### 影响范围

投放管理登录、登出、用户信息获取，以及所有 `src/services/ads-console` 下使用 `/ads-api/*` 的接口。

### 相关文件

- `src/requestErrorConfig.ts`
- `config/proxy.ts`

## 投放平台切换不应刷新运营登录

### 出现场景

运营后台右上角点击“投放平台”切换入口时，前端曾调用运营侧 `refreshLogin` 刷新登录信息；当刷新结果中没有 `ad_spend_platform_login` 时，切换过程会清理运营会话并跳转登录页。

### 问题原因

平台切换应使用运营登录响应中已经下发的投放登录信息。切换时再次调用刷新接口会引入额外请求和状态漂移，且 `ad_spend_platform_login` 缺失时不应把当前运营登录态一并清掉。

### 解决方式

运营登录成功后将 `ad_spend_platform_login` 是否存在写入 `hasAdSpendPlatformLogin`，用于控制“投放平台”切换按钮展示。切换到投放平台时只读取本地缓存的投放登录数据；缺失时跳转投放登录页，不调用 `refreshLogin`，也不清理运营会话。

当本地存在投放登录数据但服务端已判定 token 过期时，切换入口先通过投放侧 `auth/info` 做一次校验；若返回 401 或业务 `errorCode=401`，则清理投放与运营会话，并跳转运营登录页，要求重新登录管理平台后由运营登录响应重新下发 `ad_spend_platform_login`。

### 影响范围

运营后台与投放后台之间的右上角平台切换入口。

### 相关文件

- `src/components/PlatformSwitchEntry.tsx`
- `src/pages/user/Login.tsx`
- `src/services/auth/session.ts`
- `src/services/common/typings.d.ts`
