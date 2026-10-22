// The TALEEM360 logo ("Planet Taleem": a smiling planet with a graduation cap and a ring).
// The file is public/logo-planet.svg; a copy of the source is kept in brand/.
interface LogoProps {
  size?: number
  /** Give it a name when the logo stands alone. Leave it out next to the "TALEEM360" text. */
  label?: string
  className?: string
}

export default function Logo({ size = 40, label, className }: LogoProps) {
  return (
    <img
      src="/logo-planet.svg"
      width={size}
      height={size}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      className={className ? `logo ${className}` : 'logo'}
      draggable={false}
    />
  )
}
