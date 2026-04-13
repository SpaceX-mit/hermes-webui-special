import { useState } from "react";
import { motion } from "motion/react";
import svgPaths from "../../imports/svg-4u9fkfc7mx";

const providers = [
  { id: "openai", name: "OpenAI", desc: "官方直连" },
  { id: "anthropic", name: "Anthropic", desc: "Claude 模型" },
  { id: "compatible", name: "兼容 OpenAI", desc: "私有化部署 / 代理" },
];

export function Step2ApiKey({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4o");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");

  return (
    <div className="flex flex-col items-center size-full overflow-auto">
      <div className="flex flex-col items-center px-[60px] size-full">
        <div className="flex-1 max-w-[768px] w-full">
          <div className="flex flex-col gap-[32px] items-center py-[48px] size-full">
            {/* Title */}
            <div className="h-[60px] shrink-0 w-full">
              <div className="flex flex-col gap-[8px]">
                <p className="font-['Inter:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[32px] text-[24px] text-black">自定义 API Key</p>
                <p className="font-['Inter:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[20px] text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.1px]">接入您已有的大模型账户</p>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 w-full flex flex-col gap-[16px]">
              {/* Provider selection */}
              <div className="flex flex-col gap-[4px] w-full">
                <p className="font-['Inter:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[20px] text-[14px] text-black tracking-[0.1px]">服务提供商</p>
                <div className="flex gap-[12px] w-full">
                  {providers.map((p) => (
                    <motion.div
                      key={p.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedProvider(p.id)}
                      className="bg-white flex-1 rounded-[16px] cursor-pointer relative"
                    >
                      {selectedProvider === p.id && (
                        <div className="absolute border border-[#b2e40d] border-solid inset-0 pointer-events-none rounded-[16px]" />
                      )}
                      <div className="flex flex-col gap-[4px] px-[24px] py-[20px]">
                        <div className="flex items-center justify-between h-[24px]">
                          <p className={`font-['Inter:Bold',sans-serif] font-bold leading-[24px] text-[16px] tracking-[0.15px] ${selectedProvider === p.id ? "text-[#b2e40d]" : "text-black"}`}>{p.name}</p>
                          {selectedProvider === p.id && <div className="bg-[#b2e40d] rounded-full size-[8px]" />}
                        </div>
                        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] text-[12px] text-[rgba(60,60,67,0.6)] tracking-[0.5px]">{p.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Form */}
              <div className="bg-white rounded-[24px] w-full relative">
                <div className="absolute border border-[rgba(0,0,0,0.05)] inset-0 pointer-events-none rounded-[24px]" />
                <div className="flex flex-col gap-[32px] px-[24px] py-[36px]">
                  {/* Model name */}
                  <div className="flex flex-col gap-[8px]">
                    <div className="flex gap-[8px] items-center">
                      <div className="overflow-clip relative size-[16px]">
                        <svg className="absolute block size-full" fill="none" viewBox="0 0 32 32"><g /></svg>
                        <div className="absolute inset-[12.5%]">
                          <svg className="absolute block size-full" fill="none" viewBox="0 0 12 12">
                            <path d={svgPaths.p33a6d970} fill="#3C3C43" fillOpacity="0.6" />
                          </svg>
                        </div>
                      </div>
                      <p className="font-['Inter:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[20px] text-[14px] text-black tracking-[0.1px]">模型名称 (Model)</p>
                    </div>
                    <input
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="bg-[#f9fafb] h-[46px] rounded-[14px] w-full px-[16px] py-[12px] font-['Inter:Regular',sans-serif] font-normal text-[14px] text-black tracking-[0.25px] outline-none border border-transparent focus:border-[#b2e40d] transition-colors"
                      placeholder="gpt-4o"
                    />
                  </div>

                  {/* Base URL */}
                  <div className="flex flex-col gap-[8px]">
                    <div className="flex gap-[8px] items-center">
                      <div className="overflow-clip relative size-[16px]">
                        <svg className="absolute block size-full" fill="none" viewBox="0 0 32 32"><g /></svg>
                        <div className="absolute inset-[29.17%_8.33%]">
                          <svg className="absolute block size-full" fill="none" viewBox="0 0 13.3333 6.66667">
                            <path d={svgPaths.p37480900} fill="#3C3C43" fillOpacity="0.6" />
                          </svg>
                        </div>
                      </div>
                      <p className="font-['Inter:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[20px] text-[14px] text-black tracking-[0.1px]">API 接口地址 (Base URL)</p>
                    </div>
                    <input
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      className="bg-[#f9fafb] h-[46px] rounded-[14px] w-full px-[16px] py-[12px] font-['Inter:Regular',sans-serif] font-normal text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.25px] outline-none border border-transparent focus:border-[#b2e40d] transition-colors"
                      placeholder="https://api.openai.com/v1"
                    />
                  </div>

                  {/* API Key */}
                  <div className="flex flex-col gap-[8px]">
                    <div className="flex gap-[8px] items-center">
                      <div className="overflow-clip relative size-[16px]">
                        <svg className="absolute block size-full" fill="none" viewBox="0 0 32 32"><g /></svg>
                        <div className="absolute inset-[20.83%_0]">
                          <svg className="absolute block size-full" fill="none" viewBox="0 0 16 9.33333">
                            <path d={svgPaths.p59e3700} fill="#3C3C43" fillOpacity="0.6" />
                          </svg>
                        </div>
                      </div>
                      <p className="font-['Inter:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[20px] text-[14px] text-black tracking-[0.1px]">API 密钥 (API Key)</p>
                    </div>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="bg-[#f9fafb] h-[46px] rounded-[14px] w-full px-[16px] py-[12px] font-['Inter:Regular',sans-serif] font-normal text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.25px] outline-none border border-transparent focus:border-[#b2e40d] transition-colors"
                      placeholder="sk-..."
                    />
                    <p className="font-['Inter:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[16px] text-[11px] text-[rgba(60,60,67,0.6)] tracking-[0.5px]">此密钥仅储存在本地，不会上传至我们的服务器。</p>
                  </div>
                </div>
              </div>

              {/* Info banner */}
              <div className="bg-[#f5f8fd] rounded-[16px] w-full relative">
                <div className="absolute border border-[rgba(0,0,0,0.05)] inset-0 pointer-events-none rounded-[16px]" />
                <div className="flex gap-[12px] items-center px-[25px] py-[13px]">
                  <div className="bg-[#e1ecfe] rounded-full shrink-0 size-[32px] flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d={svgPaths.p37f49070} stroke="#206CFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                      <path d={svgPaths.p17134c00} stroke="#206CFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                    </svg>
                  </div>
                  <p className="flex-1 font-['Inter:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[16px] text-[#001749] text-[12px] tracking-[0.5px]">测试连通性：在保存配置前，我们将向该接口发送一条测试请求，以确保您的密钥和模型名称可用。</p>
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
