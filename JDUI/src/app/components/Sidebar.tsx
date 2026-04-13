import svgPaths from "../../imports/svg-fw1aeva7px";

export function Sidebar({ currentStep }: { currentStep: number }) {
  return (
    <div className="bg-[#232323] h-full shrink-0 w-[320px] z-[2] flex flex-col items-center">
      <div className="flex flex-col items-center justify-between pt-[12px] size-full">
        {/* Logo */}
        <div className="shrink-0 w-full">
          <div className="flex items-center pl-[36px] pr-[24px] py-[16px] w-full">
            <div className="h-[60px] relative shrink-0 w-[180px]">
              <div className="absolute inset-[10.23%_80.06%_19.7%_1.77%]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32.7102 42.0441">
                  <g>
                    <path d={svgPaths.p31ca4e00} fill="#B0E237" />
                    <path d={svgPaths.p174b6100} fill="#C0E767" />
                    <path d={svgPaths.p2a1d9b00} fill="#D0EE90" />
                  </g>
                </svg>
              </div>
              <div className="absolute inset-[23.71%_4.04%_19.69%_24.82%]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 128.061 33.9584">
                  <g>
                    <path d={svgPaths.p370f000} fill="#E5E5E5" />
                    <path d={svgPaths.p2b7ff300} fill="#E5E5E5" />
                    <path d={svgPaths.p1eb8ce00} fill="#E5E5E5" />
                    <path d={svgPaths.p3d2adf00} fill="#E5E5E5" />
                    <path d={svgPaths.p375e6a00} fill="#E5E5E5" />
                    <path d={svgPaths.p1c8af900} fill="#E5E5E5" />
                    <path d={svgPaths.p399c6900} fill="#E5E5E5" />
                    <path d={svgPaths.p358bed80} fill="#E5E5E5" />
                    <path d={svgPaths.p2be6ee00} fill="#E5E5E5" />
                    <path d={svgPaths.pf00f000} fill="#E5E5E5" />
                    <path d={svgPaths.p1720fc00} fill="#E5E5E5" />
                    <path d={svgPaths.p2942ff00} fill="#E5E5E5" />
                    <path d={svgPaths.p37ee4720} fill="#E5E5E5" />
                    <path d={svgPaths.p3c62c300} fill="#E5E5E5" />
                    <path d={svgPaths.p1f20ce00} fill="#E5E5E5" />
                    <path d={svgPaths.p99f3500} fill="#E5E5E5" />
                    <path d={svgPaths.p33af3000} fill="#E5E5E5" />
                    <path d={svgPaths.p32afaa00} fill="#E5E5E5" />
                    <path d={svgPaths.p2688c900} fill="#E5E5E5" />
                    <path d={svgPaths.p163d7100} fill="#E5E5E5" />
                    <path d={svgPaths.p1ee5c200} fill="#E5E5E5" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation content */}
        <div className="flex-1 overflow-clip relative w-full">
          <div className="absolute flex flex-col gap-[4px] items-start leading-[52px] left-[40px] text-[45px] top-[40px] whitespace-nowrap">
            <p className="font-['Inter:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold text-[#e5e5e5]">欢迎使用 </p>
            <p className="font-['Inter:Bold',sans-serif] font-bold text-[#9ce40d]">Openclaw</p>
            <p className="font-['Inter:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold text-[#e5e5e5]">数字员工</p>
          </div>
          <div className="absolute font-['Inter:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal left-[40px] text-[#e5e5e5] text-[16px] top-[236px] tracking-[0.5px] w-[240px]">
            <p className="leading-[24px] mb-0">三步完成初始化，</p>
            <p className="leading-[24px]">让你的数字员工开始工作</p>
          </div>
          <div className="absolute flex flex-col gap-[20px] items-start leading-[20px] left-[40px] text-[14px] top-[370px] tracking-[0.25px] whitespace-pre-wrap">
            <p className={`font-['Inter:Regular','Noto_Sans_SC:Regular',sans-serif] transition-colors duration-300 ${currentStep === 1 ? "text-[#e5e5e5]" : "text-[rgba(238,238,238,0.2)]"}`}>01  环境检测</p>
            <p className={`font-['Inter:Regular',sans-serif] transition-colors duration-300 ${currentStep === 2 ? "text-[#e5e5e5]" : "text-[rgba(238,238,238,0.2)]"}`}>02  核心引擎</p>
            <p className="font-['Inter:Regular','Noto_Sans_SC:Regular',sans-serif] text-[rgba(238,238,238,0.2)]">03  创建员工</p>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 w-full">
          <div className="absolute border-[#262626] border-solid border-t inset-0 pointer-events-none" style={{ position: "relative" }} />
          <div className="flex flex-col items-start pb-[24px] pl-[36px] pr-[24px] pt-[25px] w-full">
            <div className="flex items-center py-[8px]">
              <p className="font-['Inter:Medium',sans-serif] font-medium text-[12px] text-[rgba(235,235,245,0.45)] tracking-[0.5px]">V0.1.0 STABLE</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
