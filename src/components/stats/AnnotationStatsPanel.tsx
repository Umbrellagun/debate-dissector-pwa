import React, { useState } from 'react';
import { AnnotationStats, AnnotationCount, SpeakerStat, SpeakerAnnotationDetail } from '../../utils/annotationStats';
import { trackAnalyticsEvent } from '../../hooks/useAnalytics';

interface AnnotationStatsPanelProps {
  stats: AnnotationStats;
  documentTitle: string;
  onClose?: () => void;
  onAnnotationClick?: (id: string, type: 'fallacy' | 'rhetoric' | 'structural') => void;
}

// --- SVG Pie Chart ---

interface PieSlice {
  label: string;
  value: number;
  color: string;
}

const PieChart: React.FC<{ slices: PieSlice[]; size?: number }> = ({ slices, size = 160 }) => {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="70" fill="none" stroke="#E5E7EB" strokeWidth="20" />
        <text x="80" y="84" textAnchor="middle" className="text-sm" fill="#9CA3AF" fontSize="14">
          No data
        </text>
      </svg>
    );
  }

  const radius = 60;
  const cx = 80;
  const cy = 80;
  let cumulative = 0;

  const paths = slices
    .filter(s => s.value > 0)
    .map((slice) => {
      const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
      cumulative += slice.value;
      const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;

      const largeArc = slice.value / total > 0.5 ? 1 : 0;

      const x1 = cx + radius * Math.cos(startAngle);
      const y1 = cy + radius * Math.sin(startAngle);
      const x2 = cx + radius * Math.cos(endAngle);
      const y2 = cy + radius * Math.sin(endAngle);

      // If this is the only slice (100%), draw a full circle
      if (slice.value === total) {
        return (
          <circle key={slice.label} cx={cx} cy={cy} r={radius} fill={slice.color} />
        );
      }

      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      return <path key={slice.label} d={d} fill={slice.color} />;
    });

  return (
    <svg width={size} height={size} viewBox="0 0 160 160">
      {paths}
      {/* Center hole for donut effect */}
      <circle cx={cx} cy={cy} r="35" fill="white" />
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="10" fill="#9CA3AF">
        Total
      </text>
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize="10" fill="#9CA3AF">
        Coverage
      </text>
    </svg>
  );
};

// --- Horizontal bar ---

const Bar: React.FC<{ 
  label: string; 
  value: number; 
  max: number; 
  color: string; 
  suffix?: string;
}> = ({ label, value, max, color, suffix = '' }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 w-28 truncate" title={label}>{label}</span>
      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700 w-12 text-right">{value}{suffix}</span>
    </div>
  );
};

// --- Coverage ring ---

const CoverageRing: React.FC<{ percent: number; label: string; color: string }> = ({ percent, label, color }) => {
  const circumference = 2 * Math.PI * 20;
  const dashOffset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r="20" fill="none" stroke="#E5E7EB" strokeWidth="5" />
        <circle
          cx="26" cy="26" r="20"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 26 26)"
          className="transition-all duration-500"
        />
        <text x="26" y="30" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#374151">
          {percent}%
        </text>
      </svg>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
};

// --- Main Panel ---

export const AnnotationStatsPanel: React.FC<AnnotationStatsPanelProps> = ({
  stats,
  documentTitle,
  onClose,
  onAnnotationClick,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown'>('overview');

  const handleTabSwitch = (tab: 'overview' | 'breakdown') => {
    setActiveTab(tab);
    trackAnalyticsEvent('stats_tab_switched', { tab });
  };

  // Build pie slices
  const pieSlices: PieSlice[] = [];
  if (stats.fallacyCoverage > 0) {
    pieSlices.push({ label: 'Fallacies', value: stats.fallacyCoverage, color: '#EF4444' });
  }
  if (stats.rhetoricCoverage > 0) {
    pieSlices.push({ label: 'Rhetoric', value: stats.rhetoricCoverage, color: '#3B82F6' });
  }
  if (stats.structuralCoverage > 0) {
    pieSlices.push({ label: 'Claims & Evidence', value: stats.structuralCoverage, color: '#8B5CF6' });
  }
  const unannotatedPct = 100 - stats.coveragePercent;
  if (unannotatedPct > 0) {
    pieSlices.push({ label: 'Unannotated', value: unannotatedPct, color: '#E5E7EB' });
  }

  const maxCharCount = stats.breakdown.length > 0
    ? Math.max(...stats.breakdown.map(b => b.charCount))
    : 0;

  const fallacyBreakdown = stats.breakdown.filter(b => b.type === 'fallacy');
  const rhetoricBreakdown = stats.breakdown.filter(b => b.type === 'rhetoric');
  const structuralBreakdown = stats.breakdown.filter(b => b.type === 'structural');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-14 px-4 border-b border-gray-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h2v8H3zm6-4h2v12H9zm6-6h2v18h-2zm6 10h2v8h-2z" />
          </svg>
          <h2 className="font-semibold text-gray-900">Statistics</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close statistics"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 px-4 shrink-0">
        <button
          onClick={() => handleTabSwitch('overview')}
          className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => handleTabSwitch('breakdown')}
          className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'breakdown'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Breakdown
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {stats.totalCharacters === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-gray-500">No content to analyze.</p>
            <p className="text-xs text-gray-400 mt-1">Start writing or paste debate text.</p>
          </div>
        ) : activeTab === 'overview' ? (
          <>
            {/* Pie chart */}
            <div className="flex flex-col items-center">
              <PieChart slices={pieSlices} />
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
                {pieSlices.filter(s => s.label !== 'Unannotated').map(s => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-xs text-gray-600">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary numbers */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-gray-900">{stats.totalAnnotations}</div>
                <div className="text-xs text-gray-500">Annotations</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-gray-900">{stats.coveragePercent}%</div>
                <div className="text-xs text-gray-500">Coverage</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-gray-900">{stats.totalCharacters.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Characters</div>
              </div>
            </div>

            {/* Coverage by type rings */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Coverage by Type</h3>
              <div className="flex justify-around">
                <CoverageRing percent={stats.fallacyCoverage} label="Fallacies" color="#EF4444" />
                <CoverageRing percent={stats.rhetoricCoverage} label="Rhetoric" color="#3B82F6" />
                <CoverageRing percent={stats.structuralCoverage} label="Claims" color="#8B5CF6" />
              </div>
            </div>

            {/* Instance counts */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Instance Counts</h3>
              <div className="space-y-2">
                <Bar label="Fallacies" value={stats.fallacyCount} max={stats.totalAnnotations} color="#EF4444" />
                <Bar label="Rhetoric" value={stats.rhetoricCount} max={stats.totalAnnotations} color="#3B82F6" />
                <Bar label="Claims & Evidence" value={stats.structuralCount} max={stats.totalAnnotations} color="#8B5CF6" />
              </div>
            </div>

            {/* Speaker stats */}
            {stats.speakerStats.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">By Speaker</h3>
                <div className="space-y-3">
                  {stats.speakerStats.map(speaker => (
                    <SpeakerStatRow key={speaker.id} speaker={speaker} totalChars={stats.totalCharacters} />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Overall document breakdown */}
            {stats.breakdown.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                  Overall Document
                </h3>

                {fallacyBreakdown.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">
                      Fallacies ({fallacyBreakdown.length})
                    </h4>
                    <div className="space-y-1.5">
                      {fallacyBreakdown.map(item => (
                        <BreakdownRow key={item.id} item={item} maxCharCount={maxCharCount} totalChars={stats.totalCharacters} onClick={onAnnotationClick} />
                      ))}
                    </div>
                  </div>
                )}

                {rhetoricBreakdown.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
                      Rhetoric ({rhetoricBreakdown.length})
                    </h4>
                    <div className="space-y-1.5">
                      {rhetoricBreakdown.map(item => (
                        <BreakdownRow key={item.id} item={item} maxCharCount={maxCharCount} totalChars={stats.totalCharacters} onClick={onAnnotationClick} />
                      ))}
                    </div>
                  </div>
                )}

                {structuralBreakdown.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">
                      Claims & Evidence ({structuralBreakdown.length})
                    </h4>
                    <div className="space-y-1.5">
                      {structuralBreakdown.map(item => (
                        <BreakdownRow key={item.id} item={item} maxCharCount={maxCharCount} totalChars={stats.totalCharacters} onClick={onAnnotationClick} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Per-speaker breakdown */}
            {stats.speakerStats.length > 0 && stats.speakerStats.some(s => s.annotationBreakdown.length > 0) && (
              <div className="border-t-2 border-gray-300 pt-4">
                <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-3">
                  By Speaker
                </h3>
                <div className="space-y-3">
                  {stats.speakerStats.filter(s => s.annotationBreakdown.length > 0).map(speaker => (
                    <SpeakerBreakdownCard
                      key={speaker.id}
                      speaker={speaker}
                      onAnnotationClick={onAnnotationClick}
                    />
                  ))}
                </div>
              </div>
            )}

            {stats.breakdown.length === 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">No annotations yet.</p>
                <p className="text-xs text-gray-400 mt-1">Select text and apply annotations to see breakdown.</p>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};

// --- Speaker stat row ---

const SpeakerStatRow: React.FC<{ speaker: SpeakerStat; totalChars: number }> = ({ speaker, totalChars }) => {
  const pct = totalChars > 0 ? Math.round((speaker.charCount / totalChars) * 100) : 0;

  // Build stacked bar: colored segments fill only the coverage portion, rest is gray
  const coverage = speaker.coveragePercent;
  const totalCount = speaker.annotationBreakdown.reduce((s, a) => s + a.count, 0);
  const segments = totalCount > 0
    ? speaker.annotationBreakdown.map(a => ({
        color: a.color,
        // Each segment's width is its share of the covered portion
        pct: (a.count / totalCount) * coverage,
        name: a.name,
      }))
    : [];

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: speaker.color }} />
        <span className="text-sm font-medium text-gray-800">{speaker.name}</span>
        <span className="text-xs text-gray-400 ml-auto">{pct}% of text</span>
      </div>
      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2 flex">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="h-full transition-all duration-500"
            style={{
              width: `${seg.pct}%`,
              backgroundColor: seg.color,
              borderTopLeftRadius: i === 0 ? '9999px' : 0,
              borderBottomLeftRadius: i === 0 ? '9999px' : 0,
            }}
            title={`${seg.name}: ${Math.round(seg.pct)}%`}
          />
        ))}
      </div>
      <div className="flex gap-4 text-xs text-gray-500">
        <span>{speaker.charCount.toLocaleString()} chars</span>
        <span>{speaker.coveragePercent}% annotated</span>
        <span>{speaker.paragraphCount} paragraph{speaker.paragraphCount !== 1 ? 's' : ''}</span>
        <span>{speaker.annotationCount} annotation{speaker.annotationCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
};

// --- Speaker breakdown card (for Breakdown tab) ---

const SpeakerBreakdownCard: React.FC<{
  speaker: SpeakerStat;
  onAnnotationClick?: (id: string, type: 'fallacy' | 'rhetoric' | 'structural') => void;
}> = ({ speaker, onAnnotationClick }) => {
  const fallacies = speaker.annotationBreakdown.filter(a => a.type === 'fallacy');
  const rhetoric = speaker.annotationBreakdown.filter(a => a.type === 'rhetoric');
  const structural = speaker.annotationBreakdown.filter(a => a.type === 'structural');
  const maxCount = speaker.annotationBreakdown.length > 0
    ? Math.max(...speaker.annotationBreakdown.map(a => a.count))
    : 0;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: speaker.color }} />
        <span className="text-xs font-semibold text-gray-700">{speaker.name}</span>
        <span className="text-xs text-gray-400 ml-auto">{speaker.annotationBreakdown.reduce((s, a) => s + a.count, 0)} total</span>
      </div>
      <div className="px-3 py-2 space-y-2">
        {fallacies.length > 0 && (
          <div>
            <span className="text-[10px] font-medium text-red-500 uppercase">Fallacies</span>
            <div className="space-y-1 mt-0.5">
              {fallacies.map(a => (
                <SpeakerAnnotationRow key={a.id} item={a} maxCount={maxCount} onClick={onAnnotationClick} />
              ))}
            </div>
          </div>
        )}
        {rhetoric.length > 0 && (
          <div>
            <span className="text-[10px] font-medium text-blue-500 uppercase">Rhetoric</span>
            <div className="space-y-1 mt-0.5">
              {rhetoric.map(a => (
                <SpeakerAnnotationRow key={a.id} item={a} maxCount={maxCount} onClick={onAnnotationClick} />
              ))}
            </div>
          </div>
        )}
        {structural.length > 0 && (
          <div>
            <span className="text-[10px] font-medium text-purple-500 uppercase">Claims & Evidence</span>
            <div className="space-y-1 mt-0.5">
              {structural.map(a => (
                <SpeakerAnnotationRow key={a.id} item={a} maxCount={maxCount} onClick={onAnnotationClick} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SpeakerAnnotationRow: React.FC<{
  item: SpeakerAnnotationDetail;
  maxCount: number;
  onClick?: (id: string, type: 'fallacy' | 'rhetoric' | 'structural') => void;
}> = ({ item, maxCount, onClick }) => {
  const barPct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
  const isClickable = !!onClick;

  return (
    <button
      type="button"
      onClick={() => onClick?.(item.id, item.type)}
      className={`w-full flex items-center gap-1.5 rounded px-1 py-0.5 transition-colors ${
        isClickable ? 'hover:bg-gray-100 cursor-pointer' : ''
      }`}
      title={isClickable ? `View ${item.name} in annotation panel` : item.name}
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
      <span className="text-[11px] text-gray-600 w-20 truncate text-left" title={item.name}>{item.name}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.max(barPct, 4)}%`, backgroundColor: item.color }}
        />
      </div>
      <span className="text-[11px] font-medium text-gray-500 w-6 text-right shrink-0">{item.count}x</span>
      {isClickable && (
        <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
};

// --- Breakdown row ---

const BreakdownRow: React.FC<{
  item: AnnotationCount;
  maxCharCount: number;
  totalChars: number;
  onClick?: (id: string, type: 'fallacy' | 'rhetoric' | 'structural') => void;
}> = ({ item, maxCharCount, totalChars, onClick }) => {
  const pct = totalChars > 0 ? Math.round((item.charCount / totalChars) * 100) : 0;
  const barPct = maxCharCount > 0 ? (item.charCount / maxCharCount) * 100 : 0;
  const isClickable = !!onClick;

  return (
    <button
      type="button"
      onClick={() => onClick?.(item.id, item.type)}
      className={`w-full flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors ${
        isClickable ? 'hover:bg-gray-50 cursor-pointer' : ''
      }`}
      title={isClickable ? `View ${item.name} in annotation panel` : item.name}
    >
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
      <span className="text-xs text-gray-700 w-24 truncate text-left" title={item.name}>{item.name}</span>
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.max(barPct, 2)}%`, backgroundColor: item.color }}
        />
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-xs font-medium text-gray-600">{item.count}x</span>
        <span className="text-xs text-gray-400">{pct}%</span>
      </div>
      {isClickable && (
        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
};
