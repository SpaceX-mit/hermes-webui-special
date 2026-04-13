import svgPaths from "./svg-fw1aeva7px";

function ButtonGrid({ className }: { className?: string }) {
  return (
    <div className={className || "border-[rgba(0,0,0,0.05)] border-solid border-t h-[80px] relative w-[760px]"} data-name="Button Grid">
      <div className="-translate-y-1/2 absolute content-stretch flex items-center justify-center right-0 top-[calc(50%-0.5px)]" data-name="Button">
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
    </div>
  );
}
type StateIconProps = {
  className?: string;
  property1?: "系统权限" | "本地服务" | "设备" | "网络" | "存储";
};

function StateIcon({ className, property1 = "设备" }: StateIconProps) {
  const is = property1 === "本地服务";
  const is1 = property1 === "网络";
  const is2 = property1 === "存储";
  const is3 = property1 === "系统权限";
  return (
    <div className={className || `content-stretch flex items-center justify-center px-[12px] relative rounded-[14px] size-[48px] ${is3 ? "bg-[#fff1f2]" : is2 ? "bg-[#ecfdf5]" : is1 ? "bg-[#eef2ff]" : is ? "bg-[#fff7ed]" : "bg-[#eff6ff]"}`}>
      <div className="relative shrink-0 size-[24px]" data-name="Icon">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
          <g id="Icon">
            <path d={is3 ? svgPaths.p3f3d8e00 : is2 ? svgPaths.p11feba00 : is1 ? "M12 20H12.01" : is ? svgPaths.pc21c880 : svgPaths.p2ebe5280} id="Vector" stroke={is3 ? "var(--stroke-0, #E42D22)" : is2 ? "var(--stroke-0, #35C44F)" : is1 ? "var(--stroke-0, #7434DC)" : is ? "var(--stroke-0, #FF7024)" : "var(--stroke-0, #206CFF)"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            <path d={is3 ? "M9 12L11 14L15 10" : is2 ? svgPaths.p1b1afa80 : is1 ? svgPaths.p36891a60 : is ? svgPaths.p138a0cf0 : "M8 21H16"} id="Vector_2" stroke={is3 ? "var(--stroke-0, #E42D22)" : is2 ? "var(--stroke-0, #35C44F)" : is1 ? "var(--stroke-0, #7434DC)" : is ? "var(--stroke-0, #FF7024)" : "var(--stroke-0, #206CFF)"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            {["设备", "本地服务", "网络", "存储"].includes(property1) && <path d={is2 ? svgPaths.p3eed8380 : is1 ? svgPaths.p18a14700 : is ? "M6 6H6.01" : "M12 17V21"} id="Vector_3" stroke={is2 ? "var(--stroke-0, #35C44F)" : is1 ? "var(--stroke-0, #7434DC)" : is ? "var(--stroke-0, #FF7024)" : "var(--stroke-0, #206CFF)"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />}
            {["本地服务", "网络"].includes(property1) && <path d={is1 ? svgPaths.p2b983464 : "M6 18H6.01"} id="Vector_4" stroke={is1 ? "var(--stroke-0, #7434DC)" : "var(--stroke-0, #FF7024)"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />}
          </g>
        </svg>
      </div>
    </div>
  );
}

function Title({ className }: { className?: string }) {
  return (
    <div className={className || "content-stretch flex h-[60px] items-center justify-between relative w-[760px]"} data-name="Title">
      <div className="relative shrink-0" data-name="Container">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start not-italic relative whitespace-nowrap">
          <p className="font-['Inter:Bold','Noto_Sans_JP:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[32px] relative shrink-0 text-[24px] text-black">当前主机状态</p>
          <p className="font-['Inter:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.1px]">系统环境检查中，请确认配置无误</p>
        </div>
      </div>
      <div className="bg-[#edffdc] h-[28px] relative rounded-[20px] shrink-0" data-name="Container">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] h-full items-center px-[12px] relative">
          <div className="bg-[#4ea100] opacity-99 rounded-[3px] shrink-0 size-[6px]" data-name="Container" />
          <p className="font-['Inter:Medium','Noto_Sans_SC:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#4ea100] text-[12px] tracking-[0.5px] whitespace-nowrap">监测中</p>
        </div>
      </div>
    </div>
  );
}

export default function Component({ className }: { className?: string }) {
  return (
    <div className={className || "content-stretch flex h-[1080px] isolate items-start overflow-clip relative rounded-[24px] w-[1440px]"} data-name="01 环境检测">
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
                <p className="font-['Inter:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] relative shrink-0 text-[#e5e5e5] w-full">{`01  环境检测`}</p>
                <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] relative shrink-0 text-[rgba(238,238,238,0.2)] w-full">{`02  核心引擎`}</p>
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
                        <Title className="h-[60px] relative shrink-0 w-full" />
                        <div className="flex-[863_0_0] min-h-px min-w-px relative w-full" data-name="Container">
                          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[16px] items-start overflow-clip relative rounded-[inherit] size-full">
                            <div className="bg-white relative rounded-[24px] shrink-0 w-full" data-name="Container">
                              <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.05)] border-solid inset-0 pointer-events-none rounded-[24px]" />
                              <div className="flex flex-row items-center size-full">
                                <div className="content-stretch flex items-center justify-between p-[25px] relative w-full">
                                  <div className="h-[48px] relative shrink-0" data-name="Container">
                                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] h-full items-center relative">
                                      <div className="bg-[#eff6ff] relative rounded-[14px] shrink-0 size-[48px]" data-name="State icon">
                                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[12px] relative size-full">
                                          <div className="relative shrink-0 size-[24px]" data-name="Icon">
                                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                                              <g id="Icon">
                                                <path d={svgPaths.p2ebe5280} id="Vector" stroke="var(--stroke-0, #206CFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                                <path d="M8 21H16" id="Vector_2" stroke="var(--stroke-0, #206CFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                                <path d="M12 17V21" id="Vector_3" stroke="var(--stroke-0, #206CFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                              </g>
                                            </svg>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="h-[44px] relative shrink-0" data-name="Container">
                                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] h-full items-start not-italic relative whitespace-nowrap">
                                          <p className="font-['Inter:Bold','Noto_Sans_JP:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[24px] relative shrink-0 text-[16px] text-black tracking-[0.15px]">设备</p>
                                          <p className="font-['Inter:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.25px]">硬件资源与核心模组</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="h-[48px] relative shrink-0" data-name="Button">
                                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex h-full items-center justify-center relative">
                                      <div className="bg-[#edffdc] content-stretch flex items-center justify-center overflow-clip relative rounded-[8px] shrink-0" data-name="Content">
                                        <div className="content-stretch flex gap-[4px] items-center justify-center px-[12px] py-[6px] relative shrink-0" data-name="State-layer">
                                          <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#4ea100] text-[14px] tracking-[0.1px] whitespace-nowrap">
                                            <p className="leading-[20px]">当前主机已就绪</p>
                                          </div>
                                          <div className="overflow-clip relative shrink-0 size-[18px]" data-name="Icon">
                                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                                              <g id="Vector" />
                                            </svg>
                                            <div className="absolute inset-[23.29%_12.5%_20.83%_14.21%]" data-name="Vector">
                                              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.1925 10.0575">
                                                <path d={svgPaths.p2c348300} fill="var(--fill-0, #4EA100)" id="Vector" />
                                              </svg>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="bg-white relative rounded-[24px] shrink-0 w-full" data-name="Container">
                              <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.05)] border-solid inset-0 pointer-events-none rounded-[24px]" />
                              <div className="flex flex-row items-center size-full">
                                <div className="content-stretch flex items-center justify-between p-[25px] relative w-full">
                                  <div className="h-[48px] relative shrink-0" data-name="Container">
                                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] h-full items-center relative">
                                      <StateIcon className="bg-[#fff7ed] relative rounded-[14px] shrink-0 size-[48px]" property1="本地服务" />
                                      <div className="h-[44px] relative shrink-0" data-name="Container">
                                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] h-full items-start not-italic relative whitespace-nowrap">
                                          <p className="font-['Inter:Bold','Noto_Sans_JP:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[24px] relative shrink-0 text-[16px] text-black tracking-[0.15px]">本地服务</p>
                                          <p className="font-['Inter:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.25px]">核心引擎运行状态</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="h-[48px] relative shrink-0" data-name="Button">
                                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex h-full items-center justify-center relative">
                                      <div className="bg-[#edffdc] content-stretch flex items-center justify-center overflow-clip relative rounded-[8px] shrink-0" data-name="Content">
                                        <div className="content-stretch flex gap-[4px] items-center justify-center px-[12px] py-[6px] relative shrink-0" data-name="State-layer">
                                          <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#4ea100] text-[14px] tracking-[0.1px] whitespace-nowrap">
                                            <p className="leading-[20px]">正常</p>
                                          </div>
                                          <div className="overflow-clip relative shrink-0 size-[18px]" data-name="Icon">
                                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                                              <g id="Vector" />
                                            </svg>
                                            <div className="absolute inset-[23.29%_12.5%_20.83%_14.21%]" data-name="Vector">
                                              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.1925 10.0575">
                                                <path d={svgPaths.p2c348300} fill="var(--fill-0, #4EA100)" id="Vector" />
                                              </svg>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="bg-white relative rounded-[24px] shrink-0 w-full" data-name="Container">
                              <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.05)] border-solid inset-0 pointer-events-none rounded-[24px]" />
                              <div className="flex flex-row items-center size-full">
                                <div className="content-stretch flex items-center justify-between p-[25px] relative w-full">
                                  <div className="h-[48px] relative shrink-0" data-name="Container">
                                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] h-full items-center relative">
                                      <div className="bg-[#eef2ff] relative rounded-[14px] shrink-0 size-[48px]" data-name="State icon">
                                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[12px] relative size-full">
                                          <div className="relative shrink-0 size-[24px]" data-name="Icon">
                                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                                              <g id="Icon">
                                                <path d="M12 20H12.01" id="Vector" stroke="var(--stroke-0, #7434DC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                                <path d={svgPaths.p36891a60} id="Vector_2" stroke="var(--stroke-0, #7434DC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                                <path d={svgPaths.p18a14700} id="Vector_3" stroke="var(--stroke-0, #7434DC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                                <path d={svgPaths.p2b983464} id="Vector_4" stroke="var(--stroke-0, #7434DC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                              </g>
                                            </svg>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="h-[44px] relative shrink-0" data-name="Container">
                                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] h-full items-start not-italic relative whitespace-nowrap">
                                          <p className="font-['Inter:Bold','Noto_Sans_JP:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[24px] relative shrink-0 text-[16px] text-black tracking-[0.15px]">网络状态</p>
                                          <p className="font-['Inter:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.25px]">云端同步与指令通道</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="h-[48px] relative shrink-0" data-name="Button">
                                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex h-full items-center justify-center relative">
                                      <div className="bg-[#edffdc] content-stretch flex items-center justify-center overflow-clip relative rounded-[8px] shrink-0" data-name="Content">
                                        <div className="content-stretch flex gap-[4px] items-center justify-center px-[12px] py-[6px] relative shrink-0" data-name="State-layer">
                                          <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#4ea100] text-[14px] tracking-[0.1px] whitespace-nowrap">
                                            <p className="leading-[20px]">已连接</p>
                                          </div>
                                          <div className="overflow-clip relative shrink-0 size-[18px]" data-name="Icon">
                                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                                              <g id="Vector" />
                                            </svg>
                                            <div className="absolute inset-[23.29%_12.5%_20.83%_14.21%]" data-name="Vector">
                                              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.1925 10.0575">
                                                <path d={svgPaths.p2c348300} fill="var(--fill-0, #4EA100)" id="Vector" />
                                              </svg>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="bg-white relative rounded-[24px] shrink-0 w-full" data-name="Container">
                              <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.05)] border-solid inset-0 pointer-events-none rounded-[24px]" />
                              <div className="flex flex-row items-center size-full">
                                <div className="content-stretch flex items-center justify-between p-[25px] relative w-full">
                                  <div className="h-[48px] relative shrink-0" data-name="Container">
                                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] h-full items-center relative">
                                      <div className="bg-[#ecfdf5] relative rounded-[14px] shrink-0 size-[48px]" data-name="State icon">
                                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[12px] relative size-full">
                                          <div className="relative shrink-0 size-[24px]" data-name="Icon">
                                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                                              <g id="Icon">
                                                <path d={svgPaths.p11feba00} id="Vector" stroke="var(--stroke-0, #35C44F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                                <path d={svgPaths.p1b1afa80} id="Vector_2" stroke="var(--stroke-0, #35C44F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                                <path d={svgPaths.p3eed8380} id="Vector_3" stroke="var(--stroke-0, #35C44F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                              </g>
                                            </svg>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="h-[44px] relative shrink-0" data-name="Container">
                                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] h-full items-start not-italic relative whitespace-nowrap">
                                          <p className="font-['Inter:Bold','Noto_Sans_JP:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[24px] relative shrink-0 text-[16px] text-black tracking-[0.15px]">存储空间</p>
                                          <p className="font-['Inter:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.25px]">知识库与日志缓存</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="h-[48px] relative shrink-0" data-name="Button">
                                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex h-full items-center justify-center relative">
                                      <div className="bg-[#edffdc] content-stretch flex items-center justify-center overflow-clip relative rounded-[8px] shrink-0" data-name="Content">
                                        <div className="content-stretch flex gap-[4px] items-center justify-center px-[12px] py-[6px] relative shrink-0" data-name="State-layer">
                                          <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#4ea100] text-[14px] tracking-[0.1px] whitespace-nowrap">
                                            <p className="leading-[20px]">充足</p>
                                          </div>
                                          <div className="overflow-clip relative shrink-0 size-[18px]" data-name="Icon">
                                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                                              <g id="Vector" />
                                            </svg>
                                            <div className="absolute inset-[23.29%_12.5%_20.83%_14.21%]" data-name="Vector">
                                              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.1925 10.0575">
                                                <path d={svgPaths.p2c348300} fill="var(--fill-0, #4EA100)" id="Vector" />
                                              </svg>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="bg-white relative rounded-[24px] shrink-0 w-full" data-name="Container">
                              <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.05)] border-solid inset-0 pointer-events-none rounded-[24px]" />
                              <div className="flex flex-row items-center size-full">
                                <div className="content-stretch flex items-center justify-between p-[25px] relative w-full">
                                  <div className="h-[48px] relative shrink-0" data-name="Container">
                                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] h-full items-center relative">
                                      <div className="bg-[#fff1f2] relative rounded-[14px] shrink-0 size-[48px]" data-name="State icon">
                                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[12px] relative size-full">
                                          <div className="relative shrink-0 size-[24px]" data-name="Icon">
                                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                                              <g id="Icon">
                                                <path d={svgPaths.p3f3d8e00} id="Vector" stroke="var(--stroke-0, #E42D22)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                                <path d="M9 12L11 14L15 10" id="Vector_2" stroke="var(--stroke-0, #E42D22)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                              </g>
                                            </svg>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="h-[44px] relative shrink-0" data-name="Container">
                                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] h-full items-start not-italic relative whitespace-nowrap">
                                          <p className="font-['Inter:Bold','Noto_Sans_JP:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[24px] relative shrink-0 text-[16px] text-black tracking-[0.15px]">系统权限</p>
                                          <p className="font-['Inter:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.25px]">应用操作与自动化权限</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="h-[48px] relative shrink-0" data-name="Button">
                                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex h-full items-center justify-center relative">
                                      <div className="bg-[#fff7f7] content-stretch flex items-center justify-center overflow-clip relative rounded-[8px] shrink-0" data-name="Content">
                                        <div className="content-stretch flex gap-[4px] items-center justify-center px-[12px] py-[6px] relative shrink-0" data-name="State-layer">
                                          <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[red] tracking-[0.1px] whitespace-nowrap">
                                            <p className="leading-[20px]">权限不足</p>
                                          </div>
                                          <div className="overflow-clip relative shrink-0 size-[18px]" data-name="Icon">
                                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                                              <g id="Vector" />
                                            </svg>
                                            <div className="absolute inset-[8.33%]" data-name="Vector">
                                              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
                                                <path d={svgPaths.p8251880} fill="var(--fill-0, #FF0000)" id="Vector" />
                                              </svg>
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
                        <ButtonGrid className="h-[80px] relative shrink-0 w-full" />
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