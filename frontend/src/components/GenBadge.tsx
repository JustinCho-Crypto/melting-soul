interface Props {
  generation: number
  size?: 'sm' | 'md'
}

export function GenBadge({ generation, size = 'sm' }: Props) {
  const sizeClass = size === 'md'
    ? 'px-2.5 py-1 text-xs'
    : 'px-2 py-0.5 text-[10px]'

  if (generation === 0) {
    return (
      <span className={`rounded-full bg-astral-amber/20 font-semibold text-astral-amber ${sizeClass}`}>
        Gen 0 &middot; Origin
      </span>
    )
  }
  if (generation === 1) {
    return (
      <span className={`rounded-full bg-ethereal-blue/20 font-semibold text-ethereal-blue ${sizeClass}`}>
        Gen {generation}
      </span>
    )
  }
  return (
    <span className={`rounded-full bg-plasma-pink/20 font-semibold text-plasma-pink ${sizeClass}`}>
      Gen {generation}
    </span>
  )
}
