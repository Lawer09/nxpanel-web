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
