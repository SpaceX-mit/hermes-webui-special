import svgPaths from "./svg-fhnyan6v4y";
import img from "figma:asset/9b9f0881d219021e83d4d96b0db4ad5c55e1255b.png";
type SwitchProps = {
  className?: string;
  state?: boolean;
};

function Switch({ className, state = true }: SwitchProps) {
  const isNotState = !state;
  return (
    <div className={className || `h-[24px] overflow-clip relative w-[42px] ${isNotState ? "rounded-[17.6px]" : "bg-[#0d6fff] content-stretch flex items-center justify-end p-[2px] rounded-[1000px]"}`}>
      {state && <div className="bg-white h-full rounded-[100px] shadow-[0px_0px_1px_0px_rgba(0,0,0,0.05),0px_0px_4px_0px_rgba(0,0,0,0.05),0px_0px_44px_0px_rgba(0,0,0,0.1)] shrink-0 w-[20px]" data-name="Knob" />}
      {isNotState && (
        <>
          <div aria-hidden="true" className="absolute bg-[rgba(0,0,0,0.09)] inset-0 pointer-events-none rounded-[17.6px]" />
          <div className="absolute bg-white inset-[8.33%_47.62%_8.33%_4.76%] rounded-[160px]" data-name="Knob">
            <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(0,0,0,0.02)] border-solid inset-[-0.8px] pointer-events-none rounded-[160.8px] shadow-[0px_0.4px_0.8px_0.16px_rgba(0,0,0,0.12)]" />
          </div>
          <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0px_1.6px_0px_rgba(0,0,0,0.02),inset_0px_0.8px_2.4px_0px_rgba(0,0,0,0.12)]" />
        </>
      )}
    </div>
  );
}
type CommonFunctionsIconProps = {
  className?: string;
  propFunction?: "search" | "knowledge" | "auto" | "memory";
  state?: boolean;
};

function CommonFunctionsIcon({ className, propFunction = "search", state = true }: CommonFunctionsIconProps) {
  const isAutoAndState = propFunction === "auto" && state;
  const isKnowledge = propFunction === "knowledge";
  const isKnowledgeAndState = propFunction === "knowledge" && state;
  const isMemory = propFunction === "memory";
  const isMemoryAndNotState = propFunction === "memory" && !state;
  const isMemoryAndState = propFunction === "memory" && state;
  const isNotStateAndIsSearchOrMemoryOrKnowledge = !state && ["search", "memory", "knowledge"].includes(propFunction);
  const isSearchAndNotState = propFunction === "search" && !state;
  return (
    <div className={className || `content-stretch flex items-center justify-center relative rounded-[16px] ${isKnowledgeAndState ? "bg-[#ecfdf5] size-[44px]" : isMemoryAndState ? "bg-[#eef2ff] size-[44px]" : propFunction === "auto" && !state ? "bg-[#f9fafb] h-[44px] px-[11.469px] w-[42.938px]" : isAutoAndState ? "bg-[#fdfcec] h-[44px] w-[42.938px]" : isNotStateAndIsSearchOrMemoryOrKnowledge ? "bg-[#f9fafb] size-[44px]" : "bg-[#eff6ff] size-[44px]"}`}>
      <div className="relative shrink-0 size-[20px]" data-name="Icon">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
          <g clipPath={isSearchAndNotState ? "url(#clip0_10_735)" : propFunction === "search" && state ? "url(#clip0_10_746)" : undefined} id="Icon">
            <path d={isKnowledge ? "M10 5.83333V17.5" : isMemory ? svgPaths.p17e613c0 : propFunction === "auto" ? svgPaths.p3a2fa580 : svgPaths.p14d24500} id="Vector" stroke={isKnowledgeAndState ? "var(--stroke-0, #00BC7D)" : isMemoryAndState ? "var(--stroke-0, #615FFF)" : isAutoAndState ? "var(--stroke-0, #FFBE0A)" : !state ? "var(--stroke-0, #99A1AF)" : "var(--stroke-0, #2B7FFF)"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
            {["search", "memory", "knowledge"].includes(propFunction) && <path d={isKnowledge ? svgPaths.p25713000 : isMemory ? svgPaths.p3f362a80 : svgPaths.p17212180} id="Vector_2" stroke={isKnowledgeAndState ? "var(--stroke-0, #00BC7D)" : isMemoryAndState ? "var(--stroke-0, #615FFF)" : isNotStateAndIsSearchOrMemoryOrKnowledge ? "var(--stroke-0, #99A1AF)" : "var(--stroke-0, #2B7FFF)"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />}
            {["search", "memory"].includes(propFunction) && <path d={isMemory ? svgPaths.p3fbca400 : "M1.66667 10H18.3333"} id="Vector_3" stroke={isMemoryAndState ? "var(--stroke-0, #615FFF)" : !state && ["search", "memory"].includes(propFunction) ? "var(--stroke-0, #99A1AF)" : "var(--stroke-0, #2B7FFF)"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />}
            {isMemory && (
              <>
                <path d={svgPaths.p1c1c7100} id="Vector_4" stroke={isMemoryAndNotState ? "var(--stroke-0, #99A1AF)" : "var(--stroke-0, #615FFF)"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                <path d={svgPaths.p162c4500} id="Vector_5" stroke={isMemoryAndNotState ? "var(--stroke-0, #99A1AF)" : "var(--stroke-0, #615FFF)"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                <path d="M10 10.8333H13.3333" id="Vector_6" stroke={isMemoryAndNotState ? "var(--stroke-0, #99A1AF)" : "var(--stroke-0, #615FFF)"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                <path d={svgPaths.p3936ae00} id="Vector_7" stroke={isMemoryAndNotState ? "var(--stroke-0, #99A1AF)" : "var(--stroke-0, #615FFF)"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                <path d="M10 6.66667H16.6667" id="Vector_8" stroke={isMemoryAndNotState ? "var(--stroke-0, #99A1AF)" : "var(--stroke-0, #615FFF)"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                <path d={svgPaths.p868f800} id="Vector_9" stroke={isMemoryAndNotState ? "var(--stroke-0, #99A1AF)" : "var(--stroke-0, #615FFF)"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                <path d={svgPaths.p23096600} id="Vector_10" stroke={isMemoryAndNotState ? "var(--stroke-0, #99A1AF)" : "var(--stroke-0, #615FFF)"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                <path d={svgPaths.p217ce480} id="Vector_11" stroke={isMemoryAndNotState ? "var(--stroke-0, #99A1AF)" : "var(--stroke-0, #615FFF)"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                <path d={svgPaths.p66d6d00} id="Vector_12" stroke={isMemoryAndNotState ? "var(--stroke-0, #99A1AF)" : "var(--stroke-0, #615FFF)"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                <path d={svgPaths.p2a516600} id="Vector_13" stroke={isMemoryAndNotState ? "var(--stroke-0, #99A1AF)" : "var(--stroke-0, #615FFF)"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              </>
            )}
          </g>
          {propFunction === "search" && (
            <defs>
              <clipPath id={isSearchAndNotState ? "clip0_10_735" : "clip0_10_746"}>
                <rect fill="white" height="20" width="20" />
              </clipPath>
            </defs>
          )}
        </svg>
      </div>
    </div>
  );
}

function CommonFunctionsCard({ className }: { className?: string }) {
  return (
    <div className={className || "bg-white content-stretch flex gap-[12px] items-center px-[20px] py-[24px] relative rounded-[16px] w-[344px]"} data-name="common_functions_card">
      <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-start min-h-px min-w-px relative" data-name="Container">
        <CommonFunctionsIcon className="bg-[#eff6ff] relative rounded-[16px] shrink-0 size-[44px]" />
        <div className="flex-[1_0_0] min-h-px min-w-px relative" data-name="Container">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start not-italic py-[3px] relative w-full">
            <p className="font-['Inter:Bold','Noto_Sans_SC:Bold','Noto_Sans_JP:Bold',sans-serif] font-bold leading-[20px] relative shrink-0 text-[14px] text-black tracking-[0.1px] w-full">联网检索</p>
            <p className="font-['Inter:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[16px] relative shrink-0 text-[12px] text-[rgba(60,60,67,0.6)] tracking-[0.5px] w-full">允许实时搜索网络获取最新信息</p>
          </div>
        </div>
      </div>
      <Switch className="bg-[#0d6fff] content-stretch flex h-[24px] items-center justify-end overflow-clip p-[2px] relative rounded-[1000px] shrink-0 w-[42px]" />
    </div>
  );
}

export default function Component({ className }: { className?: string }) {
  return (
    <div className={className || "content-stretch flex h-[1080px] isolate items-start overflow-clip relative rounded-[24px] w-[1440px]"} data-name="03 创建员工-确认信息">
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
                <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] relative shrink-0 text-[rgba(238,238,238,0.2)] w-full">{`02  核心引擎`}</p>
                <p className="font-['Inter:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] relative shrink-0 text-[#e5e5e5] w-full">{`03  创建员工`}</p>
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
                          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start justify-between relative size-full">
                            <div className="relative shrink-0" data-name="Container">
                              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start not-italic relative whitespace-nowrap">
                                <p className="font-['Inter:Bold','Noto_Sans_JP:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[32px] relative shrink-0 text-[24px] text-black">数字员工已生成</p>
                                <p className="font-['Inter:Medium','Noto_Sans_SC:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.1px]">AI 已根据您的描述提取了以下特性，请确认或继续编辑功能开关</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Container">
                          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[24px] items-center overflow-clip relative rounded-[inherit] size-full">
                            <div className="bg-white relative rounded-[24px] shrink-0 w-full" data-name="ID_card">
                              <div className="overflow-clip rounded-[inherit] size-full">
                                <div className="content-stretch flex gap-[24px] items-start p-[24px] relative w-full">
                                  <div className="absolute right-[-70px] size-[200px] top-[-120px]">
                                    <div className="absolute inset-[-80%]">
                                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 520 520">
                                        <g filter="url(#filter0_f_10_796)" id="Ellipse 2" opacity="0.3">
                                          <circle cx="260" cy="260" fill="url(#paint0_linear_10_796)" r="100" />
                                        </g>
                                        <defs>
                                          <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="520" id="filter0_f_10_796" width="520" x="0" y="0">
                                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                                            <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                                            <feGaussianBlur result="effect1_foregroundBlur_10_796" stdDeviation="80" />
                                          </filter>
                                          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_10_796" x1="214.986" x2="304.514" y1="195.952" y2="343.991">
                                            <stop offset="0.126524" stopColor="#E4FFDB" />
                                            <stop offset="0.5625" stopColor="#96FF46" />
                                            <stop offset="0.9375" stopColor="#51FFBC" />
                                          </linearGradient>
                                        </defs>
                                      </svg>
                                    </div>
                                  </div>
                                  <div className="relative rounded-[45.283px] shrink-0 size-[80px]" data-name="头像">
                                    <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[45.283px] size-full" src={img} />
                                  </div>
                                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px min-w-px relative" data-name="Container">
                                    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="Container">
                                      <p className="font-['Inter:Bold','Noto_Sans_JP:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[28px] not-italic relative shrink-0 text-[22px] text-black whitespace-nowrap">1 号员工</p>
                                      <div className="bg-[#edffdc] relative rounded-[8px] shrink-0" data-name="State">
                                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center px-[10px] py-[4px] relative">
                                          <div className="relative shrink-0 size-[6px]">
                                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
                                              <circle cx="3" cy="3" fill="var(--fill-0, #4EA100)" id="Ellipse 3" opacity="0.853384" r="3" />
                                            </svg>
                                          </div>
                                          <p className="font-['Inter:Bold',sans-serif] font-bold leading-[16px] not-italic relative shrink-0 text-[#4ea100] text-[11px] tracking-[0.5px] whitespace-nowrap">ONLINE</p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="bg-[rgba(143,143,154,0.1)] relative rounded-[16px] shrink-0 w-full" data-name="Container">
                                      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.05)] border-solid inset-0 pointer-events-none rounded-[16px]" />
                                      <div className="flex flex-row items-center size-full">
                                        <div className="content-stretch flex items-center p-[17px] relative w-full">
                                          <p className="font-['Inter:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.25px] whitespace-nowrap">{`"保持专注与热情，随时准备为您提供最高效的工作支持 ✨"`}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.05)] border-solid inset-0 pointer-events-none rounded-[24px]" />
                            </div>
                            <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-name="Container">
                              <p className="font-['Inter:Bold','Noto_Sans_JP:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[20px] not-italic relative shrink-0 text-[14px] text-black tracking-[0.1px] whitespace-nowrap">系统提取特性设定 (Persona)</p>
                              <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
                                <div className="bg-white relative rounded-[16px] shrink-0 w-full" data-name="personality_item">
                                  <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.05)] border-solid inset-0 pointer-events-none rounded-[16px]" />
                                  <div className="flex flex-row items-center size-full">
                                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center px-[24px] py-[16px] relative w-full">
                                      <div className="bg-[#b2e40d] rounded-[3px] shrink-0 size-[6px]" data-name="Container" />
                                      <p className="flex-[1_0_0] font-['Inter:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[20px] min-h-px min-w-px not-italic relative text-[14px] text-black tracking-[0.25px]">沟通风格轻松自然，极具同理心，总是能第一时间察觉用户的情绪变化。</p>
                                      <div className="overflow-clip relative shrink-0 size-[18px]" data-name="Icons / Delete">
                                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                                          <g id="Vector" />
                                        </svg>
                                        <div className="absolute inset-[12.5%_20.83%]" data-name="Vector">
                                          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.5 13.5">
                                            <path d={svgPaths.p23234d00} fill="var(--fill-0, #4D4D4D)" fillOpacity="0.25" id="Vector" />
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-white relative rounded-[16px] shrink-0 w-full" data-name="personality_item">
                                  <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.05)] border-solid inset-0 pointer-events-none rounded-[16px]" />
                                  <div className="flex flex-row items-center size-full">
                                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center px-[24px] py-[16px] relative w-full">
                                      <div className="bg-[#b2e40d] rounded-[3px] shrink-0 size-[6px]" data-name="Container" />
                                      <p className="flex-[1_0_0] font-['Inter:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[20px] min-h-px min-w-px not-italic relative text-[14px] text-black tracking-[0.25px]">遇到复杂的技术问题时，会展现出严谨的逻辑，并分步骤提供清晰的解决方案。</p>
                                      <div className="overflow-clip relative shrink-0 size-[18px]" data-name="Icons / Delete">
                                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                                          <g id="Vector" />
                                        </svg>
                                        <div className="absolute inset-[12.5%_20.83%]" data-name="Vector">
                                          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.5 13.5">
                                            <path d={svgPaths.p23234d00} fill="var(--fill-0, #4D4D4D)" fillOpacity="0.25" id="Vector" />
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-white relative rounded-[16px] shrink-0 w-full" data-name="personality_item">
                                  <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.05)] border-solid inset-0 pointer-events-none rounded-[16px]" />
                                  <div className="flex flex-row items-center size-full">
                                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center px-[24px] py-[16px] relative w-full">
                                      <div className="bg-[#b2e40d] rounded-[3px] shrink-0 size-[6px]" data-name="Container" />
                                      <p className="flex-[1_0_0] font-['Inter:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[20px] min-h-px min-w-px not-italic relative text-[14px] text-black tracking-[0.25px]">如果遇到知识盲区，会坦诚承认并主动提出帮忙检索求证，绝不敷衍或编造。</p>
                                      <div className="overflow-clip relative shrink-0 size-[18px]" data-name="Icons / Delete">
                                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                                          <g id="Vector" />
                                        </svg>
                                        <div className="absolute inset-[12.5%_20.83%]" data-name="Vector">
                                          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.5 13.5">
                                            <path d={svgPaths.p23234d00} fill="var(--fill-0, #4D4D4D)" fillOpacity="0.25" id="Vector" />
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-white relative rounded-[16px] shrink-0 w-full" data-name="Container">
                                  <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.05)] border-solid inset-0 pointer-events-none rounded-[16px]" />
                                  <div className="flex flex-row items-center size-full">
                                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center px-[24px] py-[16px] relative w-full">
                                      <div className="overflow-clip relative shrink-0 size-[18px]" data-name="Icons / Add">
                                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                                          <g id="Vector" />
                                        </svg>
                                        <div className="absolute inset-[20.83%]" data-name="Vector">
                                          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.5 10.5">
                                            <path d={svgPaths.p27b8f180} fill="var(--fill-0, #4D4D4D)" fillOpacity="0.25" id="Vector" />
                                          </svg>
                                        </div>
                                      </div>
                                      <p className="font-['Inter:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.25px] whitespace-nowrap">输入性格或行为准则，按回车添加...</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-name="Container">
                              <p className="font-['Inter:Bold','Noto_Sans_JP:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[20px] not-italic relative shrink-0 text-[14px] text-black tracking-[0.1px] whitespace-nowrap">系统提取特性设定 (Persona)</p>
                              <div className="gap-x-[16px] gap-y-[16px] grid grid-cols-[repeat(2,minmax(0,1fr))] grid-rows-[repeat(2,fit-content(100%))] relative shrink-0 w-full" data-name="Container">
                                <CommonFunctionsCard className="bg-white col-1 justify-self-stretch relative rounded-[16px] row-1 self-start shrink-0" />
                                <div className="bg-white col-1 justify-self-stretch relative rounded-[16px] row-2 self-start shrink-0" data-name="common_functions_card">
                                  <div className="flex flex-row items-center size-full">
                                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center px-[20px] py-[24px] relative w-full">
                                      <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-start min-h-px min-w-px relative" data-name="Container">
                                        <div className="bg-[#f9fafb] relative rounded-[16px] shrink-0 size-[44px]" data-name="common_functions_icon">
                                          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[11.469px] relative size-full">
                                            <div className="relative shrink-0 size-[20px]" data-name="Icon">
                                              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                                                <g id="Icon">
                                                  <path d={svgPaths.p3a2fa580} id="Vector" stroke="var(--stroke-0, #99A1AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                                </g>
                                              </svg>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex-[1_0_0] min-h-px min-w-px relative" data-name="Container">
                                          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start not-italic py-[3px] relative w-full">
                                            <p className="font-['Inter:Bold','Noto_Sans_SC:Bold','Noto_Sans_JP:Bold',sans-serif] font-bold leading-[20px] relative shrink-0 text-[14px] text-black tracking-[0.1px] w-full">自主执行</p>
                                            <p className="font-['Inter:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[16px] relative shrink-0 text-[12px] text-[rgba(60,60,67,0.6)] tracking-[0.5px] w-full">允许在无需确认的情况下执行常规任务</p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="h-[24px] overflow-clip relative rounded-[17.6px] shrink-0 w-[42px]" data-name="Switch">
                                        <div aria-hidden="true" className="absolute bg-[rgba(0,0,0,0.09)] inset-0 pointer-events-none rounded-[17.6px]" />
                                        <div className="absolute bg-white inset-[8.33%_47.62%_8.33%_4.76%] rounded-[160px]" data-name="Knob">
                                          <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(0,0,0,0.02)] border-solid inset-[-0.8px] pointer-events-none rounded-[160.8px] shadow-[0px_0.4px_0.8px_0.16px_rgba(0,0,0,0.12)]" />
                                        </div>
                                        <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0px_1.6px_0px_rgba(0,0,0,0.02),inset_0px_0.8px_2.4px_0px_rgba(0,0,0,0.12)]" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-white col-2 justify-self-stretch relative rounded-[16px] row-1 self-start shrink-0" data-name="common_functions_card">
                                  <div className="flex flex-row items-center size-full">
                                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center px-[20px] py-[24px] relative w-full">
                                      <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-start min-h-px min-w-px relative" data-name="Container">
                                        <div className="bg-[#eef2ff] relative rounded-[16px] shrink-0 size-[44px]" data-name="common_functions_icon">
                                          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
                                            <div className="relative shrink-0 size-[20px]" data-name="Icon">
                                              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                                                <g id="Icon">
                                                  <path d={svgPaths.p17e613c0} id="Vector" stroke="var(--stroke-0, #615FFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                                  <path d={svgPaths.p3f362a80} id="Vector_2" stroke="var(--stroke-0, #615FFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                                  <path d={svgPaths.p3fbca400} id="Vector_3" stroke="var(--stroke-0, #615FFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                                  <path d={svgPaths.p1c1c7100} id="Vector_4" stroke="var(--stroke-0, #615FFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                                  <path d={svgPaths.p162c4500} id="Vector_5" stroke="var(--stroke-0, #615FFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                                  <path d="M10 10.8333H13.3333" id="Vector_6" stroke="var(--stroke-0, #615FFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                                  <path d={svgPaths.p3936ae00} id="Vector_7" stroke="var(--stroke-0, #615FFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                                  <path d="M10 6.66667H16.6667" id="Vector_8" stroke="var(--stroke-0, #615FFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                                  <path d={svgPaths.p868f800} id="Vector_9" stroke="var(--stroke-0, #615FFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                                  <path d={svgPaths.p23096600} id="Vector_10" stroke="var(--stroke-0, #615FFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                                  <path d={svgPaths.p217ce480} id="Vector_11" stroke="var(--stroke-0, #615FFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                                  <path d={svgPaths.p66d6d00} id="Vector_12" stroke="var(--stroke-0, #615FFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                                  <path d={svgPaths.p2a516600} id="Vector_13" stroke="var(--stroke-0, #615FFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                                </g>
                                              </svg>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex-[1_0_0] min-h-px min-w-px relative" data-name="Container">
                                          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start not-italic py-[3px] relative w-full">
                                            <p className="font-['Inter:Bold','Noto_Sans_SC:Bold','Noto_Sans_JP:Bold',sans-serif] font-bold leading-[20px] relative shrink-0 text-[14px] text-black tracking-[0.1px] w-full">长期记忆</p>
                                            <p className="font-['Inter:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[16px] relative shrink-0 text-[12px] text-[rgba(60,60,67,0.6)] tracking-[0.5px] w-full">记住用户的历史对话和工作偏好</p>
                                          </div>
                                        </div>
                                      </div>
                                      <Switch className="bg-[#0d6fff] content-stretch flex h-[24px] items-center justify-end overflow-clip p-[2px] relative rounded-[1000px] shrink-0 w-[42px]" />
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-white col-2 justify-self-stretch relative rounded-[16px] row-2 self-start shrink-0" data-name="common_functions_card">
                                  <div className="flex flex-row items-center size-full">
                                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center px-[20px] py-[24px] relative w-full">
                                      <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-start min-h-px min-w-px relative" data-name="Container">
                                        <div className="bg-[#ecfdf5] relative rounded-[16px] shrink-0 size-[44px]" data-name="common_functions_icon">
                                          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
                                            <div className="relative shrink-0 size-[20px]" data-name="Icon">
                                              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                                                <g id="Icon">
                                                  <path d="M10 5.83333V17.5" id="Vector" stroke="var(--stroke-0, #00BC7D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                                  <path d={svgPaths.p25713000} id="Vector_2" stroke="var(--stroke-0, #00BC7D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                                                </g>
                                              </svg>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex-[1_0_0] min-h-px min-w-px relative" data-name="Container">
                                          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start not-italic py-[3px] relative w-full">
                                            <p className="font-['Inter:Bold','Noto_Sans_SC:Bold','Noto_Sans_JP:Bold',sans-serif] font-bold leading-[20px] relative shrink-0 text-[14px] text-black tracking-[0.1px] w-full">知识库关联</p>
                                            <p className="font-['Inter:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[16px] relative shrink-0 text-[12px] text-[rgba(60,60,67,0.6)] tracking-[0.5px] w-full">自动检索并引用企业本地文档库</p>
                                          </div>
                                        </div>
                                      </div>
                                      <Switch className="bg-[#0d6fff] content-stretch flex h-[24px] items-center justify-end overflow-clip p-[2px] relative rounded-[1000px] shrink-0 w-[42px]" />
                                    </div>
                                  </div>
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
                                    <p className="leading-[24px]">启动数字员工</p>
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