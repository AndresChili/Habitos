type IconProps = { className?: string };

const base = "h-5 w-5";

export function IconToday({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17" strokeLinecap="round" />
      <path d="M8 3v3M16 3v3" strokeLinecap="round" />
      <path d="M8 13.2l1.6 1.6L13.2 11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconHabits({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <path
        d="M12 4.5a7.5 7.5 0 1 0 6.4 3.6"
        strokeLinecap="round"
      />
      <path d="M18.5 4v4.4h-4.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.3 12.2l1.9 1.9 3.6-3.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconWeight({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <circle cx="12" cy="12.5" r="8" />
      <path d="M9.5 9.2 12 12.5" strokeLinecap="round" />
      <path d="M9.8 4.6h4.4l.6 2.4H9.2z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconLogout({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <path d="M9 20H5.5A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4H9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.5 16 19 12l-4.5-4M19 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
