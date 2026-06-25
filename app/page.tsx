import Link from 'next/link'

import PageShell from './components/PageShell'

const features = [
  'Ask questions in plain English and get step-by-step explanations.',
  'Identify the topic or concept you are studying and tailor the guidance.',
  'Save key insights and track your learning progress over time.',
]

const specialties = [
  'Math and science tutoring',
  'Exam prep and revision help',
  'Concept clarity for school and college topics',
]

export default function Home() {
  return (
    <PageShell maxWidth="max-w-6xl">
      <section className="relative flex flex-1 flex-col justify-center overflow-hidden rounded-3xl border border-fuchsia-500/30 bg-[linear-gradient(135deg,_#050816_0%,_#111827_40%,_#1d4ed8_100%)] p-6 shadow-[0_0_80px_rgba(236,72,153,0.18)] sm:p-10 lg:p-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.35),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(250,204,21,0.35),_transparent_30%),radial-gradient(circle_at_center,_rgba(236,72,153,0.24),_transparent_40%)]" />
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border border-cyan-300/60 bg-cyan-400/20 px-3 py-1 text-sm font-medium text-cyan-200 shadow-[0_0_22px_rgba(34,211,238,0.25)]">
              Your personal study companion
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Learn faster with Study Agent.
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Study Agent helps students understand topics clearly, practice smarter, and keep a record of what they have learned.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/chat"
                className="rounded-full bg-gradient-to-r from-[#ff2d55] via-[#ff5a36] to-[#facc15] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(255,90,54,0.35)] transition hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(255,90,54,0.45)]"
              >
                CHAT WITH AGENT
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-fuchsia-400/40 bg-slate-900/80 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400 hover:text-white hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
              >
                View Dashboard
              </Link>
            </div>
          </div>

          <div className="w-full max-w-xl rounded-2xl border border-cyan-400/20 bg-slate-900/80 p-6 shadow-[0_0_35px_rgba(34,211,238,0.12)] backdrop-blur">
            <h2 className="text-xl font-semibold text-white">What Study Agent offers</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {features.map((feature) => (
                <li key={feature} className="flex gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-fuchsia-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-2xl border border-fuchsia-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-fuchsia-950/40 p-4">
              <p className="text-sm font-semibold text-slate-100">Specialties</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {specialties.map((specialty) => (
                  <span key={specialty} className="rounded-full border border-cyan-400/30 bg-cyan-400/15 px-3 py-1 text-sm text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,0.15)]">
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
