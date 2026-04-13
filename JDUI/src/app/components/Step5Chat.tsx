import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import svgPaths from "../../imports/svg-jr72iiw5bz";
import svgPaths2 from "../../imports/svg-wxcs037pi0";

// Employee avatar pool
import eA0 from "figma:asset/770ed62317cd675f8958e89eea097b58b06fa1ad.png";
import eA1 from "figma:asset/292ffa7b8d57010fc4c0fc3cdb4fab83466a995c.png";
import eA2 from "figma:asset/499b4dc2cc776a5cd98a71f43dbe53743d938a31.png";
import eA3 from "figma:asset/9b9f0881d219021e83d4d96b0db4ad5c55e1255b.png";
import eA4 from "figma:asset/43b2c7e92f76bdb88cb13cfa482c4fa598c8d975.png";
import cA4 from "figma:asset/92b0779aca2c00b3e81fba7a9b999d6587715d23.png";

const employeeAvatars = [eA0, eA1, eA2, eA3, eA4];

interface ChatMsg {
  id: number;
  text: string;
}

interface Step5ChatProps {
  avatarIndex: number;
  employeeName: string;
}

/* ─── Animated typing dots ─────────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex gap-[5px] items-center px-[18px] py-[14px]">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-[8px] h-[8px] rounded-full bg-[rgba(143,143,154,0.5)]"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.75, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ─── Plan card (计划) ─────────────────────────────────────── */
function PlanCard() {
  const plans = [
    { label: "整理会议纪要并发送邮件", done: true },
    { label: "汇总芯片行业热点新闻", done: true },
    { label: "整理每日邮件摘要", done: false, spinning: true },
  ];

  return (
    <div className="bg-white rounded-[24px] px-[32px] py-[24px] flex flex-col gap-[20px] w-full">
      <p
        className="text-[22px] font-bold text-black leading-[28px] shrink-0"
        style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}
      >
        计划
      </p>
      <div className="flex flex-col gap-[20px]">
        {plans.map((p, i) => (
          <div key={i} className="flex items-center gap-[14px]">
            {p.done ? (
              /* filled check circle */
              <div className="relative shrink-0 size-[20px]">
                <svg className="block size-full" fill="none" viewBox="0 0 20 20">
                  <path d={svgPaths2.p25adcd00} fill="#b2e40d" />
                </svg>
              </div>
            ) : p.spinning ? (
              /* spinning partial circle */
              <motion.div
                className="relative shrink-0 size-[20px]"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
              >
                <svg className="block size-full" fill="none" viewBox="0 0 16 16">
                  <path
                    d={svgPaths2.pa5a5370}
                    stroke="#b2e40d"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </motion.div>
            ) : (
              /* empty circle */
              <div className="relative shrink-0 size-[20px]">
                <svg className="block size-full" fill="none" viewBox="0 0 20 20">
                  <path d={svgPaths2.p3a58b490} fill="rgba(60,60,67,0.2)" />
                </svg>
              </div>
            )}
            <span
              className={`text-[14px] leading-[20px] tracking-[0.1px] ${
                p.done ? "text-black" : "text-[rgba(60,60,67,0.5)]"
              }`}
              style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}
            >
              {p.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Task card (任务) ─────────────────────────────────────── */
function TaskCard() {
  const tasks = [
    {
      title: "工作总结",
      badge: { text: "进行中", bg: "#b2e40d", color: "black" },
      desc: "整理会议内容，给相关人员发邮件",
      opacity: 1,
    },
    {
      title: "每天芯片热点",
      badge: { text: "定时任务", bg: "#206cff", color: "white" },
      desc: "请整理每日芯片行业的热点新闻和趋势，确保信息准确且及时更新，方便团队快速掌握最新动态。",
      opacity: 1,
    },
    {
      title: "整理邮件",
      badge: { text: "定时任务", bg: "#206cff", color: "white" },
      desc: "请每天汇总芯片行业的最新热点新闻和趋势，确保信息准确及时，方便团队迅速了解最新动态。",
      opacity: 1,
    },
    {
      title: "整理电子邮件",
      badge: null,
      desc: "每天汇总芯片行业最新热点和趋势，确保信息准确及时，帮助团队快速掌握最新动态。",
      opacity: 0.3,
    },
  ];

  return (
    <div className="bg-white rounded-[24px] px-[32px] py-[24px] flex flex-col gap-[24px] w-full flex-1 min-h-0">
      <p
        className="text-[22px] font-bold text-black leading-[28px] shrink-0"
        style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}
      >
        任务
      </p>
      <div className="flex flex-col gap-[24px] overflow-y-auto flex-1 min-h-0">
        {tasks.map((t, i) => (
          <div key={i} className="flex flex-col gap-[2px]" style={{ opacity: t.opacity }}>
            <div className="flex items-center gap-[8px]">
              <span
                className="text-[16px] font-medium text-black leading-[24px] tracking-[0.15px]"
                style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}
              >
                {t.title}
              </span>
              {t.badge && (
                <span
                  className="text-[10px] font-medium px-[6px] py-[2px] rounded-[10px] whitespace-nowrap shrink-0"
                  style={{
                    color: t.badge.color,
                    backgroundColor: t.badge.bg,
                    fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
                  }}
                >
                  {t.badge.text}
                </span>
              )}
            </div>
            <p
              className="text-[12px] text-[rgba(60,60,67,0.6)] leading-[16px] tracking-[0.4px] overflow-hidden text-ellipsis"
              style={{
                fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {t.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────── */
export function Step5Chat({ avatarIndex, employeeName }: Step5ChatProps) {
  const avatarSrc = employeeAvatars[avatarIndex] ?? employeeAvatars[3];

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Sequential intro messages
  useEffect(() => {
    const msgs = [
      `你好老板！我是新加入的${employeeName}，很高兴能和大家一起共事！期待与团队合作，共同创造更大的价值！`,
      "我已完成所有初始化配置，并与相关系统完成对接，随时可以开始处理任务。",
      "有任何问题或需要帮忙的事项，请直接告诉我，我已经准备就绪！",
    ];
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setIsTyping(true), 700));
    timers.push(setTimeout(() => { setIsTyping(false); setMessages([{ id: 0, text: msgs[0] }]); }, 2400));
    timers.push(setTimeout(() => setIsTyping(true), 4100));
    timers.push(setTimeout(() => { setIsTyping(false); setMessages((p) => [...p, { id: 1, text: msgs[1] }]); }, 5700));
    timers.push(setTimeout(() => setIsTyping(true), 7200));
    timers.push(setTimeout(() => { setIsTyping(false); setMessages((p) => [...p, { id: 2, text: msgs[2] }]); }, 8800));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const chatListItems = [
    {
      id: 1, name: employeeName,
      badge: { text: "任务进行中", color: "white", bg: "#206cff" },
      time: "刚刚", lastMsg: "你好老板！我是新加入的...", avatar: avatarSrc, active: true,
    },
    {
      id: 2, name: "运营小编",
      badge: { text: "在线", color: "white", bg: "#206cff" },
      time: "1d", lastMsg: "今天发生了重大利好，你觉得需要发一篇", avatar: eA0, active: false,
    },
    {
      id: 3, name: "开发小弟",
      badge: { text: "忙碌", color: "#ff7024", bg: "#fcede5" },
      time: "3h", lastMsg: "我是开发，准备好协助您完成工作任务了。", avatar: eA1, active: false,
    },
    {
      id: 4, name: "私人秘书",
      badge: { text: "空闲", color: "#7434dc", bg: "#f7edff" },
      time: "2d", lastMsg: "您好！我是您的专属助理，随时准备帮助您处理工作。", avatar: eA4, active: false,
    },
    {
      id: 5, name: "项目负责人",
      badge: { text: "离线", color: "rgba(0,0,0,0.2)", bg: "rgba(143,143,154,0.1)" },
      time: "1d", lastMsg: "软件开发进行中，目前距离 Deadline 还有", avatar: cA4, active: false,
    },
  ];

  return (
    <div className="flex h-full w-full">
      {/* ─── Compact Left Nav (100px) ─── */}
      <div className="bg-[#232323] w-[100px] shrink-0 h-full flex flex-col items-center">
        {/* Logo */}
        <div className="flex items-center justify-center h-[80px] w-full shrink-0">
          <div className="relative w-[34px] h-[44px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32.7107 42.0431">
              <path d={svgPaths.p216306a0} fill="#B0E237" />
              <path d={svgPaths.pf6f8340} fill="#C0E767" />
              <path d={svgPaths.p1159cdf0} fill="#D0EE90" />
            </svg>
          </div>
        </div>

        {/* Nav icons */}
        <div className="flex flex-col gap-[8px] items-center w-full px-[8px]">
          <div className="bg-[rgba(136,136,140,0.25)] rounded-[16px] w-full h-[84px] flex flex-col items-center justify-center gap-[6px] cursor-pointer">
            <div className="relative size-[30px]">
              <div className="absolute inset-[8.33%]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25">
                  <path d={svgPaths.p10efb370} fill="#E5E5E5" />
                </svg>
              </div>
            </div>
            <span className="text-[#e5e5e5] text-[12px] font-medium tracking-[0.5px]" style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}>对话</span>
          </div>
          <div className="rounded-[16px] w-full h-[84px] flex flex-col items-center justify-center gap-[6px] cursor-pointer hover:bg-[rgba(136,136,140,0.1)] transition-colors">
            <div className="relative size-[30px]">
              <div className="absolute inset-[16.67%_8.33%]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 20">
                  <path d={svgPaths.p1d2f100} fill="rgba(235,235,245,0.45)" />
                </svg>
              </div>
            </div>
            <span className="text-[12px] text-[rgba(235,235,245,0.45)] font-medium tracking-[0.5px]" style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}>文件</span>
          </div>
          <div className="rounded-[16px] w-full h-[84px] flex flex-col items-center justify-center gap-[6px] cursor-pointer hover:bg-[rgba(136,136,140,0.1)] transition-colors">
            <div className="relative size-[30px]">
              <div className="absolute inset-[10.42%_18.4%_8.33%_18.39%]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.9631 24.375">
                  <path d={svgPaths.p2ead56f0} fill="rgba(235,235,245,0.45)" />
                </svg>
              </div>
            </div>
            <span className="text-[12px] text-[rgba(235,235,245,0.45)] font-medium tracking-[0.5px]" style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}>任务</span>
          </div>
        </div>

        {/* Settings */}
        <div className="mt-auto mb-[20px] flex flex-col items-center gap-[6px] cursor-pointer hover:opacity-70 transition-opacity">
          <div className="relative size-[30px]">
            <div className="absolute inset-[8.33%_9.48%_8.33%_9.46%]">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24.3178 25">
                <path d={svgPaths.pa908300} fill="rgba(235,235,245,0.45)" />
              </svg>
            </div>
          </div>
          <span className="text-[12px] text-[rgba(235,235,245,0.45)] font-medium tracking-[0.5px]" style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}>设置</span>
        </div>
      </div>

      {/* ─── Right Content Area ─── */}
      <div className="bg-[#232323] flex-1 h-full min-w-0 flex gap-[8px] pr-[8px] py-[8px]">
        {/* ── Main white panel (chat list + chat) ── */}
        <div className="bg-white flex-1 rounded-[20px] overflow-hidden flex min-w-0 min-h-0">
          {/* Chat List Sidebar */}
          <div className="bg-[#f5f5f5] w-[320px] shrink-0 h-full flex flex-col">
            <div className="p-[16px] shrink-0">
              <div className="bg-[rgba(143,143,154,0.1)] rounded-[16px] border border-[rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-[12px] px-[13px] py-[13px]">
                  <div className="relative shrink-0 size-[18px]">
                    <div className="absolute inset-[12.5%_16.47%_16.43%_12.5%]">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.7861 12.7936">
                        <path d={svgPaths.p2aa3cc80} fill="rgba(0,0,0,0.2)" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-[rgba(0,0,0,0.2)] text-[14px] font-medium tracking-[0.1px]" style={{ fontFamily: "'Inter', sans-serif" }}>Search...</span>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-[16px] flex flex-col gap-[8px] pb-[16px]">
              {chatListItems.map((item) => (
                <div key={item.id} className={`rounded-[16px] cursor-pointer transition-colors ${item.active ? "bg-white" : "hover:bg-white/60"}`}>
                  <div className="flex gap-[12px] items-center p-[12px]">
                    <div className="relative shrink-0 size-[48px]">
                      <img alt="" className="absolute inset-0 object-cover pointer-events-none rounded-full size-full" src={item.avatar} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-[2px]">
                        <div className="flex items-center gap-[4px] min-w-0">
                          <span className="text-[14px] font-medium text-black truncate" style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}>{item.name}</span>
                          {item.badge && (
                            <span className="text-[10px] font-medium px-[6px] py-[2px] rounded-[10px] whitespace-nowrap shrink-0" style={{ color: item.badge.color, backgroundColor: item.badge.bg, fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}>{item.badge.text}</span>
                          )}
                        </div>
                        <span className="text-[11px] text-[rgba(0,0,0,0.2)] font-medium whitespace-nowrap ml-[6px] shrink-0" style={{ fontFamily: "'Inter', sans-serif" }}>{item.time}</span>
                      </div>
                      <p className="text-[12px] text-[rgba(60,60,67,0.6)] truncate tracking-[0.4px]" style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}>{item.lastMsg}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col h-full min-w-0 bg-white">
            {/* Header */}
            <div className="h-[80px] shrink-0 border-b border-[#f3f4f6] flex items-center px-[24px] justify-between">
              <div className="flex flex-col gap-[2px]">
                <div className="flex items-center gap-[8px]">
                  <span className="text-[16px] font-bold text-black tracking-[0.15px]" style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}>{employeeName}</span>
                  <div className="bg-[#206cff] px-[8px] py-[3px] rounded-[10px]">
                    <span className="text-[10px] font-medium text-white" style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}>任务进行中</span>
                  </div>
                </div>
                <span className="text-[12px] text-[rgba(60,60,67,0.6)] tracking-[0.4px]" style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}>全能型数字员工，随时为您提供帮助</span>
              </div>

              {/* Header icons */}
              <div className="flex items-center gap-[20px]">
                {/* Search */}
                <div className="size-[24px] overflow-clip relative cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
                  <div className="absolute inset-[12.5%_16.47%_16.43%_12.5%]">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.0481 17.0581">
                      <path d={svgPaths.p2255adf0} fill="rgba(60,60,67,0.6)" />
                    </svg>
                  </div>
                </div>

                {/* Assessment – toggles task panel */}
                <button
                  onClick={() => setShowTaskPanel((v) => !v)}
                  className={`size-[24px] overflow-clip relative cursor-pointer transition-opacity rounded-[4px] ${showTaskPanel ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
                >
                  <div className="absolute inset-[12.5%]">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
                      <path d={svgPaths.p3440f900} fill={showTaskPanel ? "#206cff" : "rgba(60,60,67,0.6)"} />
                    </svg>
                  </div>
                </button>

                {/* More vert */}
                <div className="size-[24px] overflow-clip relative cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
                  <div className="absolute inset-[16.67%_41.67%]">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4 16">
                      <path d={svgPaths.p56f6880} fill="rgba(60,60,67,0.6)" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-[24px] flex flex-col gap-[20px]">
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="flex gap-[12px] items-start"
                  >
                    <div className="relative shrink-0 size-[36px]">
                      <img alt="" className="absolute inset-0 object-cover pointer-events-none rounded-full size-full" src={avatarSrc} />
                    </div>
                    <div className="flex flex-col gap-[6px] flex-1 max-w-[520px] min-w-0">
                      {idx === 0 && (
                        <div className="flex items-center gap-[8px]">
                          <span className="text-[12px] font-medium text-[rgba(60,60,67,0.6)] tracking-[0.5px]" style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}>{employeeName}</span>
                        </div>
                      )}
                      <div className="bg-[rgba(143,143,154,0.1)] rounded-bl-[16px] rounded-br-[16px] rounded-tl-[6px] rounded-tr-[16px] p-[16px]">
                        <p className="text-[16px] text-black leading-[24px] tracking-[0.5px]" style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}>{msg.text}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div key="typing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.25 }} className="flex gap-[12px] items-start">
                    <div className="relative shrink-0 size-[36px]">
                      <img alt="" className="absolute inset-0 object-cover pointer-events-none rounded-full size-full" src={avatarSrc} />
                    </div>
                    <div className="bg-[rgba(143,143,154,0.1)] rounded-bl-[16px] rounded-br-[16px] rounded-tl-[6px] rounded-tr-[16px]">
                      <TypingDots />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 pb-[16px] px-[24px] flex flex-col gap-[12px]">
              <div className="bg-white border border-[#d9d9d9] rounded-[16px]">
                <div className="flex items-center gap-[16px] p-[16px]">
                  <div className="relative shrink-0 size-[24px] cursor-pointer opacity-60 hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-[4.15%] left-[29.17%] right-1/4 top-[4.17%]">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 22.0031">
                        <path d={svgPaths.p228ad340} fill="rgba(60,60,67,0.6)" />
                      </svg>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="发送消息..."
                    className="flex-1 text-[16px] tracking-[0.5px] text-black outline-none bg-transparent placeholder:text-[rgba(0,0,0,0.2)]"
                    style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}
                  />
                  <div className="bg-[#b2e40d] rounded-full size-[36px] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform active:scale-95 shrink-0">
                    <svg width="11.25" height="13.5" viewBox="0 0 11.25 13.5" fill="none">
                      <path d="M5.625 1.6875V12.375" stroke="black" strokeLinecap="round" strokeWidth="2.25" />
                      <path d={svgPaths.p38c1e698} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" />
                    </svg>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-[rgba(0,0,0,0.2)] font-medium tracking-[0.5px] text-center" style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}>
                数字员工可能会产生不准确的信息，请核实重要内容。
              </p>
            </div>
          </div>
        </div>

        {/* ── Task / Plan Panels (slide in from right) ── */}
        <AnimatePresence>
          {showTaskPanel && (
            <motion.div
              key="task-panels"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col gap-[8px] shrink-0 overflow-hidden h-full"
              style={{ minWidth: 0 }}
            >
              <motion.div
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 40, opacity: 0 }}
                transition={{ duration: 0.32, delay: 0.08, ease: "easeOut" }}
                className="shrink-0"
                style={{ width: 300 }}
              >
                <PlanCard />
              </motion.div>
              <motion.div
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 40, opacity: 0 }}
                transition={{ duration: 0.32, delay: 0.14, ease: "easeOut" }}
                className="flex-1 min-h-0 flex"
                style={{ width: 300 }}
              >
                <TaskCard />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
