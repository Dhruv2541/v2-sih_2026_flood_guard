import React, { useState } from 'react';
import { ShieldCheck, CheckSquare, Square, Download, Phone, AlertTriangle, Droplets, Beef } from 'lucide-react';
import { ActionCards } from './ActionCards';

interface SafetyGuideViewProps {
  onOpenGuideModal: () => void;
  onCallNumber: (num: string) => void;
  onOpenShelterMap: () => void;
}

export const SafetyGuideView: React.FC<SafetyGuideViewProps> = ({
  onOpenGuideModal,
  onCallNumber,
  onOpenShelterMap,
}) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    item1: true,
    item2: true,
  });

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const survivalKitItems = [
    { id: 'item1', title: '72-Hour Potable Water Container', desc: 'At least 3 litres per person per day with water purification / halogen tablets.' },
    { id: 'item2', title: 'Waterproof Poly-Sleeve for Vital Documents', desc: 'Aadhaar, Land Patta, NRC slips, Bank passbooks, Ration card, school certificates.' },
    { id: 'item3', title: 'Dry Monsoonal Ration Stock', desc: 'Chira (flattened rice), Gur (jaggery), Muri (puffed rice), roasted grams, biscuits.' },
    { id: 'item4', title: 'Emergency Signaling & Lighting', desc: 'High-lumen waterproof torch, spare 18650 batteries, whistle, orange/red reflective banner.' },
    { id: 'item5', title: 'First Aid & Antivenom Emergency Kit', desc: 'Bandages, antiseptic solution, ORS packets, Paracetamol, anti-diarrheal, snakebite pressure bandage.' },
    { id: 'item6', title: 'Battery Power Bank & Transistor Radio', desc: 'Fully charged 20,000mAh bank with AM radio tuned to AIR Guwahati (1035 kHz).' },
  ];

  return (
    <div className="w-full max-w-[1440px] mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in duration-200 min-w-0">
      {/* Title */}
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-end justify-between gap-4 transition-colors min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-[#006398] dark:text-sky-400 uppercase truncate">
            <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
            <span className="truncate">ASDMA ASSAM COMMUNITY RESILIENCE PROTOCOL</span>
          </div>
          <h1 className="font-heading font-extrabold text-xl sm:text-2xl sm:text-3xl text-[#0b1c30] dark:text-slate-100 tracking-tight mt-1">
            Flood Preparedness & Survival Manual
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal mt-1 max-w-3xl">
            Standard Operating Procedures (SOP) authorized for Brahmaputra valley riparian communities and flood-prone revenue circles.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-end">
          <button
            onClick={onOpenGuideModal}
            className="flex items-center gap-2 px-4 py-2 min-h-[40px] sm:min-h-0 rounded bg-[#0b1c30] dark:bg-sky-600 hover:bg-[#1a2b42] dark:hover:bg-sky-500 text-white text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Offline Card</span>
          </button>
        </div>
      </div>

      {/* Action Cards Included */}
      <ActionCards onOpenGuideModal={onOpenGuideModal} onCallNumber={onCallNumber} />

      {/* Interactive Emergency Kit Packing Checklist */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-800 p-6 shadow-sm transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-slate-100">
              Interactive 72-Hour Survival Kit Checklist
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Check off items as you pack them into waterproof sealed containers.
            </p>
          </div>

          <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded">
            {Object.values(checkedItems).filter(Boolean).length} / {survivalKitItems.length} Packed
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {survivalKitItems.map((item) => {
            const isChecked = !!checkedItems[item.id];
            return (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-all flex items-start gap-3.5 ${
                  isChecked
                    ? 'bg-sky-50/60 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="mt-0.5 text-sky-700 dark:text-sky-400">
                  {isChecked ? (
                    <CheckSquare className="w-5 h-5 text-sky-700 dark:text-sky-400" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  )}
                </div>
                <div>
                  <h4
                    className={`font-semibold text-sm ${
                      isChecked ? 'text-sky-950 dark:text-sky-200 line-through' : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cattle and Livestock Evacuation Protocol */}
      <div className="bg-amber-50/70 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900/60 p-6 transition-colors">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded bg-amber-600 text-white flex items-center justify-center flex-shrink-0">
            <Beef className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-lg text-amber-950 dark:text-amber-200">
              Livestock & Cattle Evacuation Mandate
            </h3>
            <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-300 mt-1 leading-relaxed">
              Never leave cattle tied to sheds when flood waters begin rising. Domestic animals will drown if tethered. Untie them immediately and drive them along pre-identified high-bund paths toward village elevated shelters. Contact your Circle Veterinary Officer if fodder assistance is required.
            </p>
            <div className="mt-4">
              <button
                onClick={onOpenShelterMap}
                className="px-4 py-2 rounded bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold transition"
              >
                Locate Shelters with High-Bund Livestock Pens
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
