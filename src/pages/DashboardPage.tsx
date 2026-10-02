import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchDashboardStats } from '../api/dashboard'
import type { DashboardStats } from '../lib/types'

const STATUS_COLORS: Record<string, string> = {
  New: '#64748b',
  Contacted: '#3b82f6',
  Qualified: '#8b5cf6',
  Won: '#10b981',
  Lost: '#ef4444',
}

const SOURCE_COLOR = '#6366f1'

export function DashboardPage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
  })

  if (isPending) {
    return <p className="text-sm text-slate-500">Loading dashboard…</p>
  }

  if (isError) {
    return (
      <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
        Could not load dashboard stats.
      </p>
    )
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="text-sm text-slate-500">
          Owner-scoped aggregates across your leads.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total leads" value={data.total} />
        <StatCard label="Won rate" value={`${data.won_rate}%`} />
        <StatCard label="This week" value={data.this_week} />
        <StatCard label="This month" value={data.this_month} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="By status">
          <StatusChart data={data} />
        </ChartCard>
        <ChartCard title="By source">
          <SourceChart data={data} />
        </ChartCard>
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">{title}</h2>
      <div className="h-64 w-full">{children}</div>
    </div>
  )
}

function StatusChart({ data }: { data: DashboardStats }) {
  const rows = Object.entries(data.by_status).map(([name, value]) => ({ name, value }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" fontSize={12} stroke="#64748b" />
        <YAxis allowDecimals={false} fontSize={12} stroke="#64748b" />
        <Tooltip />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {rows.map((row) => (
            <Cell key={row.name} fill={STATUS_COLORS[row.name] ?? '#94a3b8'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function SourceChart({ data }: { data: DashboardStats }) {
  const rows = Object.entries(data.by_source).map(([name, value]) => ({ name, value }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" fontSize={12} stroke="#64748b" />
        <YAxis allowDecimals={false} fontSize={12} stroke="#64748b" />
        <Tooltip />
        <Bar dataKey="value" fill={SOURCE_COLOR} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
