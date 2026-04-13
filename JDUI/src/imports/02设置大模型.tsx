import svgPaths from "./svg-u04j30wovc";

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
type ModelIconProps = {
  className?: string;
  property1?: "自定义" | "Spacemit";
};

function ModelIcon({ className, property1 = "自定义" }: ModelIconProps) {
  const isSpacemit = property1 === "Spacemit";
  return (
    <div className={className || `relative rounded-[16px] size-[56px] ${isSpacemit ? "bg-black overflow-clip" : "bg-[#f9fafb] content-stretch flex items-center justify-center px-[14px]"}`}>
      {property1 === "自定义" && (
        <div className="relative shrink-0 size-[32px]" data-name="Icons / Settings">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
              <g id="Vector" />
            </svg>
            <div className="absolute inset-[8.33%_9.48%_8.33%_9.46%]" data-name="Vector">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.939 26.6667">
                <path d={svgPaths.p2ea7ac00} fill="var(--fill-0, #3C3C43)" fillOpacity="0.6" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
      )}
      {isSpacemit && (
        <>
          <div className="-translate-x-1/2 -translate-y-1/2 absolute flex h-[39.667px] items-center justify-center left-1/2 top-[calc(50%+19.83px)] w-[66.266px]">
            <div className="-scale-y-100 flex-none rotate-180">
              <div className="h-[39.667px] relative w-[66.266px]">
                <div className="absolute inset-[-47.06%_-28.17%]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 103.6 77">
                    <g filter="url(#filter0_f_1_1133)" id="Group 16">
                      <path d={svgPaths.pc1ebf00} fill="url(#paint0_linear_1_1133)" id="Exclude (Stroke)" opacity="0.3" />
                      <path d={svgPaths.p3bd1e00} fill="url(#paint1_linear_1_1133)" id="Exclude (Stroke)_2" opacity="0.3" />
                    </g>
                    <defs>
                      <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="77" id="filter0_f_1_1133" width="103.6" x="-1.27184e-07" y="0">
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                        <feGaussianBlur result="effect1_foregroundBlur_1_1133" stdDeviation="9.33333" />
                      </filter>
                      <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_1133" x1="34.3" x2="50.8667" y1="36.05" y2="36.4">
                        <stop stopColor="#D4ECFF" />
                        <stop offset="1" stopColor="#1CFBFF" />
                      </linearGradient>
                      <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_1_1133" x1="69.1833" x2="50.5167" y1="29.9833" y2="30.6833">
                        <stop stopColor="#6FED31" />
                        <stop offset="1" stopColor="#51FF51" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%-0.02px)] size-[33.099px] top-[calc(50%-0.02px)]" data-name="Exclude (Stroke)">
            <div className="absolute inset-[-21.86%_-24.68%_-27.5%_-24.68%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 49.4361 49.4361">
                <g filter="url(#filter0_d_1_1180)" id="Exclude (Stroke)">
                  <path d={svgPaths.p35b27980} fill="url(#paint0_linear_1_1180)" />
                </g>
                <defs>
                  <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="49.4361" id="filter0_d_1_1180" width="49.4361" x="-4.76837e-07" y="-2.98023e-07">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                    <feOffset dy="0.933333" />
                    <feGaussianBlur stdDeviation="4.66667" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.2 0" />
                    <feBlend in2="BackgroundImageFix" mode="plus-lighter" result="effect1_dropShadow_1_1180" />
                    <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_1180" mode="normal" result="shape" />
                  </filter>
                  <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_1180" x1="17.2683" x2="32.085" y1="13.185" y2="37.685">
                    <stop offset="0.126524" stopColor="#E4FFDB" />
                    <stop offset="0.5625" stopColor="#96FF46" />
                    <stop offset="0.9375" stopColor="#51FFBC" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%-0.02px)] size-[33.099px] top-[calc(50%-0.02px)]" data-name="Exclude (Stroke)">
            <div className="absolute inset-[2.11%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 31.7027 31.7027">
                <g filter="url(#filter0_f_1_1188)" id="Exclude (Stroke)">
                  <path d={svgPaths.p2f5d3900} stroke="url(#paint0_linear_1_1188)" strokeWidth="0.233333" />
                </g>
                <defs>
                  <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="31.7027" id="filter0_f_1_1188" width="31.7027" x="2.98023e-08" y="2.98023e-08">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                    <feGaussianBlur result="effect1_foregroundBlur_1_1188" stdDeviation="0.233333" />
                  </filter>
                  <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_1188" x1="12.485" x2="18.6683" y1="1.75164" y2="31.2683">
                    <stop stopColor="white" />
                    <stop offset="1" stopColor="white" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Component({ className }: { className?: string }) {
  return (
    <div className={className || "content-stretch flex h-[1080px] isolate items-start overflow-clip relative rounded-[24px] w-[1440px]"} data-name="02 设置大模型">
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
                                <p className="font-['Inter:Bold','Noto_Sans_JP:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[32px] relative shrink-0 text-[24px] text-black">设置大模型</p>
                                <p className="font-['Inter:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.1px]">为您的数字员工配备合适的大脑</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex-[863_0_0] min-h-px min-w-px relative w-full" data-name="Container">
                          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] items-start overflow-clip relative rounded-[inherit] size-full">
                            <div className="bg-white flex-[1_0_0] h-[420px] min-h-px min-w-px relative rounded-[24px]" data-name="model_card">
                              <div className="overflow-clip rounded-[inherit] size-full">
                                <div className="content-stretch flex flex-col gap-[24px] items-start p-[32px] relative size-full">
                                  <div className="absolute right-[-24px] size-[200px] top-[-90px]">
                                    <div className="absolute inset-[-80%]">
                                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 520 520">
                                        <g filter="url(#filter0_f_1_1186)" id="Ellipse 2" opacity="0.6">
                                          <circle cx="260" cy="260" fill="url(#paint0_linear_1_1186)" r="100" />
                                        </g>
                                        <defs>
                                          <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="520" id="filter0_f_1_1186" width="520" x="0" y="0">
                                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                                            <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                                            <feGaussianBlur result="effect1_foregroundBlur_1_1186" stdDeviation="80" />
                                          </filter>
                                          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_1186" x1="214.986" x2="304.514" y1="195.952" y2="343.991">
                                            <stop offset="0.126524" stopColor="#E4FFDB" />
                                            <stop offset="0.5625" stopColor="#96FF46" />
                                            <stop offset="0.9375" stopColor="#51FFBC" />
                                          </linearGradient>
                                        </defs>
                                      </svg>
                                    </div>
                                  </div>
                                  <div className="content-stretch flex h-[56px] items-start justify-between relative shrink-0 w-full" data-name="Container">
                                    <ModelIcon className="bg-black relative rounded-[16px] shrink-0 size-[56px]" property1="Spacemit" />
                                    <div className="bg-[#b2e40d] h-[24px] relative rounded-[33554400px] shrink-0" data-name="Text">
                                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex h-full items-center px-[12px] py-[4px] relative">
                                        <p className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[12px] text-black tracking-[0.5px] whitespace-nowrap">推荐方案</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative w-full" data-name="Container">
                                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start min-h-px min-w-px not-italic overflow-clip relative w-full" data-name="Container">
                                      <p className="font-['Inter:Bold','Noto_Sans_JP:Bold',sans-serif] font-bold leading-[28px] relative shrink-0 text-[22px] text-black w-full">使用 Spacemit 引擎</p>
                                      <p className="font-['Inter:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.25px] w-full">无需繁琐配置，订阅即刻拥有 GPT-5 与 Claude 4 的双重推理能力。适合大多数寻求高效体验的用户。</p>
                                    </div>
                                    <div className="h-[56px] relative shrink-0 w-full" data-name="Container">
                                      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.05)] border-solid border-t inset-0 pointer-events-none" />
                                      <div className="absolute content-stretch flex gap-[8px] items-center left-0 top-[20px]" data-name="Container">
                                        <div className="relative shrink-0 size-[16px]" data-name="Icons / Check">
                                          <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
                                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                                              <g id="Vector" />
                                            </svg>
                                            <div className="absolute inset-[23.29%_12.5%_20.83%_14.21%]" data-name="Vector">
                                              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.7267 8.94">
                                                <path d={svgPaths.p13a00480} fill="var(--fill-0, #4EA100)" id="Vector" />
                                              </svg>
                                            </div>
                                          </div>
                                        </div>
                                        <p className="font-['Inter:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(60,60,67,0.6)] tracking-[0.5px] whitespace-nowrap">低门槛 / 全托管</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div aria-hidden="true" className="absolute border border-[#b2e40d] border-solid inset-0 pointer-events-none rounded-[24px]" />
                            </div>
                            <div className="bg-white flex-[1_0_0] h-[420px] min-h-px min-w-px relative rounded-[24px]" data-name="model_card">
                              <div className="overflow-clip rounded-[inherit] size-full">
                                <div className="content-stretch flex flex-col gap-[24px] items-start p-[32px] relative size-full">
                                  <div className="content-stretch flex h-[56px] items-start justify-between relative shrink-0 w-full" data-name="Container">
                                    <div className="bg-[#f9fafb] relative rounded-[16px] shrink-0 size-[56px]" data-name="Model icon">
                                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[14px] relative size-full">
                                        <div className="relative shrink-0 size-[32px]" data-name="Icons / Settings">
                                          <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
                                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                                              <g id="Vector" />
                                            </svg>
                                            <div className="absolute inset-[8.33%_9.48%_8.33%_9.46%]" data-name="Vector">
                                              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.939 26.6667">
                                                <path d={svgPaths.p2ea7ac00} fill="var(--fill-0, #3C3C43)" fillOpacity="0.6" id="Vector" />
                                              </svg>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="bg-[rgba(143,143,154,0.1)] h-[24px] relative rounded-[33554400px] shrink-0" data-name="Text">
                                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex h-full items-center px-[12px] py-[4px] relative">
                                        <p className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(60,60,67,0.6)] tracking-[0.5px] whitespace-nowrap">高级路径</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative w-full" data-name="Container">
                                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start min-h-px min-w-px not-italic overflow-clip relative w-full" data-name="Container">
                                      <p className="font-['Inter:Bold','Noto_Sans_JP:Bold',sans-serif] font-bold leading-[28px] relative shrink-0 text-[22px] text-black w-full">自定义 API Key</p>
                                      <p className="font-['Inter:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.25px] w-full">接入您已有的 OpenAI 或 Anthropic 账户。支持自定义模型参数，更适合开发者与企业级深度应用。</p>
                                    </div>
                                    <div className="h-[56px] relative shrink-0 w-full" data-name="Container">
                                      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.05)] border-solid border-t inset-0 pointer-events-none" />
                                      <div className="absolute content-stretch flex gap-[8px] items-center left-0 top-[20px]" data-name="Container">
                                        <div className="relative shrink-0 size-[16px]" data-name="Icons / Settings">
                                          <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
                                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                                              <g id="Vector" />
                                            </svg>
                                            <div className="absolute inset-[8.33%_9.48%_8.33%_9.46%]" data-name="Vector">
                                              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.9695 13.3333">
                                                <path d={svgPaths.p161c8f80} fill="var(--fill-0, #3C3C43)" fillOpacity="0.6" id="Vector" />
                                              </svg>
                                            </div>
                                          </div>
                                        </div>
                                        <p className="font-['Inter:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(60,60,67,0.6)] tracking-[0.5px] whitespace-nowrap">高灵活 / 自研首选</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.05)] border-solid inset-0 pointer-events-none rounded-[24px]" />
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