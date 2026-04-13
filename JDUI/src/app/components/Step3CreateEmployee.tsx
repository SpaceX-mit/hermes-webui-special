import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import svgPaths from "../../imports/svg-gqr4jbudti";
import img0 from "figma:asset/770ed62317cd675f8958e89eea097b58b06fa1ad.png";
import img1 from "figma:asset/292ffa7b8d57010fc4c0fc3cdb4fab83466a995c.png";
import img2 from "figma:asset/499b4dc2cc776a5cd98a71f43dbe53743d938a31.png";
import img3 from "figma:asset/9b9f0881d219021e83d4d96b0db4ad5c55e1255b.png";
import img4 from "figma:asset/43b2c7e92f76bdb88cb13cfa482c4fa598c8d975.png";

const allAvatars = [img0, img1, img2, img3, img4];

interface Personality {
  id: string;
  name: string;
  desc: string;
  prompt: string;
  gradient: string;
}

const allPersonalities: Personality[] = [
  { id: "p1", name: "创意文案大师", desc: "为营销活动快速生成多平台风格的文案和社交媒体推文。", prompt: "你是一位创意文案大师，擅长为各种营销活动撰写引人注目的文案。你的风格活泼、有创意，善于用简洁有力的语言传达品牌价值。请用轻松幽默的语气与用户交流。", gradient: "linear-gradient(99.31deg, #0F2FE3 0%, #14CCE4 53.35%)" },
  { id: "p2", name: "数据分析助理", desc: "对接数据报表，快速生成核心指标的结论与趋势预警。", prompt: "你是一位专业的数据分析助理，擅长解读数据报表和商业指标。你能快速发现数据中的趋势和异常，用简洁清晰的语言呈现分析结论。请保持严谨、专业的态度。", gradient: "linear-gradient(99.31deg, #6BE30F 0%, #14E49B 53.35%)" },
  { id: "p3", name: "日常客服助手", desc: "处理常见咨询，自动回复并归档常见问题，保持亲和。", prompt: "你是一位温暖亲和的客服助手，擅长处理客户的各种咨询和问题。你的回复耐心、细致，总能让客户感到被重视和理解。遇到无法解决的问题会主动升级。", gradient: "linear-gradient(99.31deg, #AD46FF 0%, #F6339A 53.35%)" },
  { id: "p4", name: "项目管理专家", desc: "跟踪任务进度，自动生成周报和风险预警，提升协作效率。", prompt: "你是一位高效的项目管理专家，擅长制定计划、跟踪进度和协调资源。你会主动识别项目风险，提供解决方案建议，并定期生成进度报告。", gradient: "linear-gradient(99.31deg, #FF6B35 0%, #FFD700 53.35%)" },
  { id: "p5", name: "代码审查员", desc: "自动审查提交代码，发现潜在 Bug 和性能问题。", prompt: "你是一位严谨的代码审查员，擅长发现代码中的潜在问题、性能瓶颈和安全漏洞。你的反馈建设性强，会提供改进建议和最佳实践参考。", gradient: "linear-gradient(99.31deg, #E3150F 0%, #FF8A65 53.35%)" },
  { id: "p6", name: "会议纪要助手", desc: "自动整理会议要点、待办事项和决议，节省记录时间。", prompt: "你是一位高效的会议纪要助手，擅长从对话中提取关键信息、决策要点和行动项。你的记录结构清晰、重点突出，方便团队快速回顾和执行。", gradient: "linear-gradient(99.31deg, #00BCD4 0%, #4CAF50 53.35%)" },
  { id: "p7", name: "翻译润色专家", desc: "多语言互译并润色，让内容更符合目标语言的表达习惯。", prompt: "你是一位精通多语言的翻译润色专家，不仅能准确翻译，更能根据目标语言的文化和表达习惯进行本地化润色，让翻译内容自然流畅。", gradient: "linear-gradient(99.31deg, #9C27B0 0%, #3F51B5 53.35%)" },
  { id: "p8", name: "知识库管理员", desc: "自动分类整理文档，构建可搜索的企业知识库体系。", prompt: "你是一位专业的知识库管理员，擅长对文档进行分类、标签化和结构化整理。你能帮助构建高效的知识检索体系，让团队快速找到所需信息。", gradient: "linear-gradient(99.31deg, #607D8B 0%, #455A64 53.35%)" },
  { id: "p9", name: "社交媒体运营", desc: "自动生成热点话题内容，规划发布日历，分析互动数据。", prompt: "你是一位敏锐的社交媒体运营专家，善于捕捉热点趋势，创作引发互动的内容。你了解各平台算法特点，能优化发布策略以最大化传播效果。", gradient: "linear-gradient(99.31deg, #E91E63 0%, #FF5722 53.35%)" },
];

/* ── Flat Arc Carousel ── */
function FlatArcCarousel({
  avatars,
  selectedIndex,
  onSelect,
}: {
  avatars: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const count = avatars.length;
  const [offset, setOffset] = useState(-selectedIndex);
  const [isDragging, setIsDragging] = useState(false);
  const hasDraggedRef = useRef(false);
  const dragStartRef = useRef<{ x: number; startOffset: number } | null>(null);
  const offsetRef = useRef(offset);
  offsetRef.current = offset;

  const slotSpacing = 104;
  const containerW = 536;
  const centerX = containerW / 2;

  const snapToNearest = (currentOffset: number) => {
    const rounded = Math.round(currentOffset);
    setOffset(rounded);
    const idx = ((-rounded % count) + count) % count;
    onSelect(idx);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartRef.current = { x: e.clientX, startOffset: offsetRef.current };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    if (Math.abs(dx) > 3) hasDraggedRef.current = true;
    setOffset(dragStartRef.current.startOffset + dx / slotSpacing);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    snapToNearest(offsetRef.current);
  };

  const handleClickAvatar = (avatarIndex: number) => {
    if (hasDraggedRef.current) return;
    const currentCenter = ((-Math.round(offset) % count) + count) % count;
    let diff = avatarIndex - currentCenter;
    if (diff > count / 2) diff -= count;
    if (diff < -count / 2) diff += count;
    const targetOffset = Math.round(offset) - diff;
    setOffset(targetOffset);
    onSelect(avatarIndex);
  };

  const visibleSlots = 7;
  const halfSlots = Math.floor(visibleSlots / 2);

  return (
    <div
      className="relative select-none cursor-grab active:cursor-grabbing overflow-hidden"
      style={{ width: containerW, height: 180 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {Array.from({ length: visibleSlots }, (_, i) => {
        const slotIndex = i - halfSlots;
        const avatarIndex = (((-Math.round(offset) + slotIndex) % count) + count) % count;
        const frac = offset - Math.round(offset);
        const tx = centerX + (slotIndex + frac) * slotSpacing;
        const distFromCenter = Math.abs(slotIndex + frac);

        const yOffset = distFromCenter * distFromCenter * 12;
        const scale = Math.max(0, 1 - distFromCenter * 0.15);
        const size = distFromCenter < 0.4 ? 120 : 80;
        const isSelected = distFromCenter < 0.4;
        const opacity = Math.max(0, 1 - distFromCenter * 0.25);

        return (
          <div
            key={`slot-${i}`}
            className="absolute"
            style={{
              left: tx - size / 2,
              top: 20 + yOffset + (isSelected ? 0 : 20),
              width: size,
              height: size,
              transform: `scale(${scale})`,
              opacity,
              transition: isDragging
                ? "none"
                : "left 0.45s cubic-bezier(0.25, 1, 0.5, 1), top 0.45s cubic-bezier(0.25, 1, 0.5, 1), transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease",
              zIndex: isSelected ? 10 : Math.round((1 - distFromCenter) * 5),
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleClickAvatar(avatarIndex);
            }}
          >
            <div className="w-full h-full rounded-full overflow-hidden relative">
              <img
                alt=""
                src={avatars[avatarIndex]}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
              />
              {isSelected && (
                <motion.div
                  layoutId="avatar-ring"
                  className="absolute inset-[-1.5px] rounded-full pointer-events-none"
                  style={{ border: "3px solid #b2e40d" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </div>
          </div>
        );
      })}

      {/* Fade edges */}
      <div
        className="absolute inset-y-0 left-0 w-[60px] pointer-events-none z-20"
        style={{ background: "linear-gradient(to right, #f5f5f5, transparent)" }}
      />
      <div
        className="absolute inset-y-0 right-0 w-[60px] pointer-events-none z-20"
        style={{ background: "linear-gradient(to left, #f5f5f5, transparent)" }}
      />
    </div>
  );
}

/* ── Main Component ── */
interface Step3Props {
  onBack: () => void;
  onFinish: () => void;
  employeeName: string;
  onEmployeeNameChange: (name: string) => void;
  selectedAvatarIndex: number;
  onAvatarChange: (index: number) => void;
  description: string;
  onDescriptionChange: (desc: string) => void;
}

export function Step3CreateEmployee({
  onBack,
  onFinish,
  employeeName,
  onEmployeeNameChange,
  selectedAvatarIndex,
  onAvatarChange,
  description,
  onDescriptionChange,
}: Step3Props) {
  const [personalityPage, setPersonalityPage] = useState(0);

  const currentPersonalities = (() => {
    const start = (personalityPage * 3) % allPersonalities.length;
    const result: Personality[] = [];
    for (let i = 0; i < 3; i++) {
      result.push(allPersonalities[(start + i) % allPersonalities.length]);
    }
    return result;
  })();

  const handleRefresh = () => {
    setPersonalityPage((p) => p + 1);
  };

  const handleSelectPersonality = (p: Personality) => {
    onDescriptionChange(p.prompt);
  };

  return (
    <div className="flex flex-col items-center size-full overflow-auto">
      <div className="flex flex-col items-center px-[60px] size-full">
        <div className="flex-1 max-w-[768px] w-full">
          <div className="flex flex-col gap-[32px] items-center py-[48px] size-full">
            {/* Title */}
            <div className="shrink-0 w-full">
              <div className="flex flex-col gap-[8px]">
                <p className="font-['Inter:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[32px] text-[24px] text-black">定制您的数字员工</p>
                <p className="font-['Inter:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[20px] text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.1px]">选择合适的形象，并告诉我们它的主要工作</p>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 w-full flex flex-col gap-[24px] items-center">
              {/* Flat Arc Avatar Carousel */}
              <div className="flex flex-col items-center shrink-0 w-full">
                <FlatArcCarousel
                  avatars={allAvatars}
                  selectedIndex={selectedAvatarIndex}
                  onSelect={onAvatarChange}
                />

                {/* Employee name */}
                <div className="flex gap-[8px] items-center justify-center mt-[4px]">
                  <input
                    value={employeeName}
                    onChange={(e) => onEmployeeNameChange(e.target.value)}
                    className="font-['Inter:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[32px] text-[24px] text-black text-center bg-transparent outline-none border-none w-[160px]"
                  />
                  <div className="overflow-clip relative shrink-0 size-[16px]">
                    <svg className="absolute block size-full" fill="none" viewBox="0 0 32 32"><g /></svg>
                    <div className="absolute inset-[8.32%_8.33%_0_8.33%]">
                      <svg className="absolute block size-full" fill="none" viewBox="0 0 13.3333 14.6683">
                        <path d={svgPaths.p2dafae30} fill="#4D4D4D" fillOpacity="0.25" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text area */}
              <div className="bg-white h-[128px] relative rounded-[16px] shrink-0 w-full">
                <textarea
                  value={description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  placeholder="用一段话描述它的工作职责、语气风格，或者直接从下方选择预设..."
                  className="w-full h-full p-[24px] rounded-[16px] resize-none outline-none border border-[rgba(0,0,0,0.05)] focus:border-[#b2e40d] transition-colors font-['Inter:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[20px] text-[14px] text-black tracking-[0.25px] placeholder:text-[rgba(60,60,67,0.6)]"
                />
              </div>

              {/* Preset personalities */}
              <div className="flex flex-col gap-[16px] items-start shrink-0 w-full">
                <div className="flex gap-[8px] items-center w-full">
                  <p className="font-['Inter:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[20px] text-[14px] text-black tracking-[0.1px]">不知道怎么写？试试预设个性</p>
                  <motion.button
                    whileTap={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    onClick={handleRefresh}
                    className="cursor-pointer overflow-clip relative shrink-0 size-[18px] bg-transparent border-none p-0"
                  >
                    <svg className="absolute block size-full" fill="none" viewBox="0 0 32 32"><g /></svg>
                    <div className="absolute inset-[16.67%_16.67%_16.67%_16.71%]">
                      <svg className="absolute block size-full" fill="none" viewBox="0 0 11.9925 12">
                        <path d={svgPaths.p2561ae80} fill="#4D4D4D" fillOpacity="0.25" />
                      </svg>
                    </div>
                  </motion.button>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={personalityPage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="flex gap-[16px] items-center w-full"
                  >
                    {currentPersonalities.map((p) => (
                      <motion.div
                        key={p.id}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectPersonality(p)}
                        className="bg-white flex-1 relative rounded-[16px] cursor-pointer"
                      >
                        <div className="overflow-clip rounded-[inherit] size-full">
                          <div className="flex flex-col gap-[8px] items-start pb-[28px] pt-[24px] px-[24px] w-full">
                            <p
                              className="bg-clip-text font-['Inter:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[20px] text-[14px] text-transparent tracking-[0.1px] w-full"
                              style={{ backgroundImage: p.gradient }}
                            >
                              {p.name}
                            </p>
                            <p className="font-['Inter:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[16px] text-[12px] text-[rgba(60,60,67,0.6)] tracking-[0.4px] w-full">
                              {p.desc}
                            </p>
                          </div>
                        </div>
                        <div className="absolute border border-[rgba(0,0,0,0.05)] inset-0 pointer-events-none rounded-[16px]" />
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
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
