import { useState } from "react";
import { motion } from "motion/react";
import svgPaths from "../../imports/svg-fhnyan6v4y";

import img0 from "figma:asset/770ed62317cd675f8958e89eea097b58b06fa1ad.png";
import img1 from "figma:asset/292ffa7b8d57010fc4c0fc3cdb4fab83466a995c.png";
import img2 from "figma:asset/499b4dc2cc776a5cd98a71f43dbe53743d938a31.png";
import img3 from "figma:asset/9b9f0881d219021e83d4d96b0db4ad5c55e1255b.png";
import img4 from "figma:asset/43b2c7e92f76bdb88cb13cfa482c4fa598c8d975.png";

const avatarImages = [img0, img1, img2, img3, img4];

// Toggle switch
function Switch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative h-[24px] w-[42px] rounded-[1000px] shrink-0 cursor-pointer transition-colors duration-200 p-[2px] ${
        enabled ? "bg-[#0d6fff]" : "bg-[rgba(0,0,0,0.09)]"
      }`}
    >
      <div
        className={`bg-white h-[20px] w-[20px] rounded-full shadow-[0px_0px_1px_0px_rgba(0,0,0,0.05),0px_0px_4px_0px_rgba(0,0,0,0.05),0px_0px_44px_0px_rgba(0,0,0,0.1)] transition-transform duration-200 ${
          enabled ? "translate-x-[18px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}

interface FunctionCard {
  id: string;
  icon: "search" | "memory" | "auto" | "knowledge";
  title: string;
  desc: string;
  enabled: boolean;
}

const defaultFunctions: FunctionCard[] = [
  { id: "search", icon: "search", title: "联网检索", desc: "允许实时搜索网络获取最新信息", enabled: true },
  { id: "memory", icon: "memory", title: "长期记忆", desc: "记住用户的历史对话和工作偏好", enabled: true },
  { id: "auto", icon: "auto", title: "自主执行", desc: "允许在无需确认的情况下执行常规任务", enabled: false },
  { id: "knowledge", icon: "knowledge", title: "知识库关联", desc: "自动检索并引用企业本地文档库", enabled: true },
];

function FunctionIcon({ type, enabled }: { type: string; enabled: boolean }) {
  const bgColors: Record<string, string> = {
    search: enabled ? "bg-[#eff6ff]" : "bg-[#f9fafb]",
    memory: enabled ? "bg-[#eef2ff]" : "bg-[#f9fafb]",
    auto: enabled ? "bg-[#fdfcec]" : "bg-[#f9fafb]",
    knowledge: enabled ? "bg-[#ecfdf5]" : "bg-[#f9fafb]",
  };
  const strokeColors: Record<string, string> = {
    search: enabled ? "#2B7FFF" : "#99A1AF",
    memory: enabled ? "#615FFF" : "#99A1AF",
    auto: enabled ? "#FFBE0A" : "#99A1AF",
    knowledge: enabled ? "#00BC7D" : "#99A1AF",
  };
  const stroke = strokeColors[type] || "#99A1AF";

  return (
    <div className={`${bgColors[type]} relative rounded-[16px] shrink-0 size-[44px] flex items-center justify-center`}>
      <div className="relative shrink-0 size-[20px]">
        <svg className="absolute block size-full" fill="none" viewBox="0 0 20 20">
          {type === "search" && (
            <g clipPath="url(#clip_search)">
              <path d={svgPaths.p14d24500} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              <path d={svgPaths.p17212180} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              <path d="M1.66667 10H18.3333" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
            </g>
          )}
          {type === "memory" && (
            <g>
              <path d={svgPaths.p17e613c0} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              <path d={svgPaths.p3f362a80} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              <path d={svgPaths.p3fbca400} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              <path d={svgPaths.p1c1c7100} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              <path d={svgPaths.p162c4500} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              <path d="M10 10.8333H13.3333" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              <path d={svgPaths.p3936ae00} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              <path d="M10 6.66667H16.6667" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              <path d={svgPaths.p868f800} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              <path d={svgPaths.p23096600} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              <path d={svgPaths.p217ce480} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              <path d={svgPaths.p66d6d00} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              <path d={svgPaths.p2a516600} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
            </g>
          )}
          {type === "auto" && (
            <g>
              <path d={svgPaths.p3a2fa580} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
            </g>
          )}
          {type === "knowledge" && (
            <g>
              <path d="M10 5.83333V17.5" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              <path d={svgPaths.p25713000} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
            </g>
          )}
          {type === "search" && (
            <defs>
              <clipPath id="clip_search">
                <rect fill="white" height="20" width="20" />
              </clipPath>
            </defs>
          )}
        </svg>
      </div>
    </div>
  );
}

interface Step3ConfirmProps {
  onBack: () => void;
  onFinish: () => void;
  employeeName: string;
  avatarIndex: number;
  description: string;
}

export function Step3Confirm({ onBack, onFinish, employeeName, avatarIndex, description }: Step3ConfirmProps) {
  const defaultTraits = [
    "沟通风格轻松自然，极具同理心，总是能第一时间察觉用户的情绪变化。",
    "遇到复杂的技术问题时，会展现出严谨的逻辑，并分步骤提供清晰的解决方案。",
    "如果遇到知识盲区，会坦诚承认并主动提出帮忙检索求证，绝不敷衍或编造。",
  ];

  const [traits, setTraits] = useState<string[]>(defaultTraits);
  const [newTrait, setNewTrait] = useState("");
  const [functions, setFunctions] = useState<FunctionCard[]>(defaultFunctions);

  const toggleFunction = (id: string) => {
    setFunctions((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
  };

  const deleteTrait = (index: number) => {
    setTraits((prev) => prev.filter((_, i) => i !== index));
  };

  const addTrait = () => {
    if (newTrait.trim()) {
      setTraits((prev) => [...prev, newTrait.trim()]);
      setNewTrait("");
    }
  };

  const avatarSrc = avatarImages[avatarIndex] || avatarImages[3];

  return (
    <div className="flex flex-col items-center size-full overflow-auto">
      <div className="flex flex-col items-center px-[60px] size-full">
        <div className="flex-1 max-w-[768px] w-full">
          <div className="flex flex-col gap-[32px] items-center py-[48px] size-full">
            {/* Title */}
            <div className="shrink-0 w-full">
              <div className="flex flex-col gap-[8px]">
                <p className="font-['Inter:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[32px] text-[24px] text-black">数字员工已生成</p>
                <p className="font-['Inter:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[20px] text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.1px]">AI 已根据您的描述提取了以下特性，请确认或继续编辑功能开关</p>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 w-full flex flex-col gap-[24px] items-center overflow-auto">
              {/* ID Card */}
              <div className="bg-white relative rounded-[24px] shrink-0 w-full overflow-hidden">
                {/* Glow effect */}
                <div className="absolute right-[-70px] top-[-120px] size-[200px] pointer-events-none">
                  <div className="absolute inset-[-80%]">
                    <svg className="block size-full" fill="none" viewBox="0 0 520 520">
                      <g filter="url(#filter0_glow)" opacity="0.3">
                        <circle cx="260" cy="260" fill="url(#paint0_glow)" r="100" />
                      </g>
                      <defs>
                        <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="520" id="filter0_glow" width="520" x="0" y="0">
                          <feFlood floodOpacity="0" result="BackgroundImageFix" />
                          <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                          <feGaussianBlur result="effect1" stdDeviation="80" />
                        </filter>
                        <linearGradient gradientUnits="userSpaceOnUse" id="paint0_glow" x1="214.986" x2="304.514" y1="195.952" y2="343.991">
                          <stop offset="0.126524" stopColor="#E4FFDB" />
                          <stop offset="0.5625" stopColor="#96FF46" />
                          <stop offset="0.9375" stopColor="#51FFBC" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>

                <div className="flex gap-[24px] items-start p-[24px] relative">
                  <div className="relative rounded-full shrink-0 size-[80px]">
                    <img alt="" className="absolute inset-0 object-cover pointer-events-none rounded-full size-full" src={avatarSrc} />
                  </div>
                  <div className="flex flex-1 flex-col gap-[8px] items-start">
                    <div className="flex gap-[12px] items-center w-full">
                      <p className="font-['Inter:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[28px] text-[22px] text-black">{employeeName}</p>
                      <div className="bg-[#edffdc] rounded-[8px] shrink-0">
                        <div className="flex gap-[6px] items-center px-[10px] py-[4px]">
                          <div className="relative shrink-0 size-[6px]">
                            <svg className="absolute block size-full" fill="none" viewBox="0 0 6 6">
                              <circle cx="3" cy="3" fill="#4EA100" opacity="0.853384" r="3" />
                            </svg>
                          </div>
                          <p className="font-['Inter:Bold',sans-serif] font-bold leading-[16px] text-[#4ea100] text-[11px] tracking-[0.5px]">ONLINE</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[rgba(143,143,154,0.1)] relative rounded-[16px] w-full">
                      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.05)] inset-0 pointer-events-none rounded-[16px]" />
                      <div className="flex items-center p-[17px] w-full">
                        <p className="font-['Inter:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[20px] text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.25px]">"保持专注与热情，随时准备为您提供最高效的工作支持 ✨"</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.05)] inset-0 pointer-events-none rounded-[24px]" />
              </div>

              {/* Persona Traits */}
              <div className="flex flex-col gap-[16px] items-start shrink-0 w-full">
                <p className="font-['Inter:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[20px] text-[14px] text-black tracking-[0.1px]">系统提取特性设定 (Persona)</p>
                <div className="flex flex-col gap-[12px] items-start w-full">
                  {traits.map((trait, i) => (
                    <motion.div
                      key={`trait-${i}-${trait.slice(0, 10)}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="bg-white relative rounded-[16px] w-full"
                    >
                      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.05)] inset-0 pointer-events-none rounded-[16px]" />
                      <div className="flex gap-[12px] items-center px-[24px] py-[16px] w-full">
                        <div className="bg-[#b2e40d] rounded-[3px] shrink-0 size-[6px]" />
                        <p className="flex-1 font-['Inter:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[20px] text-[14px] text-black tracking-[0.25px]">{trait}</p>
                        <button
                          onClick={() => deleteTrait(i)}
                          className="overflow-clip relative shrink-0 size-[18px] cursor-pointer bg-transparent border-none p-0 hover:opacity-70 transition-opacity"
                        >
                          <svg className="absolute block size-full" fill="none" viewBox="0 0 32 32"><g /></svg>
                          <div className="absolute inset-[12.5%_20.83%]">
                            <svg className="absolute block size-full" fill="none" viewBox="0 0 10.5 13.5">
                              <path d={svgPaths.p23234d00} fill="#4D4D4D" fillOpacity="0.25" />
                            </svg>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  {/* Add new trait */}
                  <div className="bg-white relative rounded-[16px] w-full">
                    <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.05)] inset-0 pointer-events-none rounded-[16px]" />
                    <div className="flex gap-[12px] items-center px-[24px] py-[16px] w-full">
                      <div className="overflow-clip relative shrink-0 size-[18px]">
                        <svg className="absolute block size-full" fill="none" viewBox="0 0 32 32"><g /></svg>
                        <div className="absolute inset-[20.83%]">
                          <svg className="absolute block size-full" fill="none" viewBox="0 0 10.5 10.5">
                            <path d={svgPaths.p27b8f180} fill="#4D4D4D" fillOpacity="0.25" />
                          </svg>
                        </div>
                      </div>
                      <input
                        value={newTrait}
                        onChange={(e) => setNewTrait(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addTrait()}
                        placeholder="输入性格或行为准则，按回车添加..."
                        className="flex-1 font-['Inter:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[20px] text-[14px] text-black tracking-[0.25px] placeholder:text-[rgba(60,60,67,0.6)] bg-transparent outline-none border-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Common Functions */}
              <div className="flex flex-col gap-[16px] items-start shrink-0 w-full">
                <p className="font-['Inter:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[20px] text-[14px] text-black tracking-[0.1px]">系统提取特性设定 (Persona)</p>
                <div className="grid grid-cols-2 gap-[16px] w-full">
                  {functions.map((fn) => (
                    <div key={fn.id} className="bg-white relative rounded-[16px]">
                      <div className="flex gap-[12px] items-center px-[20px] py-[24px] w-full">
                        <div className="flex flex-1 gap-[12px] items-start">
                          <FunctionIcon type={fn.icon} enabled={fn.enabled} />
                          <div className="flex-1 flex flex-col gap-[2px] py-[3px]">
                            <p className="font-['Inter:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[20px] text-[14px] text-black tracking-[0.1px]">{fn.title}</p>
                            <p className="font-['Inter:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[16px] text-[12px] text-[rgba(60,60,67,0.6)] tracking-[0.5px]">{fn.desc}</p>
                          </div>
                        </div>
                        <Switch enabled={fn.enabled} onToggle={() => toggleFunction(fn.id)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="h-[80px] relative shrink-0 w-full border-t border-[rgba(0,0,0,0.05)]">
              <div className="absolute left-0 top-1/2 -translate-y-1/2">
                <motion.button
                  onClick={onBack}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-[rgba(143,143,154,0.1)] flex items-center rounded-[100px] px-[36px] py-[16px] cursor-pointer"
                >
                  <p className="font-['Inter:Medium',sans-serif] font-medium leading-[24px] text-[16px] text-black tracking-[0.15px]">返回</p>
                </motion.button>
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <motion.button
                  onClick={onFinish}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-[#b2e40d] flex items-center gap-[8px] rounded-[100px] pl-[36px] pr-[24px] py-[16px] cursor-pointer"
                >
                  <p className="font-['Inter:Medium',sans-serif] font-medium leading-[24px] text-[16px] text-black tracking-[0.15px]">启动数字员工</p>
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