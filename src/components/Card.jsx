// Cartão base com o visual "glass" do terminal
export default function Card({ as: Tag = 'section', className = '', children }) {
  return (
    <Tag
      className={`rounded-3xl bg-card/90 border border-slate-800/90 shadow-glass backdrop-blur-md ${className}`}
    >
      {children}
    </Tag>
  )
}
