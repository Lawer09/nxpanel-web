# Asset Service Create Machine API

This document describes provider machine creation APIs. The public request model is provider-neutral. `asset-service` derives the provider from `account_id` and maps the request to the provider API internally. The first implementation supports Zenlayer ZEC.

All APIs use the project standard response format and HTTP 200 for successful writes. This round intentionally does not update `api/asset-service/openapi.yaml`.

## 1. Create Catalog APIs

Base path:

```http
GET /api/v1/assets/provider-accounts/{account_id}/machine-create/{category}
```

Path parameters:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `account_id` | integer | Yes | Provider account primary key. The provider is inferred from this account. |
| `category` | string | Yes | Catalog category. Supported values are listed below. |

Query parameters:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `region` | string | No | Provider region. Required by zone-scoped catalogs when the provider requires it. |
| `zone` | string | No | Provider zone. Required by instance type, image, storage, and network catalogs. Zenlayer maps this to `zoneId`. |
| `vpc_id` | string | No | Provider VPC ID. Used by network catalog to filter subnets. |
| `refresh` | boolean | No | Request cache refresh. A minimum refresh interval is still enforced to avoid provider rate limits. |

Categories:

| Category | Description |
| --- | --- |
| `regions` | Region or zone source data. Zenlayer currently returns `DescribeZones`. |
| `zones` | Available zones. Zenlayer currently returns `DescribeZones`. |
| `instance-types` | Machine specifications and inventory metadata. Requires `zone`; Zenlayer maps `zone` to `zoneId` for `DescribeZoneInstanceConfigInfos` and maps `region` to `regionIds` for `DescribeVmInventoryCapacity`. |
| `billing-options` | Billing modes and network billing modes supported by the adapter. |
| `images` | OS image list. Requires `zone`. Zenlayer `DescribeImages` requires `zoneId`; optional filters such as image type are provider-specific and are not public API fields in this version. |
| `storage-options` | System/data disk candidate information. Requires `zone`. |
| `network-options` | VPC, subnet, and security group candidates. Requires `zone`; `vpc_id` can narrow subnets. |
| `ip-options` | Local available IP candidates and supported IP assignment modes. Includes provider-recognized selectable IPs and self-owned accountless IPs marked as not selectable with a reason. |
| `ssh-keys` | Provider-side SSH key pairs. |
| `timezones` | Provider-supported time zone list. Zenlayer `DescribeTimeZones` does not require request parameters. |

Response fields:

| Field | Type | Description |
| --- | --- | --- |
| `data.account_id` | integer | Provider account primary key. |
| `data.provider_code` | string | Provider code inferred from `account_id`, for example `zenlayer`. |
| `data.category` | string | Requested catalog category. |
| `data.region` | string | Request region. |
| `data.zone` | string | Request zone. |
| `data.vpc_id` | string | Request VPC ID. |
| `data.refresh` | boolean | Whether refresh was requested. |
| `data.cache_ttl_seconds` | integer | Cache TTL in seconds. |
| `data.min_refresh_age_seconds` | integer | Minimum refresh interval in seconds. |
| `data.option_groups` | array | Normalized option groups for frontend forms. |

Each `data.option_groups[]` item:

| Field | Type | Description |
| --- | --- | --- |
| `field` | string | Target create request field, for example `region` or `network.subnet_id`. |
| `depends_on` | string[] | Fields that should be selected before this group is queried or used. |
| `options` | array | Candidate values. |
| `extra` | object | Group-level metadata, including `catalog_types`, `cached`, and `stale`. |

Each `data.option_groups[].options[]` item:

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Stable frontend key for this option. |
| `value` | string/number/boolean | Actual value to submit to `POST /api/v1/assets/machines/create-from-provider`. |
| `extra` | object | Display and filtering metadata. `extra.label` can be used as the display label; `extra.selectable=false` means the option should not be selectable. |

Rules:

- For all enum or select fields, the frontend must submit `option.value`, not `option.id` or `option.extra`.
- `option.id` is only a stable UI key. Most string options use the same value for `id` and `value`; local IP options use string `id` but numeric `value`.
- Provider-specific raw data is only available as a sanitized summary in `option.extra.raw`; frontend should not depend on raw provider fields for submit values.
- Cache status is summarized at group level in `extra.cached` and `extra.stale`; individual options may also include `extra.cached` and `extra.stale`.

Create field to catalog API mapping:

| Create field | Catalog API | Returned group |
| --- | --- | --- |
| `region` | `GET /api/v1/assets/provider-accounts/{account_id}/machine-create/regions` | `field=region` |
| `zone` | `GET /api/v1/assets/provider-accounts/{account_id}/machine-create/zones?region=...` | `field=zone` |
| `instance_type` | `GET /api/v1/assets/provider-accounts/{account_id}/machine-create/instance-types?region=...&zone=...` | `field=instance_type` |
| `billing.type` | `GET /api/v1/assets/provider-accounts/{account_id}/machine-create/billing-options` | `field=billing.type` |
| `billing.period_unit` | `GET /api/v1/assets/provider-accounts/{account_id}/machine-create/billing-options` | `field=billing.period_unit` |
| `billing.internet_charge_type` | `GET /api/v1/assets/provider-accounts/{account_id}/machine-create/billing-options` | `field=billing.internet_charge_type` |
| `image_id` | `GET /api/v1/assets/provider-accounts/{account_id}/machine-create/images?region=...&zone=...` | `field=image_id` |
| `storage.system_disk.category` | `GET /api/v1/assets/provider-accounts/{account_id}/machine-create/storage-options?region=...&zone=...` | `field=storage.system_disk.category` |
| `storage.data_disks.category` | `GET /api/v1/assets/provider-accounts/{account_id}/machine-create/storage-options?region=...&zone=...` | `field=storage.data_disks.category` |
| `network.vpc_id` | `GET /api/v1/assets/provider-accounts/{account_id}/machine-create/network-options?region=...&zone=...` | `field=network.vpc_id` |
| `network.subnet_id` | `GET /api/v1/assets/provider-accounts/{account_id}/machine-create/network-options?region=...&zone=...&vpc_id=...` | `field=network.subnet_id` |
| `network.security_group_id` | `GET /api/v1/assets/provider-accounts/{account_id}/machine-create/network-options?region=...&zone=...` | `field=network.security_group_id` |
| `ip_assignment.mode` | `GET /api/v1/assets/provider-accounts/{account_id}/machine-create/ip-options?region=...` | `field=ip_assignment.mode` |
| `ip_assignment.ip_ids` | `GET /api/v1/assets/provider-accounts/{account_id}/machine-create/ip-options?region=...` | `field=ip_assignment.ip_ids` |
| `ssh_key.provider_key_id` | `GET /api/v1/assets/provider-accounts/{account_id}/machine-create/ssh-keys` | `field=ssh_key.provider_key_id` |
| `time_zone` | `GET /api/v1/assets/provider-accounts/{account_id}/machine-create/timezones` | `field=time_zone` |

Zenlayer current catalog sources:

| Category | Zenlayer action | Request parameters used by asset-service |
| --- | --- | --- |
| `regions` / `zones` | `DescribeZones` | Optional `zoneIds` is not exposed yet; current request is `{}`. |
| `instance-types` | `DescribeZoneInstanceConfigInfos` | `zoneId` from query `zone`. |
| `instance-types` | `DescribeVmInventoryCapacity` | `regionIds` from query `region`; if `region` is absent, it is derived from `zone` such as `asia-east-1a -> asia-east-1`. |
| `images` | `DescribeImages` | `zoneId` from query `zone`. |
| `timezones` | `DescribeTimeZones` | `{}`. |
| `ssh-keys` | `DescribeKeyPairs` | `{}`. |
| `network-options` | `DescribeVpcs`, `DescribeSubnets`, `DescribeSecurityGroups` | `zoneId`; `DescribeSubnets` also uses `vpcId` when `vpc_id` is provided. |

Example:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "account_id": 1,
    "provider_code": "zenlayer",
    "category": "images",
    "region": "SEL",
    "zone": "SEL-A",
    "refresh": false,
    "cache_ttl_seconds": 21600,
    "min_refresh_age_seconds": 300,
    "option_groups": [
      {
        "field": "image_id",
        "depends_on": ["region", "zone"],
        "options": [
          {
            "id": "ubuntu-24",
            "value": "ubuntu-24",
            "extra": {
              "label": "Ubuntu 24.04",
              "os_type": "linux",
              "selectable": true,
              "catalog_type": "zec_images",
              "cached": true,
              "stale": false,
              "raw": {}
            }
          }
        ],
        "extra": {
          "catalog_types": ["zec_images"],
          "cached": true,
          "stale": false
        }
      }
    ]
  },
  "request_id": "req-xxx",
  "timestamp": 1781949600
}
```

## 2. Quote Create Price

```http
POST /api/v1/assets/provider-accounts/{account_id}/machine-create/price
```

Path parameters:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `account_id` | integer | Yes | Provider account primary key. This value overrides any `account_id` in the request body. |

Request body:

Uses the same generic create request body as `POST /api/v1/assets/machines/create-from-provider`.

Response fields:

| Field | Type | Description |
| --- | --- | --- |
| `data.account_id` | integer | Provider account primary key. |
| `data.provider_code` | string | Provider code. |
| `data.currency` | string | Currency extracted from provider response when available. |
| `data.total_price` | number | Total price extracted from provider response when available. |
| `data.breakdown` | object | Provider price detail if available. |
| `data.provider_raw` | object | Sanitized raw provider quote response. |

If the provider does not support price quote, the API returns `409` with error type `CAPABILITY_NOT_SUPPORTED`.

## 3. Create Machines From Provider

```http
POST /api/v1/assets/machines/create-from-provider
```

This API creates local machine ledger rows first, with `status=creating` and `source=provider`, then creates an asynchronous task. The worker calls the provider API and fills `external_instance_id`, specs, and IP bindings later.

Request body:

The fields below are the values submitted by the frontend. For selectable fields such as `region`, `zone`, `instance_type`, `image_id`, `network.subnet_id`, `ssh_key.provider_key_id`, and `time_zone`, use the `value` from the matching catalog API option listed in section 1.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `account_id` | integer | Yes | Provider account primary key. |
| `region` | string | Yes | Provider region. |
| `zone` | string | Yes | Provider zone. Zenlayer maps this to `zoneId`. |
| `instance_type` | string | Yes | Provider machine specification ID. Zenlayer maps this to `instanceType`. |
| `image_id` | string | Yes | Provider image ID. Zenlayer maps this to `imageId`. |
| `billing` | object | Yes | Billing configuration. |
| `storage` | object | Yes | System disk and data disk configuration. |
| `network` | object | Yes | Network configuration. |
| `ip_assignment` | object | No | Public IP or existing IP selection. Default is `provider_auto`. |
| `ssh_key` | object | No | Provider SSH key ID or password. Password is sensitive. |
| `time_zone` | string | No | Instance time zone. Zenlayer maps this to `timeZone`. |
| `count` | integer | No | Number of machines. Default `1`; maximum `100`. |
| `machine_id_template` | string | No | Local machine business ID template. Supports `{index}` and `{id}` only. |
| `name_template` | string | No | Provider/local machine name template. Supports `{index}` and `{id}` only. |
| `init_command_template` | string | No | Init command template. Supports `{index}` and `{id}` only. Zenlayer maps this to `userData`. |
| `metadata` | object | No | Local metadata only. |
| `client_request_id` | string | No | Idempotency key scoped by `account_id`. |

Unknown fields are rejected. The old provider passthrough field `payload` is not accepted.

`billing` fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `type` | string | Yes | Billing type. For Zenlayer, use the value expected by ZEC, for example prepaid or postpaid style values returned by catalog. |
| `period` | integer | No | Billing period, used for prepaid/monthly modes. |
| `period_unit` | string | No | Period unit, for example `month`. |
| `auto_renew` | boolean | No | Whether to auto renew if supported. |
| `internet_charge_type` | string | No | Network billing type. Can be overridden by `ip_assignment.internet_charge_type`. |
| `traffic_package_size` | number | No | Traffic package size if provider supports traffic package billing. |
| `extra` | object | No | Reserved provider-neutral extension object. |

`storage` fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `system_disk` | object | Yes | System disk config. |
| `system_disk.category` | string | No | Disk category/type. |
| `system_disk.size_gb` | integer | Yes | System disk size in GiB. |
| `system_disk.extra` | object | No | Provider-neutral extension object merged into disk payload. |
| `data_disks` | array | No | Data disks. Each item uses the same fields as `system_disk`. |

`network` fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `vpc_id` | string | No | VPC ID for UI/reference. Zenlayer create uses `subnet_id`, not `vpc_id`. |
| `subnet_id` | string | Yes | Provider subnet ID. Zenlayer maps this to `subnetId`. |
| `security_group_id` | string | No | Security group ID. |
| `nic_network_type` | string | No | Network card type when provider supports it. |
| `lan_ip` | string | No | Private IP when provider supports it. |
| `enable_agent` | boolean | No | Provider agent switch when supported. |
| `enable_ip_forward` | boolean | No | IP forwarding switch when supported. |
| `resource_group_id` | string | No | Provider resource group ID when supported. |

`ip_assignment` fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `mode` | string | No | `provider_auto`, `provider_existing`, or `self_owned`. Default `provider_auto`. |
| `ip_ids` | integer[] | No | Local `sv_asset_ips.id` list for existing provider-recognized IPs. |
| `quantity` | integer | No | Reserved for future provider auto IP quantity. |
| `bandwidth_mbps` | integer | No | Public bandwidth in Mbps. |
| `internet_charge_type` | string | No | Public network billing type. |
| `traffic_package_size` | number | No | Traffic package size. |
| `eip_bind_type` | string | No | Provider EIP bind type when supported. |
| `eip_v4_type` | string | No | Provider IPv4/EIP type when supported. |
| `cluster_id` | string | No | Provider cluster ID when supported. |

IP rules:

| Mode | Behavior |
| --- | --- |
| `provider_auto` | Provider allocates a default public IP during machine create if supported. |
| `provider_existing` | Worker creates the instance first, then binds listed IPs by provider API. Each IP must belong to the same account and have `external_ip_id`. When `count > 1`, `ip_ids.length` must equal `count`; the Nth IP is bound to the Nth machine. |
| `self_owned` | Allowed only when the self-owned IP has been imported into the provider and synced with `external_ip_id`; otherwise returns `409 CAPABILITY_NOT_SUPPORTED`. When `count > 1`, `ip_ids.length` must equal `count`. |

`ssh_key` fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `provider_key_id` | string | No | Provider SSH key ID. Zenlayer maps this to `keyId`. |
| `password` | string | No | Login password if provider supports it. Sensitive. Stored only in encrypted task payload for execution. |

Response fields:

| Field | Type | Description |
| --- | --- | --- |
| `data.task_id` | integer | Task service task ID. |
| `data.status` | string | Initial task status, usually `pending`. |
| `data.task_url` | string | Public task detail path. |
| `data.machines` | array | Local machine rows already written to `sv_asset_machines`. |

Example:

```json
{
  "account_id": 1,
  "region": "SEL",
  "zone": "SEL-A",
  "instance_type": "z2a.cpu.1",
  "image_id": "ubuntu_24_04",
  "billing": {
    "type": "POSTPAID",
    "internet_charge_type": "ByBandwidth"
  },
  "storage": {
    "system_disk": {"category": "Standard", "size_gb": 50},
    "data_disks": [{"category": "Standard", "size_gb": 100}]
  },
  "network": {
    "vpc_id": "vpc-xxx",
    "subnet_id": "subnet-xxx",
    "security_group_id": "sg-xxx"
  },
  "ip_assignment": {
    "mode": "provider_auto",
    "bandwidth_mbps": 10,
    "internet_charge_type": "ByBandwidth"
  },
  "ssh_key": {
    "provider_key_id": "key-xxx"
  },
  "time_zone": "Asia/Shanghai",
  "count": 2,
  "machine_id_template": "sel-web-{index}",
  "name_template": "sel-web-{index}",
  "init_command_template": "hostnamectl set-hostname sel-web-{index}; echo {id}",
  "client_request_id": "create-sel-web-20260620"
}
```

## 4. Retry Provider Create

```http
POST /api/v1/assets/machines/{machine_id}/retry-provider-create
```

Path parameters:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `machine_id` | integer | Yes | Local machine primary key. |

Request body:

The body accepts the same generic fields as create, except `account_id`, `count`, `machine_id_template`, and `client_request_id` are taken from the existing local machine. Fields omitted in the retry request are read from the saved `create_request_json`.

Only provider-created local machines with empty `external_instance_id` and status `creating` or `create_failed` can be retried.

Response fields are identical to create, but `data.machines` contains one machine.

## 5. Zenlayer Mapping

Zenlayer ZEC uses `POST /api/v2/zec` with `X-ZC-Action`.

| Generic field | Zenlayer field/action |
| --- | --- |
| create action | `CreateZecInstances` |
| price action | `InquiryPriceCreateInstance` |
| `zone` | `zoneId` |
| `instance_type` | `instanceType` |
| `image_id` | `imageId` |
| `count` | `instanceCount`; worker sends `1` per task item |
| `time_zone` | `timeZone` |
| `network.subnet_id` | `subnetId` |
| `network.security_group_id` | `securityGroupId` |
| `storage.system_disk` | `systemDisk` |
| `storage.data_disks` | `dataDisks` |
| `ssh_key.provider_key_id` | `keyId` |
| `init_command_template` | `userData` after template rendering |

Zenlayer create does not use `vpcId` directly. `vpc_id` is used by frontend and catalog filtering; the actual create request uses `subnetId`.

## 6. Errors

| HTTP | Error type | Description |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | Missing required field, invalid JSON, unsupported template variable, unknown request field. |
| 404 | `COMMON_NOT_FOUND` | Provider account, machine, or IP does not exist. |
| 409 | `CAPABILITY_NOT_SUPPORTED` | Provider does not support the requested create capability or selected IP type. |
| 502 | `COMMON_BAD_GATEWAY` | Provider catalog, price, or create API call failed and no cached fallback is available. |
| 503 | `COMMON_UNAVAILABLE` | Task service or service registry token is not ready. |

Sensitive fields such as provider credentials, password, private key, token, and full signatures must not appear in logs, public responses, or `create_request_json`.
