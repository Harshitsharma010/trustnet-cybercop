type IconName =
  | "activity"
  | "alert"
  | "check"
  | "chevron"
  | "clock"
  | "cloud"
  | "code"
  | "cpu"
  | "github"
  | "globe"
  | "refresh"
  | "search"
  | "server"
  | "shield"
  | "zap";

type IconProps = {
  name: IconName;
  className?: string;
};

export function Icon({ name, className = "" }: IconProps) {
  const commonProps = {
    className: `icon ${className}`.trim(),
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  };

  switch (name) {
    case "activity":
      return (
        <svg {...commonProps}>
          <path d="M3 12h4l2.3-6 5.4 12L17 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "alert":
      return (
        <svg {...commonProps}>
          <path d="M12 3 2.8 19a1.4 1.4 0 0 0 1.2 2h16a1.4 1.4 0 0 0 1.2-2L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12 8v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 17h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );
    case "check":
      return (
        <svg {...commonProps}>
          <path d="m5 12.5 4.2 4.2L19 7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "chevron":
      return (
        <svg {...commonProps}>
          <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "clock":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 7.5V12l3.2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "cloud":
      return (
        <svg {...commonProps}>
          <path d="M7.5 18.5h9.2a4.3 4.3 0 0 0 .6-8.5 6 6 0 0 0-11.2 1.8 3.4 3.4 0 0 0 1.4 6.7Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "code":
      return (
        <svg {...commonProps}>
          <path d="m8 8-4 4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m16 8 4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m13.5 5-3 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "cpu":
      return (
        <svg {...commonProps}>
          <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M10 11h4v3h-4z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "github":
      return (
        <svg {...commonProps} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.5-1.1-4.5-4.9 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.5 9.5 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.8-2.3 4.6-4.5 4.9.4.3.7 1 .7 2v2.6c0 .3.2.6.7.5A10 10 0 0 0 12 2.2Z" />
        </svg>
      );
    case "globe":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3.8 12h16.4M12 3.5c2.2 2.3 3.4 5.2 3.4 8.5S14.2 18.2 12 20.5M12 3.5C9.8 5.8 8.6 8.7 8.6 12S9.8 18.2 12 20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "refresh":
      return (
        <svg {...commonProps}>
          <path d="M20 6v5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 18v-5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18.2 9A7 7 0 0 0 6 7.8L4 10M5.8 15A7 7 0 0 0 18 16.2l2-2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "search":
      return (
        <svg {...commonProps}>
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "server":
      return (
        <svg {...commonProps}>
          <rect x="4" y="5" width="16" height="5.5" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <rect x="4" y="13.5" width="16" height="5.5" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M7 7.8h.01M7 16.3h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case "shield":
      return (
        <svg {...commonProps}>
          <path d="M12 3.2 19 6v5.3c0 4.4-2.8 7.6-7 9.5-4.2-1.9-7-5.1-7-9.5V6l7-2.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "zap":
      return (
        <svg {...commonProps}>
          <path d="M13 2.8 5.5 13H12l-1 8.2L18.5 11H12l1-8.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}
