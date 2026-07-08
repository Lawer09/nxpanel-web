import {
  ProFormDateTimeRangePicker,
  ProFormDigit,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  StepsForm,
} from "@ant-design/pro-components";
import { history, useSearchParams } from "@umijs/max";
import { App, Button, Card, Descriptions, Space } from "antd";
import React, { useEffect, useState } from "react";
import {
  createCampaign,
  getCampaignDetail,
  updateCampaign,
} from "@/services/ads-console/campaign";
import { getAccountPage } from "@/services/ads-console/account";

const CampaignCreatePage: React.FC = () => {
  const { message } = App.useApp();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");

  const [accountOptions, setAccountOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [formData, setFormData] = useState<Partial<AdsConsole.AdsCampaign>>({});
  const [editRecord, setEditRecord] = useState<AdsConsole.AdsCampaign | null>(null);

  useEffect(() => {
    getAccountPage({ current: 1, size: 100 }).then((res) => {
      if (res?.success) {
        setAccountOptions(
          (res.data?.records || []).map((a) => ({ label: a.name || a.accountId || a.id, value: String(a.id) }))
        );
      }
    });
    if (editId) {
      getCampaignDetail(editId).then((res) => {
        if (res?.success && res.data) {
          setEditRecord(res.data);
          setFormData(res.data);
        }
      });
    }
  }, [editId]);

  const handleFinishAll = async (values: any) => {
    const data = {
      ...values.step1,
      ...values.step2,
    };
    // 处理时间范围
    if (data.timeRange) {
      data.startTime = data.timeRange[0];
      data.endTime = data.timeRange[1];
      delete data.timeRange;
    }

    let res: any;
    if (editId) {
      res = await updateCampaign({ id: editId, ...data });
    } else {
      res = await createCampaign(data);
    }

    if (res?.success) {
      message.success(editId ? "修改成功" : "创建成功");
      history.push("/ads-console/ads/campaign");
      return true;
    }
    message.error(res?.errorMessage || "操作失败");
    return false;
  };

  return (
    <Card title={editId ? "编辑广告活动" : "新建广告活动"}>
      <StepsForm
        onFinish={handleFinishAll}
        stepsProps={{ size: "small" }}
        submitter={{
          render: (props) => {
            if (props.step === 0) {
              return (
                <Space>
                  <a onClick={() => history.back()}>取消</a>
                  <Button type="primary" onClick={() => props.onSubmit?.()}>下一步</Button>
                </Space>
              );
            }
            if (props.step === 1) {
              return (
                <Space>
                  <Button onClick={() => props.onPre?.()}>上一步</Button>
                  <Button type="primary" onClick={() => props.onSubmit?.()}>下一步</Button>
                </Space>
              );
            }
            return (
              <Space>
                <Button onClick={() => props.onPre?.()}>上一步</Button>
                <Button type="primary" onClick={() => props.onSubmit?.()}>
                  {editId ? "保存修改" : "提交创建"}
                </Button>
              </Space>
            );
          },
        }}
      >
        {/* 第 1 步：基本信息 */}
        <StepsForm.StepForm
          name="step1"
          title="基本信息"
          initialValues={editRecord || {}}
          onFinish={async (values) => {
            setFormData((prev) => ({ ...prev, ...values }));
            return true;
          }}
          style={{ maxWidth: 600 }}
        >
          <ProFormText
            name="name"
            label="活动名称"
            rules={[{ required: true, message: "请输入活动名称" }]}
            placeholder="请输入广告活动名称"
          />
          <ProFormSelect
            name="accountId"
            label="广告账户"
            rules={[{ required: true, message: "请选择广告账户" }]}
            options={accountOptions}
            showSearch
            placeholder="请选择广告账户"
          />
          <ProFormRadio.Group
            name="objective"
            label="成效目标"
            rules={[{ required: true, message: "请选择成效目标" }]}
            options={[
              { label: "🎯 品牌认知", value: "BRAND_AWARENESS" },
              { label: "📢 覆盖人群", value: "REACH" },
              { label: "🔗 网站流量", value: "TRAFFIC" },
              { label: "💬 互动参与", value: "ENGAGEMENT" },
              { label: "👥 潜在客户", value: "LEAD_GENERATION" },
              { label: "📱 应用推广", value: "APP_PROMOTION" },
              { label: "🛒 销量转化", value: "SALES" },
            ]}
            fieldProps={{
              style: {
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
              },
            }}
          />
          <ProFormRadio.Group
            name="bidType"
            label="竞价类型"
            rules={[{ required: true, message: "请选择竞价类型" }]}
            options={[
              { label: "CPC（每次点击）", value: "CPC" },
              { label: "CPM（每千次曝光）", value: "CPM" },
              { label: "CPA（每次转化）", value: "CPA" },
              { label: "OCPM（优化千次曝光）", value: "OCPM" },
            ]}
          />
          <ProFormTextArea
            name="remark"
            label="备注"
            placeholder="活动备注信息（选填）"
          />
        </StepsForm.StepForm>

        {/* 第 2 步：预算与排期 */}
        <StepsForm.StepForm
          name="step2"
          title="预算与排期"
          initialValues={editRecord || { budgetType: 1 }}
          onFinish={async (values) => {
            setFormData((prev) => ({ ...prev, ...values }));
            return true;
          }}
          style={{ maxWidth: 600 }}
        >
          <ProFormRadio.Group
            name="budgetType"
            label="预算类型"
            options={[
              { label: "日预算", value: 1 },
              { label: "总预算", value: 2 },
            ]}
            initialValue={1}
          />
          <ProFormDigit
            name="budget"
            label="预算金额"
            rules={[{ required: true, message: "请输入预算金额" }]}
            min={1}
            fieldProps={{ precision: 2, prefix: "$", style: { width: 200 } }}
            placeholder="请输入金额"
          />
          <ProFormDateTimeRangePicker
            name="timeRange"
            label="投放时间"
            placeholder={["开始时间", "结束时间（不填为长期）"]}
            fieldProps={{ style: { width: "100%" } }}
          />
        </StepsForm.StepForm>

        {/* 第 3 步：确认提交 */}
        <StepsForm.StepForm
          name="step3"
          title="确认提交"
          style={{ maxWidth: 600 }}
        >
          <Descriptions
            title="活动信息预览"
            column={2}
            size="small"
            bordered
            style={{ marginBottom: 24 }}
          >
            <Descriptions.Item label="活动名称" span={2}>
              {formData.name || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="成效目标">
              {formData.objective || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="竞价类型">
              {(formData as any).bidType || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="预算类型">
              {(formData as any).budgetType === 2 ? "总预算" : "日预算"}
            </Descriptions.Item>
            <Descriptions.Item label="预算金额">
              ${(formData as any).budget?.toFixed(2) || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="开始时间">
              {formData.startTime || "立即"}
            </Descriptions.Item>
            <Descriptions.Item label="结束时间">
              {(formData as any).endTime || "长期"}
            </Descriptions.Item>
          </Descriptions>
        </StepsForm.StepForm>
      </StepsForm>
    </Card>
  );
};

export default CampaignCreatePage;





