import Link from 'next/link'

const links = [
  { href: '/', label: 'Chat' },
  { href: '/dashboard', label: 'Dashboard' },
]

export default function TopNav() {
  return (
    <nav className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 shadow-lg shadow-slate-950/40">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-slate-100">Study Agent</p>
          <p className="text-sm text-slate-400">Track concepts and keep learning momentum</p>
        </div>
        <div className="flex gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition hover:border-blue-500 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
