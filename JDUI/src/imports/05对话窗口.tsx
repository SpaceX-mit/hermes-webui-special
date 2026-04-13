import svgPaths from "./svg-jr72iiw5bz";
import img from "figma:asset/9b9f0881d219021e83d4d96b0db4ad5c55e1255b.png";
import img1 from "figma:asset/770ed62317cd675f8958e89eea097b58b06fa1ad.png";
import img2 from "figma:asset/292ffa7b8d57010fc4c0fc3cdb4fab83466a995c.png";
import img3 from "figma:asset/43b2c7e92f76bdb88cb13cfa482c4fa598c8d975.png";
import img4 from "figma:asset/92b0779aca2c00b3e81fba7a9b999d6587715d23.png";

function ChatWindows({ className }: { className?: string }) {
  return (
    <div className={className || "bg-white content-stretch flex flex-col h-[1064px] items-start relative w-[1012px]"} data-name="chat_windows">
      <div className="bg-white h-[80px] relative shrink-0 w-full" data-name="Container">
        <div aria-hidden="true" className="absolute border-[#f3f4f6] border-b border-solid inset-0 pointer-events-none" />
        <div className="flex flex-row items-center size-full">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between pb-px px-[24px] relative size-full">
            <div className="relative shrink-0" data-name="Container">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative">
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                  <p className="font-['Inter:Bold','Noto_Sans_JP:Bold',sans-serif] font-bold leading-[24px] not-italic relative shrink-0 text-[16px] text-black tracking-[0.15px] whitespace-nowrap">个人助理</p>
                  <div className="bg-[#206cff] content-stretch flex items-center justify-center px-[8px] py-[3px] relative rounded-[10px] shrink-0" data-name="notice">
                    <p className="font-['Inter:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[normal] not-italic relative shrink-0 text-[10px] text-white whitespace-nowrap">任务进行中</p>
                  </div>
                </div>
                <p className="font-['Inter:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(60,60,67,0.6)] tracking-[0.4px] whitespace-nowrap">帮我从每日的数据报表中提取核心指标，总结出主要的趋势变化</p>
              </div>
            </div>
            <div className="relative shrink-0" data-name="icon">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[20px] items-center relative">
                <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Icons / Search">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                    <g id="Vector" />
                  </svg>
                  <div className="absolute inset-[12.5%_16.47%_16.43%_12.5%]" data-name="Vector">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.0481 17.0581">
                      <path d={svgPaths.p2255adf0} fill="var(--fill-0, #3C3C43)" fillOpacity="0.6" id="Vector" />
                    </svg>
                  </div>
                </div>
                <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Icons / Assessment">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                    <g id="Vector" />
                  </svg>
                  <div className="absolute inset-[12.5%]" data-name="Vector">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
                      <path d={svgPaths.p3440f900} fill="var(--fill-0, #3C3C43)" fillOpacity="0.6" id="Vector" />
                    </svg>
                  </div>
                </div>
                <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Icons / More Vert">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                    <g id="Vector" />
                  </svg>
                  <div className="absolute inset-[16.67%_41.67%]" data-name="Vector">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4 16">
                      <path d={svgPaths.p56f6880} fill="var(--fill-0, #3C3C43)" fillOpacity="0.6" id="Vector" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="chat_area">
        <div className="overflow-clip rounded-[inherit] size-full">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[24px] items-start p-[24px] relative size-full">
            <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="chat_bubble">
              <div className="relative shrink-0 size-[36px]" data-name="profile picture">
                <div className="absolute left-0 rounded-[18px] size-[36px] top-0" data-name="头像">
                  <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[18px] size-full" src={img} />
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start max-w-[520px] min-h-px min-w-px relative" data-name="Container">
                <div className="bg-[rgba(143,143,154,0.1)] relative rounded-bl-[16px] rounded-br-[16px] rounded-tl-[6px] rounded-tr-[16px] shrink-0 w-full" data-name="Body">
                  <div className="content-stretch flex items-start p-[16px] relative w-full">
                    <p className="flex-[1_0_0] font-['Inter:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[24px] min-h-px min-w-px not-italic relative text-[16px] text-black tracking-[0.5px]">老板你好！我是新加入的个人助理，很高兴能和大家一起打造创新的芯片解决方案。期待与团队合作，共同推动技术进步！</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
              <div className="content-stretch flex gap-[12px] items-start justify-end relative shrink-0 w-full" data-name="chat_bubble_me">
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-end max-w-[520px] min-h-px min-w-px relative" data-name="Container">
                  <div className="bg-[#edffdc] max-w-[520px] relative rounded-bl-[16px] rounded-br-[16px] rounded-tl-[16px] rounded-tr-[6px] shrink-0 w-full" data-name="Body">
                    <div className="content-stretch flex items-start max-w-[inherit] p-[16px] relative w-full">
                      <p className="flex-[1_0_0] font-['Inter:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[24px] min-h-px min-w-px not-italic relative text-[16px] text-black tracking-[0.5px]">欢迎加入团队！很高兴有你这样优秀的个人助理加入我们。期待与你携手，共同创造更多创新的芯片解决方案，推动技术不断进步！</p>
                    </div>
                  </div>
                </div>
                <div className="relative shrink-0 size-[36px]" data-name="profile picture">
                  <div className="absolute bg-[#b2e40d] left-0 rounded-[18px] size-[36px] top-0" data-name="头像">
                    <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[20px] left-[calc(50%-11px)] not-italic text-[14px] text-black top-[calc(50%-10px)] tracking-[0.1px] whitespace-nowrap">Me</p>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex gap-[12px] items-start justify-end relative shrink-0 w-full" data-name="chat_bubble_me">
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-end max-w-[520px] min-h-px min-w-px relative" data-name="Container">
                  <div className="bg-[#edffdc] content-stretch flex items-start max-w-[520px] p-[16px] relative rounded-bl-[16px] rounded-br-[16px] rounded-tl-[16px] rounded-tr-[6px] shrink-0 w-[434px]" data-name="Body">
                    <p className="flex-[1_0_0] font-['Inter:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[24px] min-h-px min-w-px not-italic relative text-[16px] text-black tracking-[0.5px]">现在我这里有个任务</p>
                  </div>
                </div>
                <div className="shrink-0 size-[36px]" data-name="profile picture" />
              </div>
              <div className="content-stretch flex gap-[12px] items-start justify-end relative shrink-0 w-full" data-name="chat_bubble_me">
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-end max-w-[520px] min-h-px min-w-px relative" data-name="Container">
                  <div className="bg-[#edffdc] content-stretch flex items-start max-w-[520px] p-[16px] relative rounded-bl-[16px] rounded-br-[16px] rounded-tl-[16px] rounded-tr-[6px] shrink-0 w-[434px]" data-name="Body">
                    <p className="flex-[1_0_0] font-['Inter:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[24px] min-h-px min-w-px not-italic relative text-[16px] text-black tracking-[0.5px]">帮我看一下上周“华为合作”的会议纪要，提炼行动项</p>
                  </div>
                </div>
                <div className="shrink-0 size-[36px]" data-name="profile picture" />
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
              <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="chat_bubble">
                <div className="relative shrink-0 size-[36px]" data-name="profile picture">
                  <div className="absolute left-0 rounded-[18px] size-[36px] top-0" data-name="头像">
                    <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[18px] size-full" src={img} />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start max-w-[520px] min-h-px min-w-px relative" data-name="Container">
                  <div className="content-stretch flex font-['Inter:Medium',sans-serif] font-medium gap-[8px] items-start leading-[16px] not-italic relative shrink-0 text-[12px] tracking-[0.5px] w-full whitespace-nowrap" data-name="Text">
                    <p className="relative shrink-0 text-[rgba(60,60,67,0.6)]">个人助理</p>
                    <p className="relative shrink-0 text-[rgba(0,0,0,0.2)]">09:20</p>
                  </div>
                  <div className="bg-[rgba(143,143,154,0.1)] content-stretch flex items-start p-[16px] relative rounded-bl-[16px] rounded-br-[16px] rounded-tl-[6px] rounded-tr-[16px] shrink-0" data-name="Body">
                    <p className="font-['Inter:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[24px] not-italic relative shrink-0 text-[16px] text-black tracking-[0.5px] whitespace-nowrap">好的，我来读取文件并整理成行动项</p>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="chat_bubble">
                <div className="shrink-0 size-[36px]" data-name="profile picture" />
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start max-w-[520px] min-h-px min-w-px relative" data-name="Container">
                  <div className="bg-[rgba(143,143,154,0.1)] content-stretch flex items-start p-[16px] relative rounded-bl-[16px] rounded-br-[16px] rounded-tl-[6px] rounded-tr-[16px] shrink-0" data-name="Body">
                    <div className="font-['Inter:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[16px] text-black tracking-[0.5px] whitespace-nowrap">
                      <p className="leading-[24px] mb-0">整理完成，这里是行动项：</p>
                      <ol>
                        <li className="mb-0 ms-[24px]">
                          <span className="leading-[24px]">@王总——确认 Q2 预算（截止 3/28）</span>
                        </li>
                        <li className="mb-0 ms-[24px]">
                          <span className="leading-[24px]">@销售团队——更新 CRM 客户状态</span>
                        </li>
                        <li className="ms-[24px]">
                          <span className="leading-[24px]">@您——发送合同草稿给法务</span>
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[12px] items-start justify-end relative shrink-0 w-full" data-name="chat_bubble_me">
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-end max-w-[520px] min-h-px min-w-px relative" data-name="Container">
                <div className="bg-[#edffdc] content-stretch flex items-start max-w-[520px] p-[16px] relative rounded-bl-[16px] rounded-br-[16px] rounded-tl-[16px] rounded-tr-[6px] shrink-0 w-[434px]" data-name="Body">
                  <p className="flex-[1_0_0] font-['Inter:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular','Noto_Sans_KR:Regular',sans-serif] font-normal leading-[24px] min-h-px min-w-px not-italic relative text-[16px] text-black tracking-[0.5px]">好的，把第1、3项发邮件给对应的人</p>
                </div>
              </div>
              <div className="relative shrink-0 size-[36px]" data-name="profile picture">
                <div className="absolute bg-[#b2e40d] left-0 rounded-[18px] size-[36px] top-0" data-name="头像">
                  <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[20px] left-[calc(50%-11px)] not-italic text-[14px] text-black top-[calc(50%-10px)] tracking-[0.1px] whitespace-nowrap">Me</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white relative shrink-0 w-full" data-name="Container">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[16px] items-start pb-[16px] px-[24px] relative w-full">
          <div className="bg-white relative rounded-[16px] shrink-0 w-full" data-name="Container">
            <div aria-hidden="true" className="absolute border border-[#d9d9d9] border-solid inset-0 pointer-events-none rounded-[16px]" />
            <div className="flex flex-row items-center size-full">
              <div className="content-stretch flex gap-[16px] items-center p-[16px] relative w-full">
                <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Icons / Attach File">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                    <g id="Vector" />
                  </svg>
                  <div className="absolute bottom-[4.15%] left-[29.17%] right-1/4 top-[4.17%]" data-name="Vector">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 22.0031">
                      <path d={svgPaths.p228ad340} fill="var(--fill-0, #3C3C43)" fillOpacity="0.6" id="Vector" />
                    </svg>
                  </div>
                </div>
                <p className="flex-[1_0_0] font-['Inter:Regular','Noto_Sans_SC:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[24px] min-h-px min-w-px not-italic relative text-[16px] text-[rgba(0,0,0,0.2)] tracking-[0.5px]">发送消息...</p>
                <div className="bg-[#b2e40d] overflow-clip relative rounded-[18px] shrink-0 size-[36px]" data-name="Chat_icon">
                  <div className="-translate-x-1/2 -translate-y-1/2 absolute content-stretch flex flex-col items-center justify-center left-1/2 size-[18px] top-1/2" data-name="ui-icons">
                    <div className="h-[11.25px] relative shrink-0 w-[9px]">
                      <div className="absolute inset-[-10%_-12.5%]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.25 13.5">
                          <g id="Group 5">
                            <path d="M5.625 1.6875V12.375" id="Vector 16" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeWidth="2.25" />
                            <path d={svgPaths.p38c1e698} id="Vector 15" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" />
                          </g>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex items-center justify-center relative shrink-0 w-full" data-name="Container">
            <p className="font-['Inter:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[11px] text-[rgba(0,0,0,0.2)] text-center tracking-[0.5px] whitespace-nowrap">数字员工可能会产生不准确的信息，请核实重要内容。</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarFold({ className }: { className?: string }) {
  return (
    <div className={className || "bg-[#232323] h-[1080px] relative w-[100px]"} data-name="Sidebar_fold">
      <div className="-translate-x-1/2 absolute left-1/2 size-[60px] top-[20px]" data-name="Logo">
        <div className="absolute inset-[13.33%_22.15%_16.59%_23.33%]">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32.7107 42.0431">
            <g id="Group 3">
              <path d={svgPaths.p216306a0} fill="var(--fill-0, #B0E237)" id="Vector" />
              <path d={svgPaths.pf6f8340} fill="var(--fill-0, #C0E767)" id="Vector_2" />
              <path d={svgPaths.p1159cdf0} fill="var(--fill-0, #D0EE90)" id="Vector_3" />
            </g>
          </svg>
        </div>
      </div>
      <div className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[8px] items-start left-1/2 top-[120px] w-[84px]" data-name="container">
        <div className="bg-[rgba(136,136,140,0.25)] h-[84px] relative rounded-[16px] shrink-0 w-full" data-name="Model icon">
          <div className="flex flex-col items-center justify-center size-full">
            <div className="content-stretch flex flex-col gap-[6px] items-center justify-center px-[14px] relative size-full">
              <div className="relative shrink-0 size-[30px]" data-name="Icons / Forum">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                    <g id="Vector" />
                  </svg>
                  <div className="absolute inset-[8.33%]" data-name="Vector">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25">
                      <path d={svgPaths.p10efb370} fill="var(--fill-0, #E5E5E5)" id="Vector" />
                    </svg>
                  </div>
                </div>
              </div>
              <p className="font-['Inter:Medium','Noto_Sans_KR:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#e5e5e5] text-[12px] tracking-[0.5px] whitespace-nowrap">对话</p>
            </div>
          </div>
        </div>
        <div className="h-[84px] relative rounded-[16px] shrink-0 w-full" data-name="Model icon">
          <div className="flex flex-col items-center justify-center size-full">
            <div className="content-stretch flex flex-col gap-[6px] items-center justify-center px-[14px] relative size-full">
              <div className="relative shrink-0 size-[30px]" data-name="Icons / Folder">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                    <g id="Vector" />
                  </svg>
                  <div className="absolute inset-[16.67%_8.33%]" data-name="Vector">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 20">
                      <path d={svgPaths.p1d2f100} fill="var(--fill-0, #EBEBF5)" fillOpacity="0.45" id="Vector" />
                    </svg>
                  </div>
                </div>
              </div>
              <p className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(235,235,245,0.45)] tracking-[0.5px] whitespace-nowrap">文件</p>
            </div>
          </div>
        </div>
        <div className="h-[84px] relative rounded-[16px] shrink-0 w-full" data-name="Model icon">
          <div className="flex flex-col items-center justify-center size-full">
            <div className="content-stretch flex flex-col gap-[6px] items-center justify-center px-[14px] relative size-full">
              <div className="relative shrink-0 size-[30px]" data-name="Icons / Notifications">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                    <g id="Vector" />
                  </svg>
                  <div className="absolute inset-[10.42%_18.4%_8.33%_18.39%]" data-name="Vector">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.9631 24.375">
                      <path d={svgPaths.p2ead56f0} fill="var(--fill-0, #EBEBF5)" fillOpacity="0.45" id="Vector" />
                    </svg>
                  </div>
                </div>
              </div>
              <p className="font-['Inter:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(235,235,245,0.45)] tracking-[0.5px] whitespace-nowrap">任务</p>
            </div>
          </div>
        </div>
      </div>
      <div className="-translate-x-1/2 absolute bottom-[20px] content-stretch flex flex-col gap-[6px] items-center justify-center left-1/2 px-[14px] rounded-[16px] size-[84px]" data-name="Model icon">
        <div className="relative shrink-0 size-[30px]" data-name="Icons / Settings">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
              <g id="Vector" />
            </svg>
            <div className="absolute inset-[8.33%_9.48%_8.33%_9.46%]" data-name="Vector">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24.3178 25">
                <path d={svgPaths.pa908300} fill="var(--fill-0, #EBEBF5)" fillOpacity="0.45" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
        <p className="font-['Inter:Medium','Noto_Sans_SC:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(235,235,245,0.45)] tracking-[0.5px] whitespace-nowrap">设置</p>
      </div>
    </div>
  );
}

export default function Component({ className }: { className?: string }) {
  return (
    <div className={className || "content-stretch flex h-[1080px] isolate items-start overflow-clip relative rounded-[24px] w-[1440px]"} data-name="05 对话窗口">
      <SidebarFold className="bg-[#232323] h-[1080px] relative shrink-0 w-[100px] z-[2]" />
      <div className="bg-[#232323] flex-[1_0_0] h-full min-h-px min-w-px relative z-[1]" data-name="Main">
        <div className="flex flex-col justify-center overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex flex-col items-start justify-center pr-[8px] py-[8px] relative size-full">
            <div className="bg-white content-stretch flex flex-[1_0_0] items-start min-h-px min-w-px overflow-clip relative rounded-[20px] w-full" data-name="Background+Border+Shadow">
              <div className="bg-[#f5f5f5] h-full relative shrink-0 w-[320px]" data-name="chat_menu">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
                  <div className="relative shrink-0 w-full">
                    <div className="flex flex-col items-center justify-center size-full">
                      <div className="content-stretch flex flex-col items-center justify-center p-[16px] relative w-full">
                        <div className="bg-[rgba(143,143,154,0.1)] relative rounded-[16px] shrink-0 w-full" data-name="Container">
                          <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.05)] border-solid inset-0 pointer-events-none rounded-[16px]" />
                          <div className="flex flex-row items-center size-full">
                            <div className="content-stretch flex gap-[12px] items-center p-[13px] relative w-full">
                              <div className="relative shrink-0 size-[18px]" data-name="Icons / Search">
                                <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
                                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                                    <g id="Vector" />
                                  </svg>
                                  <div className="absolute inset-[12.5%_16.47%_16.43%_12.5%]" data-name="Vector">
                                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.7861 12.7936">
                                      <path d={svgPaths.p2aa3cc80} fill="var(--fill-0, black)" fillOpacity="0.2" id="Vector" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              <p className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(0,0,0,0.2)] tracking-[0.1px] whitespace-nowrap">Search...</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Container">
                    <div className="flex flex-row justify-center overflow-clip rounded-[inherit] size-full">
                      <div className="content-stretch flex items-start justify-center px-[16px] relative size-full">
                        <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-[287px]">
                          <div className="bg-white relative rounded-[16px] shrink-0 w-full" data-name="chat_item">
                            <div className="flex flex-row items-center size-full">
                              <div className="content-stretch flex gap-[12px] items-center p-[12px] relative w-full">
                                <div className="relative shrink-0 size-[48px]">
                                  <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                                    <div className="absolute left-0 rounded-[24px] size-[48px] top-0" data-name="头像">
                                      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[24px] size-full" src={img} />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-[199_0_0] min-h-px min-w-px relative" data-name="Container">
                                  <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative w-full">
                                    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
                                      <div className="relative shrink-0" data-name="title">
                                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center relative">
                                          <p className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-black tracking-[0.1px] whitespace-nowrap">个人助理</p>
                                        </div>
                                      </div>
                                      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[11px] text-[rgba(0,0,0,0.2)] tracking-[0.5px] whitespace-nowrap">1h</p>
                                    </div>
                                    <div className="content-stretch flex h-[18px] items-center justify-between relative shrink-0 w-full" data-name="Container">
                                      <p className="flex-[1_0_0] font-['Inter:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[16px] min-h-px min-w-px not-italic overflow-hidden relative text-[12px] text-[rgba(60,60,67,0.6)] text-ellipsis tracking-[0.4px] whitespace-nowrap">您好！我是您的个人助理，准备好...</p>
                                      <div className="bg-[#b2e40d] relative rounded-[10px] shrink-0 size-[18px]" data-name="notice">
                                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[4px] relative size-full">
                                          <p className="font-['Inter:Bold',sans-serif] font-bold leading-[16px] not-italic relative shrink-0 text-[11px] text-black tracking-[0.5px] whitespace-nowrap">2</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="relative rounded-[16px] shrink-0 w-full" data-name="chat_item">
                            <div className="flex flex-row items-center size-full">
                              <div className="content-stretch flex gap-[12px] items-center p-[12px] relative w-full">
                                <div className="relative shrink-0 size-[48px]">
                                  <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                                    <div className="absolute left-0 rounded-[53px] size-[48px] top-0" data-name="头像">
                                      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[53px] size-full" src={img1} />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-[199_0_0] min-h-px min-w-px relative" data-name="Container">
                                  <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative w-full">
                                    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
                                      <div className="relative shrink-0" data-name="title">
                                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center relative">
                                          <p className="font-['Inter:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-black tracking-[0.1px] whitespace-nowrap">运营小编</p>
                                          <div className="bg-[#206cff] content-stretch flex items-center justify-center px-[6px] py-[2px] relative rounded-[10px] shrink-0" data-name="notice">
                                            <p className="font-['Inter:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[normal] not-italic relative shrink-0 text-[10px] text-white whitespace-nowrap">在线</p>
                                          </div>
                                        </div>
                                      </div>
                                      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[11px] text-[rgba(0,0,0,0.2)] tracking-[0.5px] whitespace-nowrap">1d</p>
                                    </div>
                                    <div className="content-stretch flex h-[18px] items-center justify-between relative shrink-0 w-full" data-name="Container">
                                      <p className="flex-[1_0_0] font-['Inter:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[16px] min-h-px min-w-px not-italic overflow-hidden relative text-[12px] text-[rgba(60,60,67,0.6)] text-ellipsis tracking-[0.4px] whitespace-nowrap">今天发生了重大利好，你觉得需要发一篇</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="relative rounded-[16px] shrink-0 w-full" data-name="chat_item">
                            <div className="flex flex-row items-center size-full">
                              <div className="content-stretch flex gap-[12px] items-center p-[12px] relative w-full">
                                <div className="relative shrink-0 size-[48px]">
                                  <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                                    <div className="absolute left-0 rounded-[53px] size-[48px] top-0" data-name="头像">
                                      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[53px] size-full" src={img2} />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-[199_0_0] min-h-px min-w-px relative" data-name="Container">
                                  <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative w-full">
                                    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
                                      <div className="relative shrink-0" data-name="title">
                                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center relative">
                                          <p className="font-['Inter:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-black tracking-[0.1px] whitespace-nowrap">开发小弟</p>
                                          <div className="bg-[#fcede5] content-stretch flex items-center justify-center px-[6px] py-[2px] relative rounded-[10px] shrink-0" data-name="notice">
                                            <p className="font-['Inter:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[normal] not-italic relative shrink-0 text-[#ff7024] text-[10px] whitespace-nowrap">忙碌</p>
                                          </div>
                                        </div>
                                      </div>
                                      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[11px] text-[rgba(0,0,0,0.2)] tracking-[0.5px] whitespace-nowrap">3h</p>
                                    </div>
                                    <div className="content-stretch flex h-[18px] items-center justify-between relative shrink-0 w-full" data-name="Container">
                                      <p className="flex-[1_0_0] font-['Inter:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[16px] min-h-px min-w-px not-italic overflow-hidden relative text-[12px] text-[rgba(60,60,67,0.6)] text-ellipsis tracking-[0.4px] whitespace-nowrap">我是开发，准备好协助您完成两天的工作任务了。</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="relative rounded-[16px] shrink-0 w-full" data-name="chat_item">
                            <div className="flex flex-row items-center size-full">
                              <div className="content-stretch flex gap-[12px] items-center p-[12px] relative w-full">
                                <div className="relative shrink-0 size-[48px]">
                                  <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                                    <div className="absolute left-0 rounded-[53px] size-[48px] top-0" data-name="头像">
                                      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[53px] size-full" src={img3} />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-[199_0_0] min-h-px min-w-px relative" data-name="Container">
                                  <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative w-full">
                                    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
                                      <div className="relative shrink-0" data-name="title">
                                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center relative">
                                          <p className="font-['Inter:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-black tracking-[0.1px] whitespace-nowrap">私人秘书</p>
                                          <div className="bg-[#f7edff] content-stretch flex items-center justify-center px-[6px] py-[2px] relative rounded-[10px] shrink-0" data-name="notice">
                                            <p className="font-['Inter:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[normal] not-italic relative shrink-0 text-[#7434dc] text-[10px] whitespace-nowrap">空闲</p>
                                          </div>
                                        </div>
                                      </div>
                                      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[11px] text-[rgba(0,0,0,0.2)] tracking-[0.5px] whitespace-nowrap">2d</p>
                                    </div>
                                    <div className="content-stretch flex h-[18px] items-center justify-between relative shrink-0 w-full" data-name="Container">
                                      <p className="flex-[1_0_0] font-['Inter:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[16px] min-h-px min-w-px not-italic overflow-hidden relative text-[12px] text-[rgba(60,60,67,0.6)] text-ellipsis tracking-[0.4px] whitespace-nowrap">您好！我是您的专属助理，随时准备帮助您处理这两天的工作内容。</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="relative rounded-[16px] shrink-0 w-full" data-name="chat_item">
                            <div className="flex flex-row items-center size-full">
                              <div className="content-stretch flex gap-[12px] items-center p-[12px] relative w-full">
                                <div className="relative shrink-0 size-[48px]">
                                  <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                                    <div className="absolute left-0 rounded-[53px] size-[48px] top-0" data-name="头像">
                                      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[53px] size-full" src={img4} />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-[199_0_0] min-h-px min-w-px relative" data-name="Container">
                                  <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative w-full">
                                    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
                                      <div className="relative shrink-0" data-name="title">
                                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center relative">
                                          <p className="font-['Inter:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-black tracking-[0.1px] whitespace-nowrap">项目负责人</p>
                                          <div className="bg-[rgba(143,143,154,0.1)] content-stretch flex items-center justify-center px-[6px] py-[2px] relative rounded-[10px] shrink-0" data-name="notice">
                                            <p className="font-['Inter:Medium','Noto_Sans_JP:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[normal] not-italic relative shrink-0 text-[10px] text-[rgba(0,0,0,0.2)] whitespace-nowrap">离线</p>
                                          </div>
                                        </div>
                                      </div>
                                      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[11px] text-[rgba(0,0,0,0.2)] tracking-[0.5px] whitespace-nowrap">1d</p>
                                    </div>
                                    <div className="content-stretch flex h-[18px] items-center justify-between relative shrink-0 w-full" data-name="Container">
                                      <p className="flex-[1_0_0] font-['Inter:Regular','Noto_Sans_JP:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[16px] min-h-px min-w-px not-italic overflow-hidden relative text-[12px] text-[rgba(60,60,67,0.6)] text-ellipsis tracking-[0.4px] whitespace-nowrap">软件开发进行中，目前距离 Deadline 还有</p>
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
              <ChatWindows className="bg-white flex-[1_0_0] h-full min-h-px min-w-px relative" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}