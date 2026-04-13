import { motion } from "motion/react";
import { useEffect } from "react";

import img0 from "figma:asset/770ed62317cd675f8958e89eea097b58b06fa1ad.png";
import img1 from "figma:asset/292ffa7b8d57010fc4c0fc3cdb4fab83466a995c.png";
import img2 from "figma:asset/499b4dc2cc776a5cd98a71f43dbe53743d938a31.png";
import img3 from "figma:asset/9b9f0881d219021e83d4d96b0db4ad5c55e1255b.png";
import img4 from "figma:asset/43b2c7e92f76bdb88cb13cfa482c4fa598c8d975.png";

const avatarImages = [img0, img1, img2, img3, img4];

interface Step4LoadingProps {
  avatarIndex: number;
  onFinish?: () => void;
}

export function Step4Loading({ avatarIndex, onFinish }: Step4LoadingProps) {
  const avatarSrc = avatarImages[avatarIndex] || avatarImages[3];

  useEffect(() => {
    if (!onFinish) return;
    const timer = setTimeout(onFinish, 3200);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="flex flex-col items-center justify-center size-full">
      <div className="flex flex-col gap-[24px] items-center pb-[32px]">
        {/* Avatar with rotating gradient ring */}
        <div className="relative size-[108px]">
          {/* Rotating gradient ring */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          >
            <svg className="block size-full" viewBox="0 0 108 108" fill="none">
              <defs>
                <linearGradient id="ring-gradient" x1="0" y1="0" x2="108" y2="108" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#B0E237" />
                  <stop offset="40%" stopColor="#96FF46" />
                  <stop offset="70%" stopColor="#D0EE90" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f5f5f5" stopOpacity="0" />
                </linearGradient>
              </defs>
              <circle
                cx="54"
                cy="54"
                r="50"
                stroke="url(#ring-gradient)"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>

          {/* Avatar */}
          <div className="absolute inset-[8px] rounded-full overflow-hidden">
            <img
              alt=""
              className="absolute inset-0 object-cover pointer-events-none rounded-full size-full"
              src={avatarSrc}
            />
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col gap-[8px] items-center">
          <p className="font-['Inter:Bold','Noto_Sans_SC:Bold',sans-serif] font-bold leading-[36px] text-[28px] text-black text-center">
            正在为你准备数字员工
          </p>
          <p className="font-['Inter:Regular','Noto_Sans_SC:Regular',sans-serif] font-normal leading-[24px] text-[16px] text-[rgba(60,60,67,0.6)] tracking-[0.5px]">
            请稍作等待，系统正在进行最终的配置与联调...
          </p>
        </div>
      </div>
    </div>
  );
}