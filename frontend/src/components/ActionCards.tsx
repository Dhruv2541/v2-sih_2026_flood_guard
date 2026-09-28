import React from 'react';
import { ArrowRight, BatteryCharging, Droplets, Phone, ShieldAlert, Waves } from 'lucide-react';
import { EMERGENCY_CONTACTS } from '../data/assamData';

interface ActionCardsProps {
  onOpenGuideModal: () => void;
  onCallNumber: (number: string) => void;
}

export const ActionCards: React.FC<ActionCardsProps> = ({ onOpenGuideModal, onCallNumber }) => {
  const emergency = EMERGENCY_CONTACTS[0];

  return (
    <section className="max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 mt-8 w-full min-w-0" aria-labelledby="actions-heading">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
        <div>
          <span className="text-[11px] font-semibold tracking-[0.13em] text-sky-600 dark:text-sky-400 uppercase">Safety actions</span>
          <h2 id="actions-heading" className="mt-1 font-heading font-bold text-xl sm:text-2xl text-[#0b1c30] dark:text-slate-100 tracking-tight">What to do now</h2>
        </div>
        <button type="button" onClick={onOpenGuideModal} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-sky-700 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300">
          Open full safety guide <ArrowRight className="w-[18px] h-[18px]" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_300px] gap-4">
        <article className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400"><Droplets className="w-5 h-5" /></span><div><span className="text-[11px] font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">Priority one</span><h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">Prepare to move early</h3></div></div>
          <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">Pack identity documents in a waterproof sleeve and keep 72 hours of safe water and essentials ready. Do not wait for water to enter your home.</p>
        </article>

        <article className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"><ShieldAlert className="w-5 h-5" /></span><div><span className="text-[11px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">Priority two</span><h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">Avoid moving water</h3></div></div>
          <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">Never walk, swim, or drive through flowing water. Stay away from downed lines and move to a designated safe location if instructed.</p>
        </article>

        <aside className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-5 flex flex-col justify-between">
          <div><span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Emergency support</span><h3 className="mt-2 font-heading text-lg font-bold text-slate-900 dark:text-slate-100">{emergency.name}</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{emergency.available}</p></div>
          <button onClick={() => onCallNumber(emergency.numbers[0])} className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-semibold text-white transition-colors"><Phone className="w-[18px] h-[18px]" />Call {emergency.numbers[0]}</button>
        </aside>
      </div>
    </section>
  );
};
