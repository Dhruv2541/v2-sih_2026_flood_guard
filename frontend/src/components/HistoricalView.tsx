import React, { useMemo, useState } from 'react';
import { DATA_SOURCES_CATALOG, HISTORICAL_DATA } from '../data/assamData';
import { useTheme } from '../context/ThemeContext';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { ArrowDownRight, ArrowUpRight, Coins, Droplets, Info, ShieldAlert, TrendingUp, Users, Waves } from 'lucide-react';
import { Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Severity = 'Catastrophic' | 'Severe' | 'Moderate' | 'Low impact';
type HistoricalRecord = typeof HISTORICAL_DATA[number];

const severityFor = (record: HistoricalRecord): Severity => {
  if (record.floodInundationAreaKm2 >= 5000 || record.affectedPopulationTotal >= 5000000 || record.damagesCrInr >= 1500) return 'Catastrophic';
  if (record.floodInundationAreaKm2 >= 3500 || record.affectedPopulationTotal >= 2750000 || record.damagesCrInr >= 800) return 'Severe';
  if (record.floodInundationAreaKm2 >= 2400 || record.affectedPopulationTotal >= 1800000 || record.damagesCrInr >= 400) return 'Moderate';
  return 'Low impact';
};

const severityStyle: Record<Severity, { chip: string; dot: string; label: string }> = {
  Catastrophic: { chip: 'bg-violet-100 text-violet-800 dark:bg-violet-950/70 dark:text-violet-200 border-violet-200 dark:border-violet-800', dot: 'bg-violet-600 dark:bg-violet-400', label: 'CAT' },
  Severe: { chip: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200 border-amber-200 dark:border-amber-800', dot: 'bg-amber-600 dark:bg-amber-400', label: 'SEV' },
  Moderate: { chip: 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-200 border-sky-200 dark:border-sky-800', dot: 'bg-sky-600 dark:bg-sky-400', label: 'MOD' },
  'Low impact': { chip: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700', dot: 'bg-slate-600 dark:bg-slate-300', label: 'LOW' },
};

const percentFromAverage = (value: number, average: number) => ((value - average) / average) * 100;
const comparisonText = (value: number, average: number) => {
  const difference = percentFromAverage(value, average);
  return Math.abs(difference) < 0.5 ? 'Near average' : `${Math.round(Math.abs(difference))}% ${difference > 0 ? 'above' : 'below'} average`;
};

const HistoricalTooltip = ({ active, payload, selectedYear, isDark }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const selected = Number(data.year) === selectedYear;
  const severity = severityFor(data.record);
  const colors = isDark ? { text: '#eef3fa', muted: '#b1c0d4', surface: '#111c2e', border: '#2c3e56' } : { text: '#0b1c30', muted: '#475569', surface: '#ffffff', border: '#dbe4ef' };
  return <div role="status" aria-live="polite" className="min-w-52 rounded-xl border p-3 shadow-xl" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }}>
    <div className="flex items-center justify-between gap-3 border-b pb-2" style={{ borderColor: colors.border }}><span className="font-mono text-sm font-extrabold">{data.year}</span><span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${severityStyle[severity].chip}`}>{severity}</span></div>
    <p className="mt-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: selected ? '#0284c7' : colors.muted }}>{selected ? 'Selected analysis year' : `Comparing with selected ${selectedYear}`}</p>
    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
      <div><dt style={{ color: colors.muted }}>Rainfall</dt><dd className="font-semibold">{data.rainfallMm.toLocaleString()} mm</dd></div><div><dt style={{ color: colors.muted }}>Inundation</dt><dd className="font-semibold">{data.inundationKm2.toLocaleString()} km²</dd></div>
      <div><dt style={{ color: colors.muted }}>People affected</dt><dd className="font-semibold">{data.populationM.toFixed(2)}M</dd></div><div><dt style={{ color: colors.muted }}>Est. damage</dt><dd className="font-semibold">₹{data.damagesCr.toLocaleString()} Cr</dd></div>
    </dl>
  </div>;
};

export const HistoricalView: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(2024);
  const { resolvedTheme } = useTheme();
  const reduceMotion = usePrefersReducedMotion();
  const isDark = resolvedTheme === 'dark';
  const activeRecord = HISTORICAL_DATA.find((d) => d.year === selectedYear) || HISTORICAL_DATA[0];
  const activeSeverity = severityFor(activeRecord);
  const historicalSource = DATA_SOURCES_CATALOG.find((source) => source.category === 'Historical Floods');
  const averages = useMemo(() => ({
    rainfall: HISTORICAL_DATA.reduce((sum, d) => sum + d.monsoonRainfallMm, 0) / HISTORICAL_DATA.length,
    inundation: HISTORICAL_DATA.reduce((sum, d) => sum + d.floodInundationAreaKm2, 0) / HISTORICAL_DATA.length,
    population: HISTORICAL_DATA.reduce((sum, d) => sum + d.affectedPopulationTotal, 0) / HISTORICAL_DATA.length,
    damage: HISTORICAL_DATA.reduce((sum, d) => sum + d.damagesCrInr, 0) / HISTORICAL_DATA.length,
  }), []);
  const comparisonMetrics = [
    { label: 'Rainfall', value: activeRecord.monsoonRainfallMm, average: averages.rainfall },
    { label: 'Flooded territory', value: activeRecord.floodInundationAreaKm2, average: averages.inundation },
    { label: 'People affected', value: activeRecord.affectedPopulationTotal, average: averages.population },
    { label: 'Economic damage', value: activeRecord.damagesCrInr, average: averages.damage },
  ];
  const correlationData = HISTORICAL_DATA.map((d) => ({ year: d.year.toString(), rainfallMm: d.monsoonRainfallMm, inundationKm2: d.floodInundationAreaKm2, populationM: d.affectedPopulationTotal / 1000000, damagesCr: d.damagesCrInr, record: d }));
  const keyInsight = useMemo(() => {
    const facts = [
      { label: 'flooded territory', value: activeRecord.floodInundationAreaKm2, max: Math.max(...HISTORICAL_DATA.map((d) => d.floodInundationAreaKm2)), average: averages.inundation },
      { label: 'monsoon rainfall', value: activeRecord.monsoonRainfallMm, max: Math.max(...HISTORICAL_DATA.map((d) => d.monsoonRainfallMm)), average: averages.rainfall },
      { label: 'people affected', value: activeRecord.affectedPopulationTotal, max: Math.max(...HISTORICAL_DATA.map((d) => d.affectedPopulationTotal)), average: averages.population },
      { label: 'estimated economic damage', value: activeRecord.damagesCrInr, max: Math.max(...HISTORICAL_DATA.map((d) => d.damagesCrInr)), average: averages.damage },
    ];
    const recordHigh = facts.find((fact) => fact.value === fact.max);
    if (recordHigh) return `Highest ${recordHigh.label} in the available 2018–2025 record.`;
    const largestDeparture = facts.map((fact) => ({ ...fact, difference: percentFromAverage(fact.value, fact.average) })).sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))[0];
    return `${largestDeparture.label[0].toUpperCase()}${largestDeparture.label.slice(1)} was ${Math.round(Math.abs(largestDeparture.difference))}% ${largestDeparture.difference > 0 ? 'above' : 'below'} the period average.`;
  }, [activeRecord, averages]);

  const gridStroke = isDark ? '#2c3e56' : '#e8eef5';
  const axisStroke = isDark ? '#b1c0d4' : '#475569';
  const selectedBar = isDark ? '#38bdf8' : '#0284c7';
  const mutedBar = isDark ? '#31516b' : '#b9dced';
  const selectedLine = isDark ? '#fbbf24' : '#b45309';
  const mutedLine = isDark ? '#9aaac0' : '#64748b';

  return <div className="w-full max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 py-5 space-y-5 min-w-0">
    <header className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors min-w-0">
      <div><div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-sky-600 dark:bg-sky-400" aria-hidden="true" /><span className="text-xs font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Assam flood event archive (2018–2025)</span></div><h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0b1c30] dark:text-slate-100">Historical Flood Events</h2><p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">Compare annual rainfall, flooded territory, people affected, and estimated damage in one historical record.</p></div>
      <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 overflow-x-auto max-w-full touch-pan-x scrollbar-none self-start md:self-auto" aria-label="Select a historical year">
        {HISTORICAL_DATA.map((d) => <button key={d.year} type="button" onClick={() => setSelectedYear(d.year)} aria-pressed={selectedYear === d.year} className={`px-3 py-1.5 min-h-[36px] text-xs font-bold font-mono rounded-lg transition-colors duration-150 whitespace-nowrap flex-shrink-0 ${selectedYear === d.year ? 'bg-[#0b1c30] dark:bg-sky-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'}`}>{d.year}</button>)}
      </div>
    </header>

    <section aria-labelledby="selected-profile" className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-all ${reduceMotion ? 'duration-0' : 'duration-200'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-100 dark:border-slate-800"><div className="flex items-center gap-2.5"><h3 id="selected-profile" className="text-xl sm:text-2xl font-extrabold text-[#0b1c30] dark:text-white font-heading">{activeRecord.year} Flood Profile</h3><span className={`px-2.5 py-0.5 rounded-full border text-xs font-extrabold uppercase font-mono ${severityStyle[activeSeverity].chip}`}>{activeSeverity}</span></div><span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Districts impacted: <strong className="text-slate-700 dark:text-slate-200">{activeRecord.affectedDistrictsCount || activeRecord.districtsAffectedCount} of 35</strong></span></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
        {[
          { label: 'Monsoon rainfall', value: `${activeRecord.monsoonRainfallMm.toLocaleString()} mm`, note: 'Basin cumulative precipitation', Icon: Droplets, accent: 'text-blue-600 dark:text-sky-400' },
          { label: 'Flooded territory', value: `${activeRecord.floodInundationAreaKm2.toLocaleString()} km²`, note: 'Submerged land & crop area', Icon: Waves, accent: 'text-sky-700 dark:text-sky-400' },
          { label: 'People affected', value: `${(activeRecord.affectedPopulationTotal / 1000000).toFixed(2)}M`, note: 'Displaced or relief sheltered', Icon: Users, accent: 'text-indigo-700 dark:text-indigo-300' },
          { label: 'Economic damage', value: `₹${activeRecord.damagesCrInr.toLocaleString()} Cr`, note: 'Infrastructure & crop loss', Icon: Coins, accent: 'text-amber-700 dark:text-amber-300' },
        ].map(({ label, value, note, Icon, accent }) => <div key={label} className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80"><div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase font-mono"><span>{label}</span><Icon className={`w-4 h-4 ${accent}`} aria-hidden="true" /></div><div className={`mt-2 text-2xl sm:text-3xl font-extrabold font-heading ${accent}`}>{value}</div><p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">{note}</p></div>)}
      </div>
      <div className="mt-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 px-3.5 py-3" aria-label={`Comparison of ${selectedYear} with historical averages`}><div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200"><TrendingUp className="w-4 h-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />Compared with 2018–2025 average</div><div className="mt-2 grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2">{comparisonMetrics.map((metric) => { const difference = percentFromAverage(metric.value, metric.average); const Direction = difference >= 0 ? ArrowUpRight : ArrowDownRight; return <div key={metric.label} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300"><Direction className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" aria-hidden="true" /><span><strong className="font-semibold text-slate-800 dark:text-slate-100">{metric.label}:</strong> {comparisonText(metric.value, metric.average)}</span></div>; })}</div></div>
    </section>

    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-5">
      <section aria-labelledby="historical-trend" className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 min-w-0"><div><h3 id="historical-trend" className="font-heading font-bold text-base text-[#0b1c30] dark:text-slate-100">Inundation and rainfall trend</h3><p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Bars show flooded territory; line shows monsoon rainfall. The {selectedYear} record is emphasized.</p></div>
        <div className="h-72 w-full min-w-0"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={correlationData} margin={{ top: 12, right: 10, left: 4, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} /><XAxis dataKey="year" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} /><YAxis yAxisId="left" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} width={52} label={{ value: 'Inundation (km²)', angle: -90, position: 'insideLeft', fill: axisStroke, fontSize: 11 }} /><YAxis yAxisId="right" orientation="right" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} width={48} label={{ value: 'Rainfall (mm)', angle: 90, position: 'insideRight', fill: axisStroke, fontSize: 11 }} /><Tooltip content={<HistoricalTooltip selectedYear={selectedYear} isDark={isDark} />} cursor={{ fill: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(14,116,144,0.05)' }} /><Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} /><ReferenceLine yAxisId="left" y={averages.inundation} stroke={isDark ? '#7386a0' : '#94a3b8'} strokeDasharray="4 4" label={{ value: 'Avg. inundation', position: 'insideTopLeft', fill: axisStroke, fontSize: 10 }} /><Bar yAxisId="left" dataKey="inundationKm2" name="Inundation (km²)" radius={[4, 4, 0, 0]} maxBarSize={46} isAnimationActive={!reduceMotion}>{correlationData.map((entry) => <Cell key={entry.year} fill={Number(entry.year) === selectedYear ? selectedBar : mutedBar} fillOpacity={Number(entry.year) === selectedYear ? 1 : 0.65} />)}</Bar><Line yAxisId="right" type="monotone" dataKey="rainfallMm" stroke={mutedLine} strokeWidth={2.25} name="Rainfall (mm)" isAnimationActive={!reduceMotion} activeDot={{ r: 6, strokeWidth: 2, fill: selectedLine }} dot={(props: any) => { const selected = Number(props.payload.year) === selectedYear; return <circle cx={props.cx} cy={props.cy} r={selected ? 6 : 3.5} fill={selected ? selectedLine : mutedLine} stroke={isDark ? '#111c2e' : '#ffffff'} strokeWidth={selected ? 2 : 1.5} />; }} /></ComposedChart></ResponsiveContainer></div>
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Severity timeline · select a year</p><div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5" aria-label="Historical severity timeline">{HISTORICAL_DATA.map((record) => { const severity = severityFor(record); const selected = record.year === selectedYear; return <button key={record.year} type="button" onClick={() => setSelectedYear(record.year)} aria-pressed={selected} aria-label={`${record.year}, ${severity}${selected ? ', selected' : ''}`} className={`min-h-12 rounded-lg border px-1.5 py-1.5 text-left transition-colors ${selected ? 'border-sky-600 bg-sky-50 dark:border-sky-400 dark:bg-sky-950/50 ring-1 ring-sky-600/25 dark:ring-sky-400/25' : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:bg-slate-800'}`}><span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${severityStyle[severity].dot}`} aria-hidden="true" /><span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100">{record.year}</span></span><span className="block mt-1 pl-3.5 text-[9px] font-bold tracking-wide text-slate-500 dark:text-slate-400">{severityStyle[severity].label}</span></button>; })}</div></div>
      </section>
      <aside className="space-y-4"><section aria-labelledby="key-insight" className="bg-sky-50/70 dark:bg-sky-950/25 p-4 rounded-2xl border border-sky-200 dark:border-sky-900/80 shadow-sm"><div className="flex items-center gap-2 text-sky-900 dark:text-sky-100"><ShieldAlert className="w-4 h-4" aria-hidden="true" /><h3 id="key-insight" className="text-sm font-bold">Key historical insight</h3></div><p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{keyInsight}</p><p className="mt-2 text-xs text-slate-600 dark:text-slate-400">Selection: {selectedYear} · {activeSeverity}</p></section><section aria-labelledby="what-happened" className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"><h3 id="what-happened" className="text-sm font-bold text-[#0b1c30] dark:text-slate-100">What happened?</h3><p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{activeRecord.summaryNarrative || activeRecord.keyEvents}</p><dl className="mt-3 space-y-2 text-xs border-t border-slate-100 dark:border-slate-800 pt-3"><div className="flex gap-2"><dt className="shrink-0 font-semibold text-slate-500 dark:text-slate-400">Severity</dt><dd className="text-slate-700 dark:text-slate-200">{activeSeverity}</dd></div><div className="flex gap-2"><dt className="shrink-0 font-semibold text-slate-500 dark:text-slate-400">Districts</dt><dd className="text-slate-700 dark:text-slate-200">{activeRecord.districtsAffectedCount} impacted; most affected: {activeRecord.highestSeverityDistrict}</dd></div>{historicalSource && <div className="flex gap-2"><dt className="shrink-0 font-semibold text-slate-500 dark:text-slate-400">Record</dt><dd className="text-slate-700 dark:text-slate-200">{historicalSource.sourceAgency}</dd></div>}</dl></section></aside>
    </div>
    <div className="flex gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 px-3.5 py-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400"><Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-500 dark:text-slate-400" aria-hidden="true" /><p>Historical values are estimates/records for Assam flood events from 2018–2025. Source: {historicalSource?.name || 'historical flood archive'} — {historicalSource?.sourceAgency || 'Assam State Disaster Management Authority'}; values are not live official updates.</p></div>
  </div>;
};
