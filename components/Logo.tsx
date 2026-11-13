import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="Observatorio La Libertad Produce, inicio">
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
        <rect x="1" y="1" width="34" height="34" rx="4" fill="none" stroke="#FFFFFF" strokeWidth="2" />
        <rect x="9" y="19" width="4" height="9" fill="#FFFFFF" />
        <rect x="16" y="13" width="4" height="15" fill="#FFFFFF" />
        <rect x="23" y="8" width="4" height="20" fill="#9CC7EC" />
      </svg>
      <span className="logo-txt">
        <strong>Observatorio La Libertad Produce</strong>
        <span>Indicadores de la actividad productiva regional</span>
      </span>
    </Link>
  );
}
