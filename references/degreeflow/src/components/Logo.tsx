import { Link } from "@tanstack/react-router";

interface LogoMarkProps {
  size?: number;
  className?: string;
}

/** Official DegreeFlow mark. */
export function LogoMark({ size = 28, className = "" }: LogoMarkProps) {
  return (
    <img
      src="/degreeflow-logo.svg"
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
      draggable={false}
      aria-hidden="true"
    />
  );
}

interface LogoProps {
  size?: "sm" | "md" | "lg";
  withWordmark?: boolean;
  to?: string;
  className?: string;
}

const SIZES = {
  sm: { icon: 32, text: "text-lg" },
  md: { icon: 44, text: "text-2xl" },
  lg: { icon: 64, text: "text-4xl" },
};

export function Logo({ size = "md", withWordmark = true, to = "/", className = "" }: LogoProps) {
  const s = SIZES[size];

  const content = (
    <span className={`inline-flex items-center gap-2 shrink-0 ${className}`}>
      <LogoMark size={s.icon} className="shrink-0" />
      {withWordmark && (
        <span className={`font-display ${s.text} text-ink tracking-tight leading-none`}>
          DegreeFlow
        </span>
      )}
    </span>
  );

  if (!to) return content;

  return (
    <Link to={to} aria-label="DegreeFlow home" className="inline-flex items-center">
      {content}
    </Link>
  );
}