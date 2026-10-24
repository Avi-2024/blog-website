import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export function ClockIcon(props: IconProps) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 6v6l4 2" />
  </svg>;
}

export function MenuIcon({ open, ...props }: IconProps & { open: boolean }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false" {...props}>
    {open ? <path d="m6 6 12 12M6 18 18 6" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
  </svg>;
}
