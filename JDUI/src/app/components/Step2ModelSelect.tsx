import { useState } from "react";
import { motion } from "motion/react";
import svgPaths from "../../imports/svg-u04j30wovc";

function SpacemitIcon() {
  return (
    <div className="bg-black relative rounded-[16px] shrink-0 size-[56px] overflow-clip">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex h-[39.667px] items-center justify-center left-1/2 top-[calc(50%+19.83px)] w-[66.266px]">
        <div className="-scale-y-100 rotate-180">
          <div className="h-[39.667px] relative w-[66.266px]">
            <div className="absolute inset-[-47.06%_-28.17%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 103.6 77">
                <g filter="url(#filter0_f_spacemit)" opacity="0.3">
                  <path d={svgPaths.pc1ebf00} fill="url(#paint0_linear_spacemit)" />
                  <path d={svgPaths.p3bd1e00} fill="url(#paint1_linear_spacemit)" />
                </g>
                <defs>
                  <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="77" id="filter0_f_spacemit" width="103.6" x="0" y="0">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                    <feGaussianBlur result="effect1" stdDeviation="9.33333" />
                  </filter>
                  <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_spacemit" x1="34.3" x2="50.8667" y1="36.05" y2="36.4">
                    <stop stopColor="#D4ECFF" />
                    <stop offset="1" stopColor="#1CFBFF" />
                  </linearGradient>
                  <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_spacemit" x1="69.1833" x2="50.5167" y1="29.9833" y2="30.6833">
                    <stop stopColor="#6FED31" />
                    <stop offset="1" stopColor="#51FF51" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[33.099px] top-1/2">
        <div className="absolute inset-[-21.86%_-24.68%_-27.5%_-24.68%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 49.4361 49.4361">
            <g filter="url(#filter0_d_spacemit2)">
              <path d={svgPaths.p35b27980} fill="url(#paint0_linear_spacemit2)" />
            </g>
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="49.4361" id="filter0_d_spacemit2" width="49.4361" x="0" y="0">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                <feOffset dy="0.933333" />
                <feGaussianBlur stdDeviation="4.66667" />
                <feComposite in2="hardAlpha" operator="out" />
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.2 0" />
                <feBlend in2="BackgroundImageFix" mode="plus-lighter" result="effect1" />
                <feBlend in="SourceGraphic" in2="effect1" mode="normal" result="shape" />
              </filter>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_spacemit2" x1="17.2683" x2="32.085" y1="13.185" y2="37.685">
                <stop offset="0.126524" stopColor="#E4FFDB" />
                <stop offset="0.5625" stopColor="#96FF46" />
                <stop offset="0.9375" stopColor="#51FFBC" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}

function SettingsIcon() {
  return (
    <div className="bg-[#f9fafb] rounded-[16px] shrink-0 size-[56px] flex items-center justify-center">
      <div className="relative size-[32px]">
        <svg className="absolute block size-full" fill="none" viewBox="0 0 32 32"><g /></svg>
        <div className="absolute inset-[8.33%_9.48%_8.33%_9.46%]">
          <svg className="absolute block size-full" fill="none" viewBox="0 0 25.939 26.6667">
            <path d={svgPaths.p2ea7ac00} fill="#3C3C43" fillOpacity="0.6" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function Step2ModelSelect({ onNext, onCustomApiKey }: { onNext: () => void; onCustomApiKey: () => void }) {
  const [selected, setSelected] = useState<"spacemit" | "custom">("spacemit");

  return (
    <div className="flex flex-col items-center size-full overflow-auto">
      <div className="flex flex-col items-center px-[60px] size-full">
        <div className="flex-1 max-w-[768px] w-full">
          <div className="flex flex-col gap-[32px] items-center py-[48px] size-full">
            {/* Title */}
            <div className="shrink-0 w-full">
              <div className="flex flex-col gap-[8px]">
                <p className="font-['Inter:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[32px] text-[24px] text-black">设置大模型</p>
                <p className="font-['Inter:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[20px] text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.1px]">为您的数字员工配备合适的大脑</p>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 w-full flex gap-[16px]">
              {/* Spacemit card */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelected("spacemit")}
                className={`bg-white flex-1 h-[420px] relative rounded-[24px] cursor-pointer overflow-clip transition-all`}
              >
                <div className="flex flex-col gap-[24px] items-start p-[32px] size-full">
                  {/* Glow */}
                  <div className="absolute right-[-24px] size-[200px] top-[-90px]">
                    <div className="absolute inset-[-80%]">
                      <svg className="block size-full" fill="none" viewBox="0 0 520 520">
                        <g filter="url(#glow1)" opacity="0.6">
                          <circle cx="260" cy="260" fill="url(#glowGrad1)" r="100" />
                        </g>
                        <defs>
                          <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="520" id="glow1" width="520" x="0" y="0">
                            <feFlood floodOpacity="0" result="bg" />
                            <feBlend in="SourceGraphic" in2="bg" mode="normal" result="shape" />
                            <feGaussianBlur result="blur" stdDeviation="80" />
                          </filter>
                          <linearGradient gradientUnits="userSpaceOnUse" id="glowGrad1" x1="214.986" x2="304.514" y1="195.952" y2="343.991">
                            <stop offset="0.126524" stopColor="#E4FFDB" />
                            <stop offset="0.5625" stopColor="#96FF46" />
                            <stop offset="0.9375" stopColor="#51FFBC" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>

                  <div className="flex items-start justify-between shrink-0 w-full h-[56px]">
                    <SpacemitIcon />
                    <div className="bg-[#b2e40d] h-[24px] rounded-[33554400px] flex items-center px-[12px] py-[4px]">
                      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] text-[12px] text-black tracking-[0.5px]">推荐方案</p>
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 w-full">
                    <div className="flex flex-col gap-[12px] flex-1 overflow-clip">
                      <p className="font-['Inter:Bold',sans-serif] font-bold leading-[28px] text-[22px] text-black">使用 Spacemit 引擎</p>
                      <p className="font-['Inter:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[20px] text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.25px]">无需繁琐配置，订阅即刻拥有 GPT-5 与 Claude 4 的双重推理能力。适合大多数寻求高效体验的用户。</p>
                    </div>
                    <div className="h-[56px] w-full relative">
                      <div className="absolute border-t border-[rgba(0,0,0,0.05)] inset-0 pointer-events-none" />
                      <div className="absolute flex gap-[8px] items-center left-0 top-[20px]">
                        <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                          <path d={svgPaths.p13a00480} fill="#4EA100" transform="translate(4, 6)" />
                        </svg>
                        <p className="font-['Inter:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[16px] text-[12px] text-[rgba(60,60,67,0.6)] tracking-[0.5px]">低门槛 / 全托管</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`absolute border-2 inset-0 pointer-events-none rounded-[24px] transition-colors ${selected === "spacemit" ? "border-[#b2e40d]" : "border-transparent"}`} />
              </motion.div>

              {/* Custom API Key card */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => {
                  setSelected("custom");
                  onCustomApiKey();
                }}
                className="bg-white flex-1 h-[420px] relative rounded-[24px] cursor-pointer overflow-clip"
              >
                <div className="flex flex-col gap-[24px] items-start p-[32px] size-full">
                  <div className="flex items-start justify-between shrink-0 w-full h-[56px]">
                    <SettingsIcon />
                    <div className="bg-[rgba(143,143,154,0.1)] h-[24px] rounded-[33554400px] flex items-center px-[12px] py-[4px]">
                      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] text-[12px] text-[rgba(60,60,67,0.6)] tracking-[0.5px]">高级路径</p>
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 w-full">
                    <div className="flex flex-col gap-[12px] flex-1 overflow-clip">
                      <p className="font-['Inter:Bold',sans-serif] font-bold leading-[28px] text-[22px] text-black">自定义 API Key</p>
                      <p className="font-['Inter:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[20px] text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.25px]">接入您已有的 OpenAI 或 Anthropic 账户。支持自定义模型参数，更适合开发者与企业级深度应用。</p>
                    </div>
                    <div className="h-[56px] w-full relative">
                      <div className="absolute border-t border-[rgba(0,0,0,0.05)] inset-0 pointer-events-none" />
                      <div className="absolute flex gap-[8px] items-center left-0 top-[20px]">
                        <div className="relative size-[16px]">
                          <svg className="absolute block size-full" fill="none" viewBox="0 0 32 32"><g /></svg>
                          <div className="absolute inset-[8.33%_9.48%_8.33%_9.46%]">
                            <svg className="absolute block size-full" fill="none" viewBox="0 0 12.9695 13.3333">
                              <path d={svgPaths.p161c8f80} fill="#3C3C43" fillOpacity="0.6" />
                            </svg>
                          </div>
                        </div>
                        <p className="font-['Inter:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[16px] text-[12px] text-[rgba(60,60,67,0.6)] tracking-[0.5px]">高灵活 / 自研首选</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`absolute border-2 inset-0 pointer-events-none rounded-[24px] transition-colors ${selected === "custom" ? "border-[#b2e40d]" : "border-[rgba(0,0,0,0.05)]"}`} />
              </motion.div>
            </div>

            {/* Button */}
            <div className="h-[80px] relative shrink-0 w-full border-t border-[rgba(0,0,0,0.05)]">
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <motion.button
                  onClick={onNext}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-[#b2e40d] flex items-center gap-[8px] rounded-[100px] pl-[36px] pr-[24px] py-[16px] cursor-pointer"
                >
                  <p className="font-['Inter:Medium',sans-serif] font-medium leading-[24px] text-[16px] text-black tracking-[0.15px]">下一步</p>
                  <div className="overflow-clip relative size-[24px]">
                    <svg className="absolute block size-full" fill="none" viewBox="0 0 32 32"><g /></svg>
                    <div className="absolute inset-[16.67%]">
                      <svg className="absolute block size-full" fill="none" viewBox="0 0 16 16">
                        <path d={svgPaths.p14168ea0} fill="black" />
                      </svg>
                    </div>
                  </div>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
