export default function LoadingSpinner({ size = 'md' }) {
  const sizes = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-[3px]',
  }
  return (
    <span
      className={`inline-block rounded-full border-white/20 border-t-violet-400 animate-spin ${sizes[size]}`}
      role="status"
      aria-label="Loading"
    />
  )
}
