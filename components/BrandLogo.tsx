import Image from "next/image";

interface BrandLogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  showText?: boolean;
  textClassName?: string;
  badge?: string;
  className?: string;
}

export function BrandLogo({
  size = "md",
  showText = true,
  textClassName = "",
  badge,
  className = "",
}: BrandLogoProps) {
  const config = {
    xs: {
      dimension: 24,
      boxClass: "h-6 w-6",
      textClass: "text-base font-bold",
    },
    sm: {
      dimension: 28,
      boxClass: "h-7 w-7",
      textClass: "text-base font-bold tracking-tight",
    },
    md: {
      dimension: 34,
      boxClass: "h-7 w-7 sm:h-9 sm:w-9",
      textClass: "text-base sm:text-xl font-bold tracking-tight",
    },
    lg: {
      dimension: 44,
      boxClass: "h-11 w-11",
      textClass: "text-2xl font-black tracking-tight",
    },
  }[size];

  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 ${className}`}>
      <div className={`relative ${config.boxClass} shrink-0 overflow-hidden rounded-xl shadow-xs transition-transform hover:scale-105`}>
        <Image
          src="/logo.svg"
          alt="SceneO"
          width={config.dimension}
          height={config.dimension}
          priority
          unoptimized
          className="h-full w-full object-contain"
        />
      </div>

      {showText && (
        <span className={`text-slate-900 ${config.textClass} ${textClassName}`}>
          Scene<span className="text-rose-600">O</span>
          {badge && (
            <span className="ml-1.5 text-xs font-semibold text-slate-500 font-sans tracking-normal">
              {badge}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

export default BrandLogo;
