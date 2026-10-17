// Cartão base com o visual "glass" do terminal
export default function Card({ as: Tag = 'section', className = '', children, ...rest }) {
  return (
    <Tag
      className={`rounded-3xl bg-card/90 border border-zinc-800/90 shadow-glass backdrop-blur-md ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}
