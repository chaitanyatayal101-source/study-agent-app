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
      <section className="flex flex-1 flex-col justify-center rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl shadow-slate-950/40 sm:p-10 lg:p-14">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-300">
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
                className="rounded-full bg-[#ff5a36] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#fb6c45]"
              >
                CHAT WITH AGENT
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-blue-500 hover:text-white"
              >
                View Dashboard
              </Link>
            </div>
          </div>

          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold text-white">What Study Agent offers</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {features.map((feature) => (
                <li key={feature} className="flex gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#ff5a36]" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-sm font-semibold text-slate-100">Specialties</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {specialties.map((specialty) => (
                  <span key={specialty} className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-200">
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
