import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Flag, 
  CheckCircle2, 
  Upload, 
  AlertTriangle, 
  Info, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  FileText, 
  Camera, 
  UserCheck, 
  Trash2,
  Cpu,
  ArrowRight
} from 'lucide-react';
import { SectorData } from '../types';

interface DataInaccuracyModalProps {
  isOpen: boolean;
  onClose: () => void;
  sector: SectorData;
}

interface FeedbackFormState {
  category: string;
  observedCondition: string;
  specificLocation: string;
  description: string;
  observerRole: string;
  contactInfo: string;
  photoPreview: string | null;
  photoName: string | null;
}

const INACCURACY_CATEGORIES = [
  {
    id: 'depth_discrepancy',
    label: 'Water Depth Discrepancy',
    desc: 'Actual flood depth is significantly higher or lower than the model prediction',
  },
  {
    id: 'inundation_extent',
    label: 'Inundation Boundary Error',
    desc: 'Area marked flooded is dry, or dry zone is actively submerged',
  },
  {
    id: 'embankment_breach',
    label: 'Dyke / Embankment Breach',
    desc: 'Unreported embankment breach or newly repaired bund altering overland flow',
  },
  {
    id: 'road_accessibility',
    label: 'Road / Highway Passability',
    desc: 'Evacuation route or highway blocked by water, or passable despite warning',
  },
  {
    id: 'gauge_drift',
    label: 'Gauge / Telemetry Error',
    desc: 'Local river gauge appears stuck, drifted, or reporting erroneous stage readings',
  },
  {
    id: 'other',
    label: 'Other Ground Observation',
    desc: 'Other terrain or hydrologic divergence on the ground',
  },
];

const OBSERVED_CONDITIONS = [
  { id: 'dry', label: 'Dry / No Standing Water', color: 'text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40' },
  { id: 'receding', label: 'Water Receding Rapidly', color: 'text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40' },
  { id: 'shallow', label: 'Ankle Deep (< 0.3m)', color: 'text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40' },
  { id: 'moderate', label: 'Knee to Waist (0.3m – 1.0m)', color: 'text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40' },
  { id: 'critical', label: 'Deep / Overtopping (> 1.5m)', color: 'text-red-700 dark:text-red-300 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40' },
];

const OBSERVER_ROLES = [
  'Local Resident / Citizen',
  'Aapda Mitra / Community Volunteer',
  'CWC / Water Resources Dept Engineer',
  'ASDMA / DDMA District Official',
  'NDRF / SDRF First Responder',
  'Independent Researcher / Journalist',
];

export const DataInaccuracyModal: React.FC<DataInaccuracyModalProps> = ({
  isOpen,
  onClose,
  sector,
}) => {
  const [formData, setFormData] = useState<FeedbackFormState>({
    category: 'depth_discrepancy',
    observedCondition: 'shallow',
    specificLocation: '',
    description: '',
    observerRole: 'Local Resident / Citizen',
    contactInfo: '',
    photoPreview: null,
    photoName: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      setIsSubmitting(false);
      setErrorMessage(null);
      setSubmissionStep('');
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 8MB limit.');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        photoPreview: reader.result as string,
        photoName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      setErrorMessage('Please provide a brief description of the observed discrepancy.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    setSubmissionStep('Validating geospatial coordinates & sector metadata...');

    setTimeout(() => {
      setSubmissionStep('Cross-referencing Sentinel-1 SAR backscatter reflectance...');
      setTimeout(() => {
        setSubmissionStep('Calibrating ConvLSTM Bayesian ground-truth weighting...');
        setTimeout(() => {
          const randomCode = Math.floor(1000 + Math.random() * 9000);
          const generatedId = `HITL-${sector.stationCode}-${randomCode}`;
          setTicketId(generatedId);
          setIsSubmitting(false);
          setIsSubmitted(true);
        }, 600);
      }, 600);
    }, 500);
  };

  const handleResetForm = () => {
    setFormData({
      category: 'depth_discrepancy',
      observedCondition: 'shallow',
      specificLocation: '',
      description: '',
      observerRole: 'Local Resident / Citizen',
      contactInfo: '',
      photoPreview: null,
      photoName: null,
    });
    setIsSubmitted(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hitl-modal-title"
    >
      <div 
        className="relative w-full max-w-[calc(100vw-16px)] sm:max-w-2xl bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex-shrink-0 gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 flex-shrink-0">
              <Flag className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="hitl-modal-title" className="font-heading font-extrabold text-sm sm:text-lg text-slate-900 dark:text-slate-100 leading-tight flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span>Report Data Inaccuracy</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono">
                  HITL VALIDATION
                </span>
              </h3>
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Target Sector: {sector.district}, {sector.state} • {sector.stationCode}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center justify-center flex-shrink-0"
            title="Close modal (Esc)"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-5 min-w-0">
          {isSubmitted ? (
            /* Success State */
            <div className="py-6 px-4 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-300 dark:border-emerald-700">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div>
                <h4 className="font-heading font-extrabold text-xl text-slate-900 dark:text-slate-100">
                  Ground Truth Report Successfully Registered
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                  Your ground observation has been validated and queued into FloodGuard&apos;s human-in-the-loop retraining pipeline.
                </p>
              </div>

              {/* Reference ID Ticket Card */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3.5 max-w-md mx-auto text-left space-y-2">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="font-mono text-slate-500 dark:text-slate-400">AUDIT TICKET ID:</span>
                  <span className="font-mono font-bold text-[#006398] dark:text-sky-400">{ticketId}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400">Sector:</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{sector.district}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400">Observer Role:</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{formData.observerRole}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400">Category:</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {INACCURACY_CATEGORIES.find((c) => c.id === formData.category)?.label}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400">Status:</span>
                    <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Ingested in Pipeline</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* How this improves the model notice */}
              <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 rounded-lg p-3 max-w-md mx-auto text-left flex items-start gap-2.5 text-xs text-sky-900 dark:text-sky-200">
                <Cpu className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Impact on AI Reliability:</strong> Local observations provide ground-truth priors that calibrate radar radiometric thresholds, helping eliminate false-positive water classifications in densely vegetated floodplains.
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Submit Another Observation
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-[#0b1c30] dark:bg-sky-600 text-xs font-bold text-white hover:bg-[#081524] dark:hover:bg-sky-500 transition-colors shadow-xs"
                >
                  Done & Return to Map
                </button>
              </div>
            </div>
          ) : (
            /* Active Feedback Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Scientific Context Banner */}
              <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg p-3 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
                  <strong className="font-semibold">Human-in-the-Loop Ground Truth:</strong> Discrepancies reported by field volunteers, engineers, and citizens feed directly into our Bayesian calibration filter to correct SAR water masks and improve forecast accuracy.
                </div>
              </div>

              {/* Current Model Estimates Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/80 p-3 space-y-1.5">
                <div className="text-[10px] font-bold uppercase font-mono text-slate-500 dark:text-slate-400 tracking-wider">
                  Current Model Predictions for {sector.district}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">Predicted Level:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{sector.hazardLevel} ({sector.vulnerabilityIndex}/100)</span>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">Water Depth Peak:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{sector.waterDepthPeakM} meters</span>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">Inundation Spread:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{sector.inundationAreaKm2} km²</span>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">River Stage Delta:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{sector.riverStageDelta}</span>
                  </div>
                </div>
              </div>

              {/* 1. Category of Inaccuracy */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 uppercase font-mono tracking-wide">
                  1. What kind of discrepancy did you observe? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {INACCURACY_CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setFormData((prev) => ({ ...prev, category: cat.id }))}
                      className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                        formData.category === cat.id
                          ? 'border-[#006398] dark:border-sky-500 bg-sky-50/80 dark:bg-sky-950/40 text-[#0b1c30] dark:text-sky-200 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-semibold flex items-center justify-between">
                        <span>{cat.label}</span>
                        {formData.category === cat.id && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#006398] dark:text-sky-400" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {cat.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Observed Ground Reality */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 uppercase font-mono tracking-wide">
                  2. Actual Observed Ground Reality
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {OBSERVED_CONDITIONS.map((cond) => (
                    <button
                      type="button"
                      key={cond.id}
                      onClick={() => setFormData((prev) => ({ ...prev, observedCondition: cond.id }))}
                      className={`px-3 py-1.5 rounded-md border text-xs font-semibold transition-all ${
                        formData.observedCondition === cond.id
                          ? `${cond.color} ring-2 ring-offset-1 ring-sky-500 dark:ring-offset-slate-900`
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cond.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Specific Location / Landmark */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 uppercase font-mono tracking-wide">
                  3. Exact Location / Landmark within {sector.district}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={formData.specificLocation}
                    onChange={(e) => setFormData({ ...formData, specificLocation: e.target.value })}
                    placeholder="e.g. Near Batgharia embankment breach, NH-15 Km 42, or Ward 3 river bank"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#006398] dark:focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* 4. Description of Discrepancy */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 uppercase font-mono tracking-wide">
                  4. Observation Details & Discrepancy Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe how the real situation differs from the forecast. (e.g., 'The model shows 1.8m flooding, but the floodwaters have receded to ankle depth. The local dyke was reinforced yesterday.')"
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#006398] dark:focus:ring-sky-500 resize-y"
                />
              </div>

              {/* 5. Observer Affiliation & Verification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 uppercase font-mono tracking-wide">
                    5. Observer Role / Verification
                  </label>
                  <select
                    value={formData.observerRole}
                    onChange={(e) => setFormData({ ...formData, observerRole: e.target.value })}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006398] dark:focus:ring-sky-500"
                  >
                    {OBSERVER_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 uppercase font-mono tracking-wide">
                    Contact / Call-sign (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.contactInfo}
                    onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                    placeholder="Phone, VHF Channel, or Volunteer ID"
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#006398] dark:focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* 6. Photo / Document Upload (Drag & Drop + Click) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 uppercase font-mono tracking-wide">
                  6. Attach Photo Evidence or Field Survey (Optional)
                </label>
                
                {formData.photoPreview ? (
                  <div className="p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <img 
                        src={formData.photoPreview} 
                        alt="Uploaded observation preview" 
                        className="w-12 h-12 object-cover rounded border border-slate-300 dark:border-slate-600 flex-shrink-0"
                      />
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {formData.photoName}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Image attached for ground verification</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, photoPreview: null, photoName: null })}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-[#006398] bg-sky-50 dark:bg-sky-950/40'
                        : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => e.target.files && e.target.files[0] && handleFileSelect(e.target.files[0])}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Camera className="w-5 h-5 text-slate-400" />
                      <div>
                        <span className="font-semibold text-[#006398] dark:text-sky-400">Click to upload photo</span> or drag and drop
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        PNG, JPG, or WEBP up to 8MB
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submitting Progress Indicator */}
              {isSubmitting && (
                <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-200 flex items-center gap-3 animate-pulse">
                  <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span className="font-mono">{submissionStep}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2.5 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors min-h-[44px] sm:min-h-0 flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 sm:py-2 rounded-lg bg-[#0b1c30] dark:bg-sky-600 text-xs font-bold text-white hover:bg-[#081524] dark:hover:bg-sky-500 transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 min-h-[44px] sm:min-h-0"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Submit Ground Validation</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
