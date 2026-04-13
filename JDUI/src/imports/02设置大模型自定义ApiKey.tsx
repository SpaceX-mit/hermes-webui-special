import svgPaths from "./svg-4u9fkfc7mx";

function ApiDetail({ className }: { className?: string }) {
  return (
    <div className={className || "content-stretch flex flex-col gap-[8px] items-start relative w-[704px]"} data-name="API_detail">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Label">
        <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Icons / VPN Key">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
            <g id="Vector" />
          </svg>
          <div className="absolute inset-[20.83%_0]" data-name="Vector">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 9.33333">
              <path d={svgPaths.p59e3700} fill="var(--fill-0, #3C3C43)" fillOpacity="0.6" id="Vector" />
            </svg>
          </div>
        </div>
        <p className="font-['Inter:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-black tracking-[0.1px] whitespace-nowrap">API 密钥 (API Key)</p>
      </div>
      <div className="bg-[#f9fafb] h-[46px] relative rounded-[14px] shrink-0 w-full" data-name="Password Input">
        <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
            <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.25px] whitespace-nowrap">sk-...</p>
          </div>
        </div>
        <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[14px]" />
      </div>
      <p className="font-['Inter:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[11px] text-[rgba(60,60,67,0.6)] tracking-[0.5px] w-full">此密钥仅储存在本地，不会上传至我们的服务器。</p>
    </div>
  );
}
type ProviderCardProps = {
  className?: string;
  property1?: "Default" | "click";
};

function ProviderCard({ className, property1 = "Default" }: ProviderCardProps) {
  const isClick = property1 === "click";
  const isDefault = property1 === "Default";
  return (
    <div className={className || "bg-white content-stretch flex flex-col gap-[4px] items-start px-[24px] py-[20px] relative rounded-[16px] w-[248px]"}>
      {isClick && <div aria-hidden="true" className="absolute border border-[#b2e40d] border-solid inset-0 pointer-events-none rounded-[16px]" />}
      <div className="content-stretch flex h-[24px] items-center justify-between relative shrink-0 w-full" data-name="Container">
        <p className={`font-["Inter:Bold",sans-serif] font-bold leading-[24px] not-italic relative shrink-0 text-[16px] tracking-[0.15px] whitespace-nowrap ${isDefault ? "text-black" : "text-[#b2e40d]"}`}>OpenAI</p>
        {isClick && <div className="bg-[#b2e40d] rounded-[33554400px] shrink-0 size-[8px]" data-name="Container" />}
      </div>
      <p className={`font-medium leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(60,60,67,0.6)] tracking-[0.5px] w-full ${isDefault ? 'font-["Inter:Medium","Noto_Sans_JP:Medium",sans-serif]' : 'font-["Inter:Medium","Noto_Sans_JP:Medium","Noto_Sans_SC:Medium",sans-serif]'}`}>{isClick ? "官方直连" : "Claude 模型"}</p>
    </div>
  );
}

export default function Component02ApiKey({ className }: { className?: string }) {
  return (
    <div className={className || "content-stretch flex h-[1080px] isolate items-start overflow-clip relative rounded-[24px] w-[1440px]"} data-name="02 设置大模型_自定义 API Key">
      <div className="bg-[#232323] h-full relative shrink-0 w-[320px] z-[2]" data-name="Sidebar">
        <div className="flex flex-col items-center overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex flex-col items-center justify-between pt-[12px] relative size-full">
            <div className="relative shrink-0 w-full" data-name="Container">
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex items-center justify-between pl-[36px] pr-[24px] py-[16px] relative w-full">
                  <div className="h-[60px] relative shrink-0 w-[180px]" data-name="Logo">
                    <div className="absolute inset-[10.23%_80.06%_19.7%_1.77%]">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32.7102 42.0441">
                        <g id="Group 3">
                          <path d={svgPaths.p31ca4e00} fill="var(--fill-0, #B0E237)" id="Vector" />
                          <path d={svgPaths.p174b6100} fill="var(--fill-0, #C0E767)" id="Vector_2" />
                          <path d={svgPaths.p2a1d9b00} fill="var(--fill-0, #D0EE90)" id="Vector_3" />
                        </g>
                      </svg>
                    </div>
                    <div className="absolute inset-[23.71%_4.04%_19.69%_24.82%]">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 128.061 33.9584">
                        <g id="Group 2">
                          <path d={svgPaths.p370f000} fill="var(--fill-0, #E5E5E5)" id="Vector" />
                          <path d={svgPaths.p2b7ff300} fill="var(--fill-0, #E5E5E5)" id="Vector_2" />
                          <path d={svgPaths.p1eb8ce00} fill="var(--fill-0, #E5E5E5)" id="Vector_3" />
                          <path d={svgPaths.p3d2adf00} fill="var(--fill-0, #E5E5E5)" id="Vector_4" />
                          <path d={svgPaths.p375e6a00} fill="var(--fill-0, #E5E5E5)" id="Vector_5" />
                          <path d={svgPaths.p1c8af900} fill="var(--fill-0, #E5E5E5)" id="Vector_6" />
                          <path d={svgPaths.p399c6900} fill="var(--fill-0, #E5E5E5)" id="Vector_7" />
                          <path d={svgPaths.p358bed80} fill="var(--fill-0, #E5E5E5)" id="Vector_8" />
                          <path d={svgPaths.p2be6ee00} fill="var(--fill-0, #E5E5E5)" id="Vector_9" />
                          <path d={svgPaths.pf00f000} fill="var(--fill-0, #E5E5E5)" id="Vector_10" />
                          <path d={svgPaths.p1720fc00} fill="var(--fill-0, #E5E5E5)" id="Vector_11" />
                          <path d={svgPaths.p2942ff00} fill="var(--fill-0, #E5E5E5)" id="Vector_12" />
                          <path d={svgPaths.p37ee4720} fill="var(--fill-0, #E5E5E5)" id="Vector_13" />
                          <path d={svgPaths.p3c62c300} fill="var(--fill-0, #E5E5E5)" id="Vector_14" />
                          <path d={svgPaths.p1f20ce00} fill="var(--fill-0, #E5E5E5)" id="Vector_15" />
                          <path d={svgPaths.p99f3500} fill="var(--fill-0, #E5E5E5)" id="Vector_16" />
                          <path d={svgPaths.p33af3000} fill="var(--fill-0, #E5E5E5)" id="Vector_17" />
                          <path d={svgPaths.p32afaa00} fill="var(--fill-0, #E5E5E5)" id="Vector_18" />
                          <path d={svgPaths.p2688c900} fill="var(--fill-0, #E5E5E5)" id="Vector_19" />
                          <path d={svgPaths.p163d7100} fill="var(--fill-0, #E5E5E5)" id="Vector_20" />
                          <path d={svgPaths.p1ee5c200} fill="var(--fill-0, #E5E5E5)" id="Vector_21" />
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-[1_0_0] min-h-px min-w-px not-italic overflow-clip relative w-full" data-name="Navigation">
              <div className="absolute content-stretch flex flex-col font-bold gap-[4px] items-start leading-[52px] left-[40px] text-[45px] top-[40px] whitespace-nowrap">
                <p className="font-['Inter:Bold','Noto_Sans_SC:Bold','Noto_Sans_JP:Bold',sans-serif] relative shrink-0 text-[#e5e5e5]">{`欢迎使用 `}</p>
                <p className="font-['Inter:Bold',sans-serif] relative shrink-0 text-[#9ce40d]">Openclaw</p>
                <p className="font-['Inter:Bold','Noto_Sans_JP:Bold','Noto_Sans_SC:Bold',sans-serif] relative shrink-0 text-[#e5e5e5]">数字员工</p>
              </div>
              <div className="absolute font-['Inter:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[0] left-[40px] text-[#e5e5e5] text-[16px] top-[236px] tracking-[0.5px] w-[240px]">
                <p className="leading-[24px] mb-0">三步完成初始化，</p>
                <p className="leading-[24px]">让你的数字员工开始工作</p>
              </div>
              <div className="absolute content-stretch flex flex-col font-normal gap-[20px] items-start leading-[20px] left-[40px] text-[14px] top-[370px] tracking-[0.25px] w-[83px] whitespace-pre-wrap">
                <p className="font-['Inter:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] relative shrink-0 text-[rgba(238,238,238,0.2)] w-full">{`01  环境检测`}</p>
                <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] relative shrink-0 text-[#e5e5e5] w-full">{`02  核心引擎`}</p>
                <p className="font-['Inter:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] relative shrink-0 text-[rgba(238,238,238,0.2)] w-full">{`03  创建员工`}</p>
              </div>
            </div>
            <div className="relative shrink-0 w-full" data-name="HorizontalBorder">
              <div aria-hidden="true" className="absolute border-[#262626] border-solid border-t inset-0 pointer-events-none" />
              <div className="content-stretch flex flex-col items-start pb-[24px] pl-[36px] pr-[24px] pt-[25px] relative w-full">
                <div className="h-[48px] relative shrink-0 w-full" data-name="Container">
                  <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center py-[8px] relative size-full">
                    <div className="flex flex-[1_0_0] flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[12px] text-[rgba(235,235,245,0.45)] text-ellipsis tracking-[0.5px] whitespace-nowrap">
                      <p className="leading-[16px] overflow-hidden text-ellipsis">V0.1.0 STABLE</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#232323] flex-[1_0_0] h-full min-h-px min-w-px relative z-[1]" data-name="Main">
        <div className="flex flex-col justify-center overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex flex-col items-start justify-center pr-[8px] py-[8px] relative size-full">
            <div className="bg-[#f5f5f5] flex-[1_0_0] min-h-px min-w-px relative rounded-[20px] w-full" data-name="Background+Border+Shadow">
              <div className="flex flex-col items-center overflow-clip rounded-[inherit] size-full">
                <div className="content-stretch flex flex-col items-center px-[60px] relative size-full">
                  <div className="flex-[1_0_0] max-w-[768px] min-h-px min-w-px relative w-full" data-name="Step1">
                    <div className="flex flex-col items-center max-w-[inherit] size-full">
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[32px] items-center max-w-[inherit] py-[48px] relative size-full">
                        <div className="h-[60px] relative shrink-0 w-full" data-name="Title">
                          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between relative size-full">
                            <div className="relative shrink-0" data-name="Container">
                              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start not-italic relative whitespace-nowrap">
                                <p className="font-['Inter:Bold','Noto_Sans_JP:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[32px] relative shrink-0 text-[24px] text-black">自定义 API Key</p>
                                <p className="font-['Inter:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.1px]">接入您已有的大模型账户</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Container">
                          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[16px] items-start overflow-clip relative rounded-[inherit] size-full">
                            <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full" data-name="Container">
                              <p className="font-['Inter:Bold','Noto_Sans_JP:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[20px] not-italic relative shrink-0 text-[14px] text-black tracking-[0.1px] whitespace-nowrap">服务提供商</p>
                              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="Container">
                                <ProviderCard className="bg-white flex-[1_0_0] min-h-px min-w-px relative rounded-[16px]" property1="click" />
                                <div className="bg-white flex-[1_0_0] min-h-px min-w-px relative rounded-[16px]" data-name="provider_card">
                                  <div className="content-stretch flex flex-col gap-[4px] items-start px-[24px] py-[20px] relative w-full">
                                    <div className="content-stretch flex h-[24px] items-center justify-between relative shrink-0 w-full" data-name="Container">
                                      <p className="font-['Inter:Bold',sans-serif] font-bold leading-[24px] not-italic relative shrink-0 text-[16px] text-black tracking-[0.15px] whitespace-nowrap">Anthropic</p>
                                    </div>
                                    <p className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(60,60,67,0.6)] tracking-[0.5px] w-full">Claude 模型</p>
                                  </div>
                                </div>
                                <div className="bg-white flex-[1_0_0] min-h-px min-w-px relative rounded-[16px]" data-name="provider_card">
                                  <div className="content-stretch flex flex-col gap-[4px] items-start px-[24px] py-[20px] relative w-full">
                                    <div className="content-stretch flex h-[24px] items-center justify-between relative shrink-0 w-full" data-name="Container">
                                      <p className="font-['Inter:Bold',sans-serif] font-bold leading-[24px] not-italic relative shrink-0 text-[16px] text-black tracking-[0.15px] whitespace-nowrap">兼容 OpenAI</p>
                                    </div>
                                    <p className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(60,60,67,0.6)] tracking-[0.5px] w-full">私有化部署 / 代理</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="bg-white relative rounded-[24px] shrink-0 w-full" data-name="Container">
                              <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.05)] border-solid inset-0 pointer-events-none rounded-[24px]" />
                              <div className="content-stretch flex flex-col gap-[32px] items-start px-[24px] py-[36px] relative w-full">
                                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="API_detail">
                                  <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Label">
                                    <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Icons / Memory">
                                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                                        <g id="Vector" />
                                      </svg>
                                      <div className="absolute inset-[12.5%]" data-name="Vector">
                                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
                                          <path d={svgPaths.p33a6d970} fill="var(--fill-0, #3C3C43)" fillOpacity="0.6" id="Vector" />
                                        </svg>
                                      </div>
                                    </div>
                                    <p className="font-['Inter:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-black tracking-[0.1px] whitespace-nowrap">模型名称 (Model)</p>
                                  </div>
                                  <div className="bg-[#f9fafb] h-[46px] relative rounded-[14px] shrink-0 w-full" data-name="Password Input">
                                    <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
                                      <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
                                        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[14px] text-black tracking-[0.25px] whitespace-nowrap">gpt-4o</p>
                                      </div>
                                    </div>
                                    <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[14px]" />
                                  </div>
                                </div>
                                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="API_detail">
                                  <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Label">
                                    <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Icons / Link">
                                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                                        <g id="Vector" />
                                      </svg>
                                      <div className="absolute inset-[29.17%_8.33%]" data-name="Vector">
                                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.3333 6.66667">
                                          <path d={svgPaths.p37480900} fill="var(--fill-0, #3C3C43)" fillOpacity="0.6" id="Vector" />
                                        </svg>
                                      </div>
                                    </div>
                                    <p className="font-['Inter:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-black tracking-[0.1px] whitespace-nowrap">API 接口地址 (Base URL)</p>
                                  </div>
                                  <div className="bg-[#f9fafb] h-[46px] relative rounded-[14px] shrink-0 w-full" data-name="Password Input">
                                    <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
                                      <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
                                        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.25px] whitespace-nowrap">{`https://api.openai.com/v1`}</p>
                                      </div>
                                    </div>
                                    <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[14px]" />
                                  </div>
                                </div>
                                <ApiDetail className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" />
                              </div>
                            </div>
                            <div className="bg-[#f5f8fd] relative rounded-[16px] shrink-0 w-full" data-name="Container">
                              <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.05)] border-solid inset-0 pointer-events-none rounded-[16px]" />
                              <div className="flex flex-row items-center size-full">
                                <div className="content-stretch flex gap-[12px] items-center px-[25px] py-[13px] relative w-full">
                                  <div className="bg-[#e1ecfe] relative rounded-[33554400px] shrink-0 size-[32px]" data-name="Container">
                                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[8px] relative size-full">
                                      <div className="relative shrink-0 size-[16px]" data-name="Icon">
                                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                                          <g id="Icon">
                                            <path d={svgPaths.p37f49070} id="Vector" stroke="var(--stroke-0, #206CFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                                            <path d={svgPaths.p17134c00} id="Vector_2" stroke="var(--stroke-0, #206CFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                                          </g>
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                  <p className="flex-[1_0_0] font-['Inter:Medium','Noto_Sans_SC:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[16px] min-h-px min-w-px not-italic relative text-[#001749] text-[12px] tracking-[0.5px]">测试连通性：在保存配置前，我们将向该接口发送一条测试请求，以确保您的密钥和模型名称可用。</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="h-[80px] relative shrink-0 w-full" data-name="Button Grid">
                          <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.05)] border-solid border-t inset-0 pointer-events-none" />
                          <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                            <div className="-translate-y-1/2 absolute content-stretch flex items-center justify-center right-0 top-1/2" data-name="Button">
                              <div className="bg-[#b2e40d] content-stretch flex items-center justify-center overflow-clip relative rounded-[100px] shrink-0" data-name="Content">
                                <div className="content-stretch flex gap-[8px] items-center justify-center pl-[36px] pr-[24px] py-[16px] relative shrink-0" data-name="State-layer">
                                  <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-black tracking-[0.15px] whitespace-nowrap">
                                    <p className="leading-[24px]">下一步</p>
                                  </div>
                                  <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Icon">
                                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                                      <g id="Vector" />
                                    </svg>
                                    <div className="absolute inset-[16.67%]" data-name="Vector">
                                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                                        <path d={svgPaths.p14168ea0} fill="var(--fill-0, black)" id="Vector" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="-translate-y-1/2 absolute content-stretch flex items-center justify-center left-0 top-1/2" data-name="Button">
                              <div className="bg-[rgba(143,143,154,0.1)] content-stretch flex items-center justify-center overflow-clip relative rounded-[100px] shrink-0" data-name="Content">
                                <div className="content-stretch flex gap-[8px] items-center justify-center px-[36px] py-[16px] relative shrink-0" data-name="State-layer">
                                  <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-black tracking-[0.15px] whitespace-nowrap">
                                    <p className="leading-[24px]">返回</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}