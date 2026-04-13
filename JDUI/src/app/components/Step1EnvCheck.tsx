import { useState, useEffect } from "react";
import { motion } from "motion/react";
import svgPaths from "../../imports/svg-fw1aeva7px";

interface CheckItem {
  id: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  status: "checking" | "pass" | "fail";
  statusText: string;
  failText?: string;
}

const checkItems: Omit<CheckItem, "status">[] = [
  { id: "device", icon: "device", iconBg: "bg-[#eff6ff]", iconColor: "#206CFF", title: "设备", subtitle: "硬件资源与核心模组", statusText: "当前主机已就绪" },
  { id: "service", icon: "service", iconBg: "bg-[#fff7ed]", iconColor: "#FF7024", title: "本地服务", subtitle: "核心引擎运行状态", statusText: "正常" },
  { id: "network", icon: "network", iconBg: "bg-[#eef2ff]", iconColor: "#7434DC", title: "网络状态", subtitle: "云端同步与指令通道", statusText: "已连接" },
  { id: "storage", icon: "storage", iconBg: "bg-[#ecfdf5]", iconColor: "#35C44F", title: "存储空间", subtitle: "知识库与日志缓存", statusText: "充足" },
  { id: "permission", icon: "permission", iconBg: "bg-[#fff1f2]", iconColor: "#E42D22", title: "系统权限", subtitle: "应用操作与自动化权限", statusText: "权限不足", failText: "权限不足" },
];

const iconPaths: Record<string, { paths: string[]; extraPaths?: string[] }> = {
  device: { paths: [svgPaths.p2ebe5280, "M8 21H16", "M12 17V21"] },
  service: { paths: [svgPaths.pc21c880, svgPaths.p138a0cf0, "M6 6H6.01", "M6 18H6.01"] },
  network: { paths: ["M12 20H12.01", svgPaths.p36891a60, svgPaths.p18a14700, svgPaths.p2b983464] },
  storage: { paths: [svgPaths.p11feba00, svgPaths.p1b1afa80, svgPaths.p3eed8380] },
  permission: { paths: [svgPaths.p3f3d8e00, "M9 12L11 14L15 10"] },
};

function StatusIcon({ icon, iconColor }: { icon: string; iconColor: string }) {
  const p = iconPaths[icon];
  return (
    <svg className="absolute block size-full" fill="none" viewBox="0 0 24 24">
      {p.paths.map((d, i) => (
        <path key={i} d={d} stroke={iconColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      ))}
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="none" className="shrink-0">
      <path d={svgPaths.p2c348300} fill="#4EA100" transform="translate(4, 6)" />
    </svg>
  );
}

function FailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="none" className="shrink-0">
      <path d={svgPaths.p8251880} fill="#FF0000" transform="translate(2.67, 2.67)" />
    </svg>
  );
}

export function Step1EnvCheck({ onNext }: { onNext: () => void }) {
  const [statuses, setStatuses] = useState<Record<string, "checking" | "pass" | "fail">>({});

  useEffect(() => {
    checkItems.forEach((item, i) => {
      setTimeout(() => {
        setStatuses((prev) => ({
          ...prev,
          [item.id]: item.id === "permission" ? "fail" : "pass",
        }));
      }, 600 + i * 500);
    });
  }, []);

  const allDone = Object.keys(statuses).length === checkItems.length;

  return (
    <div className="flex flex-col items-center size-full overflow-auto">
      <div className="flex flex-col items-center px-[60px] size-full">
        <div className="flex-1 max-w-[768px] w-full">
          <div className="flex flex-col gap-[32px] items-center py-[48px] size-full">
            {/* Title */}
            <div className="flex items-center justify-between shrink-0 w-full">
              <div className="flex flex-col gap-[8px]">
                <p className="font-['Inter:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[32px] text-[24px] text-black">当前主机状态</p>
                <p className="font-['Inter:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[20px] text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.1px]">系统环境检查中，请确认配置无误</p>
              </div>
              <div className="bg-[#edffdc] h-[28px] rounded-[20px] shrink-0">
                <div className="flex gap-[6px] h-full items-center px-[12px]">
                  <motion.div
                    className="bg-[#4ea100] rounded-[3px] size-[6px]"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <p className="font-['Inter:Medium','Noto_Sans_SC:Medium',sans-serif] font-medium leading-[16px] text-[#4ea100] text-[12px] tracking-[0.5px]">监测中</p>
                </div>
              </div>
            </div>

            {/* Check items */}
            <div className="flex-1 w-full flex flex-col gap-[16px]">
              {checkItems.map((item, i) => {
                const status = statuses[item.id];
                const isFail = status === "fail";
                const isPass = status === "pass";
                const isChecking = !status;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                    className="bg-white relative rounded-[24px] shrink-0 w-full"
                  >
                    <div className="absolute border border-[rgba(0,0,0,0.05)] border-solid inset-0 pointer-events-none rounded-[24px]" />
                    <div className="flex items-center justify-between p-[25px] w-full">
                      <div className="flex gap-[16px] items-center">
                        <div className={`${item.iconBg} rounded-[14px] size-[48px] flex items-center justify-center`}>
                          <div className="relative size-[24px]">
                            <StatusIcon icon={item.icon} iconColor={item.iconColor} />
                          </div>
                        </div>
                        <div className="flex flex-col gap-[2px]">
                          <p className="font-['Inter:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[24px] text-[16px] text-black tracking-[0.15px]">{item.title}</p>
                          <p className="font-['Inter:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[20px] text-[14px] text-[rgba(60,60,67,0.6)] tracking-[0.25px]">{item.subtitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {isChecking && (
                          <motion.div
                            className="w-[60px] h-[32px] bg-[#f5f5f5] rounded-[8px]"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        )}
                        {isPass && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#edffdc] flex items-center gap-[4px] rounded-[8px] px-[12px] py-[6px]"
                          >
                            <p className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] text-[#4ea100] text-[14px] tracking-[0.1px]">{item.statusText}</p>
                            <CheckIcon />
                          </motion.div>
                        )}
                        {isFail && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#fff7f7] flex items-center gap-[4px] rounded-[8px] px-[12px] py-[6px]"
                          >
                            <p className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] text-[red] text-[14px] tracking-[0.1px]">{item.failText || "异常"}</p>
                            <FailIcon />
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Button */}
            <div className="h-[80px] relative shrink-0 w-full border-t border-[rgba(0,0,0,0.05)]">
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <motion.button
                  onClick={onNext}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`bg-[#b2e40d] flex items-center gap-[8px] rounded-[100px] pl-[36px] pr-[24px] py-[16px] cursor-pointer transition-opacity ${allDone ? "opacity-100" : "opacity-50 pointer-events-none"}`}
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
