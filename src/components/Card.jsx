// Cartão base do terminal
export default function Card({ as: Tag = 'section', className = '', children, ...rest }) {
  return (
    <Tag
      className={`rounded-3xl bg-card border border-zinc-800/90 ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}
