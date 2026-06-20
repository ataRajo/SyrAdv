import React, { useState, useCallback, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar,
  Sector,
} from "recharts";
import { useGetBoardReservationsStatsQuery } from "../../../RtkQuery/Slice/RoadSings/RoadSingsApi"; // adjust path
import { useGetCitiesQuery, useGetRegionsQuery } from "../../../RtkQuery/Slice/CitiesAndRegions/CitiesAndRegionsApi"; // adjust path
import { useGetWorkTypesQuery } from "../../../RtkQuery/Slice/WorkTypesApi/WorkTypesApi";

const COLORS = [
  "#6366f1","#f59e0b","#10b981","#ef4444","#3b82f6",
  "#ec4899","#8b5cf6","#14b8a6","#f97316","#06b6d4",
];

const MONTHS = [
  { v: 1, l: "Jan" }, { v: 2, l: "Feb" }, { v: 3, l: "Mar" },
  { v: 4, l: "Apr" }, { v: 5, l: "May" }, { v: 6, l: "Jun" },
  { v: 7, l: "Jul" }, { v: 8, l: "Aug" }, { v: 9, l: "Sep" },
  { v: 10, l: "Oct" }, { v: 11, l: "Nov" }, { v: 12, l: "Dec" },
];

const currentYear = new Date().getFullYear();

// ─── theme detection hook ─────────────────────────────────────────────────────
function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.getAttribute('data-theme') === 'dark' ||
           document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const darkMode = document.documentElement.getAttribute('data-theme') === 'dark' ||
                      document.documentElement.classList.contains('dark');
      setIsDark(darkMode);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

// ─── animated number ──────────────────────────────────────────────────────────
function AnimatedNumber({ value }) {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    let start = 0;
    const end = Number(value) || 0;
    if (start === end) return;
    const step = Math.ceil(end / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(start);
    }, 20);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display.toLocaleString()}</span>;
}

// ─── active pie shape ─────────────────────────────────────────────────────────
function ActivePieShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill={fill} fontSize={13} fontWeight={700}>
        {payload.roadsign_code}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill={fill} fontSize={11}>
        {value} reservations
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8}
              startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={innerRadius - 1}
              startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
}

// ─── custom bar label ─────────────────────────────────────────────────────────
function CustomBarLabel({ x, y, width, value }) {
  return (
    <text x={x + width / 2} y={y - 6} fill="var(--primary, #6366f1)"
          textAnchor="middle" fontSize={11} fontWeight={600}>{value}</text>
  );
}

// ─── custom tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
  const isDark = useTheme();
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: isDark ? '#1e293b' : '#ffffff',
      border: isDark ? '1px solid #334155' : '1px solid #e0e7ff',
      borderRadius: 10, padding: "10px 14px",
      boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 32px rgba(0,0,0,0.13)",
    }}>
      <p style={{ color: "#6366f1", fontWeight: 700, margin: 0 }}>{d.roadsign_code}</p>
      <p style={{ fontSize: 12, margin: "4px 0 0", opacity: .8, color: isDark ? '#f1f5f9' : '#111827' }} dir="auto">{d.board_name}</p>
      <p style={{ color: "#10b981", fontWeight: 600, margin: "4px 0 0" }}>
        {payload[0].value} reservations
      </p>
    </div>
  );
}

// ─── stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent }) {
  const isDark = useTheme();
  return (
    <div style={{
      background: isDark ? '#1e293b' : '#ffffff',
      border: `1px solid ${accent}33`,
      borderRadius: 14, padding: "18px 22px",
      boxShadow: isDark ? `0 4px 24px ${accent}08` : `0 4px 24px ${accent}18`,
      display: "flex", alignItems: "center", gap: 16,
      transition: "transform .2s, box-shadow .2s", cursor: "default",
    }}
      onMouseEnter={e => { 
        e.currentTarget.style.transform = "translateY(-3px)"; 
        e.currentTarget.style.boxShadow = isDark ? `0 10px 32px ${accent}15` : `0 10px 32px ${accent}33`; 
      }}
      onMouseLeave={e => { 
        e.currentTarget.style.transform = ""; 
        e.currentTarget.style.boxShadow = isDark ? `0 4px 24px ${accent}08` : `0 4px 24px ${accent}18`; 
      }}
    >
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color: accent, letterSpacing: -1 }}>
          <AnimatedNumber value={value} />
        </div>
        <div style={{ fontSize: 12, opacity: .65, marginTop: 2, fontWeight: 500, color: isDark ? '#f1f5f9' : '#111827' }}>{label}</div>
      </div>
    </div>
  );
}

// ─── filter label wrapper ─────────────────────────────────────────────────────
function FilterInput({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 120 }}>
      <span style={{
        fontSize: 11, fontWeight: 600, color: "#6366f1",
        textTransform: "uppercase", letterSpacing: 1,
      }}>{label}</span>
      {children}
    </label>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function RoadSignStatstics() {
  const isDark = useTheme();
  
  // ── filters state ──────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    year: currentYear,
    city_id: "",
    region_id: "",
    from_month: "",
    to_month: "",
    to_year: "",
    month: "",
    work_type_id :""
  });
  const [topN, setTopN]           = useState(5);
  const [activeFilters, setActiveFilters] = useState({ year: currentYear });
  const [activePieIdx, setActivePieIdx]   = useState(0);
const { data: workTypes = [], isLoading: isWorkTypesLoading } = useGetWorkTypesQuery();



  // ── cities and regions data ──────────────────────────────────────────────────
  const { data: cities = [], isLoading: isCitiesLoading } = useGetCitiesQuery();
  
  // Fetch ALL regions (or you can filter them client-side)
  const { data: allRegions = [], isLoading: isRegionsLoading } = useGetRegionsQuery();
  
  // Filter regions based on selected city_id
  const filteredRegions = filters.city_id 
    ? allRegions.filter(region => region.city_id === parseInt(filters.city_id))
    : [];

  // ── stats data ─────────────────────────────────────────────────────────────
  const { data, isLoading, isFetching, isError, refetch } =
    useGetBoardReservationsStatsQuery(activeFilters);

  const allBoards = data?.boards ?? [];

  // topN is sliced from top_boards (which the API already returns sorted desc)
  const topBoards = (data?.top_boards ?? []).slice(0, topN);
  const pieData   = topBoards.map(b => ({ ...b, value: b.total_reservations }));

  // ── apply ──────────────────────────────────────────────────────────────────
  const handleApply = useCallback(() => {
    const f = { year: filters.year };
    if (filters.city_id)    f.city_id    = filters.city_id;
    if (filters.region_id)  f.region_id  = filters.region_id;
    if (filters.month)      f.month      = filters.month;
    if (filters.from_month) f.from_month = filters.from_month;
    if (filters.to_month)   f.to_month   = filters.to_month;
    if (filters.to_year)    f.to_year    = filters.to_year;
    if (filters.work_type_id) f.work_type_id = filters.work_type_id

    //console.log("sending the filter data" ,f)
    setActiveFilters(f);
  }, [filters]);

  const set = (key) => (e) => {
    const value = e.target.value;
    setFilters(p => ({ ...p, [key]: value }));
    
    // Reset region when city changes
    if (key === 'city_id') {
      setFilters(p => ({ ...p, region_id: "" }));
    }
  };

  // Dynamic styles based on theme
  const containerStyle = {
    padding: "28px 24px", 
    fontFamily: "'DM Sans','Segoe UI',sans-serif",
    minHeight: "100vh",
    background: isDark ? '#0f172a' : '#f9fafb',
    color: isDark ? '#f1f5f9' : '#111827',
    transition: "background 0.3s ease, color 0.3s ease"
  };

  const cardStyle = {
    background: isDark ? '#1e293b' : '#ffffff',
    borderRadius: 16, 
    boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.3)' : '0 2px 16px rgba(99,102,241,.06)',
    border: isDark ? '1px solid #334155' : '1px solid #e0e7ff',
  };

  const inputStyle = {
    background: isDark ? '#1e293b' : '#f5f3ff',
    color: isDark ? '#f1f5f9' : '#111827',
    border: isDark ? '1px solid #334155' : '1px solid #c7d2fe',
    borderRadius: 8, padding: "7px 11px",
    fontSize: 13, outline: "none", width: "100%",
    transition: "border .2s",
  };

  const tableHeadStyle = {
    background: isDark ? '#1e293b' : '#f5f3ff',
    borderBottom: isDark ? '1px solid #334155' : '1px solid #e0e7ff'
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div style={containerStyle}>
      {/* ── header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: -0.5,
          background: "linear-gradient(90deg,#6366f1,#a78bfa)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          🛣 Board Reservations Statistics
        </h1>
        {data && (
          <p style={{ margin: "4px 0 0", fontSize: 12, opacity: .55, color: isDark ? '#94a3b8' : '#6b7280' }}>
            {data.from_date} → {data.to_date}
            {data.city_id ? `  ·  City ID: ${data.city_id}` : ""}
            {data.region_id ? `  ·  Region ID: ${data.region_id}` : ""}
          </p>
        )}
      </div>

      {/* ── filter bar ── */}
      <div style={{ ...cardStyle, padding: "20px 22px", marginBottom: 26 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end" }}>

          {/* Year */}
          <FilterInput label="Year *">
            <input type="number" min={2000} max={2100} value={filters.year}
                   onChange={set("year")} style={inputStyle} />
          </FilterInput>

          {/* City — select from API */}
          <FilterInput label="City">
            <select value={filters.city_id} onChange={set("city_id")} style={inputStyle}
                    disabled={isCitiesLoading}>
              <option value="">— All Cities —</option>
              {cities.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FilterInput>

          {/* Region — dynamically populated based on selected city */}
          <FilterInput label="Region">
            <select 
              value={filters.region_id} 
              onChange={set("region_id")} 
              style={inputStyle}
              disabled={!filters.city_id || isRegionsLoading || filteredRegions.length === 0}
            >
              <option value="">— All Regions —</option>
              {filteredRegions.map(region => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </select>
            {!filters.city_id && (
              <small style={{ fontSize: 10, color: '#ef4444', marginTop: 2 }}>
                Select a city first
              </small>
            )}
            {filters.city_id && filteredRegions.length === 0 && !isRegionsLoading && (
              <small style={{ fontSize: 10, color: '#f59e0b', marginTop: 2 }}>
                No regions found for this city
              </small>
            )}
          </FilterInput>



<FilterInput label="Work Type">
  <select 
    value={filters.work_type_id} 
    onChange={set("work_type_id")} 
    style={inputStyle}
    disabled={isWorkTypesLoading}
  >
    <option value="">— All Work Types —</option>
    {(workTypes?.data || workTypes || []).map(wt => (
      <option key={wt.id} value={wt.id}>{wt.type || wt.name || `Work Type ${wt.id}`}</option>
    ))}
  </select>
</FilterInput>

          {/* Month */}
          <FilterInput label="Month">
            <select value={filters.month} onChange={set("month")} style={inputStyle}>
              <option value="">All</option>
              {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </FilterInput>

          {/* From Month */}
          <FilterInput label="From Month">
            <select value={filters.from_month} onChange={set("from_month")} style={inputStyle}>
              <option value="">—</option>
              {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </FilterInput>

          {/* To Month */}
          <FilterInput label="To Month">
            <select value={filters.to_month} onChange={set("to_month")} style={inputStyle}>
              <option value="">—</option>
              {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </FilterInput>

          {/* To Year */}
          <FilterInput label="To Year">
            <input type="number" min={2000} max={2100} placeholder="optional"
                   value={filters.to_year} onChange={set("to_year")} style={inputStyle} />
          </FilterInput>

          {/* Top N — user controlled */}
          <FilterInput label="Top N Boards">
            <input
              type="number" min={1} max={allBoards.length || 50}
              value={topN}
              onChange={e => setTopN(Math.max(1, parseInt(e.target.value) || 1))}
              style={{ ...inputStyle, width: 80 }}
            />
          </FilterInput>

          {/* Buttons */}
          <button onClick={handleApply} disabled={isFetching} style={{
            background: "linear-gradient(135deg,#6366f1,#a78bfa)",
            color: "#fff", border: "none", borderRadius: 10,
            padding: "9px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer",
            boxShadow: "0 4px 18px #6366f140", transition: "transform .15s, opacity .15s",
            opacity: isFetching ? .7 : 1,
          }}
            onMouseEnter={e => { if (!isFetching) e.currentTarget.style.transform = "scale(1.04)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
          >
            {isFetching ? "⟳ Loading…" : "Apply"}
          </button>

          <button onClick={refetch} style={{
            background: "transparent",
            color: "#6366f1",
            border: isDark ? "1.5px solid #334155" : "1.5px solid #c7d2fe",
            borderRadius: 10, padding: "9px 16px",
            fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all .2s",
          }}>
            ⟳ Refresh
          </button>
        </div>
      </div>

      {/* ── loading spinner ── */}
      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              border: isDark ? "4px solid #334155" : "4px solid #e0e7ff",
              borderTop: "4px solid #6366f1",
              animation: "rspin .8s linear infinite",
            }} />
            <p style={{ fontSize: 14, opacity: .5, color: isDark ? '#f1f5f9' : '#111827' }}>Loading statistics…</p>
            <style>{`@keyframes rspin{to{transform:rotate(360deg)}}`}</style>
          </div>
        </div>
      )}

      {/* ── error ── */}
      {isError && !isLoading && (
        <div style={{
          background: isDark ? '#451a1a' : '#fef2f2',
          border: "1px solid #ef4444", borderRadius: 14,
          padding: 24, textAlign: "center", color: "#ef4444",
        }}>
          <div style={{ fontSize: 36 }}>⚠️</div>
          <p style={{ fontWeight: 600 }}>Failed to load data. Check filters or network.</p>
          <button onClick={refetch} style={{
            background: "#ef4444", color: "#fff", border: "none",
            borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontWeight: 600,
          }}>Retry</button>
        </div>
      )}

      {/* ── content ── */}
      {data && !isLoading && (
        <>
          {/* stat cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 16, marginBottom: 26,
          }}>
            <StatCard label="Total Boards"           value={data.total_boards}                  icon="🪧" accent="#6366f1" />
            <StatCard label="Total Reservations"     value={data.total_reservations_all_boards} icon="📋" accent="#10b981" />
            <StatCard label={`Showing Top ${topN}`}  value={topBoards.length}                   icon="🏆" accent="#f59e0b" />
          </div>

          {/* ── bar chart: all boards ── */}
          <div style={{ ...cardStyle, padding: "22px 16px", marginBottom: 26 }}>
            <h2 style={{ margin: "0 0 18px 6px", fontSize: 16, fontWeight: 700, color: isDark ? '#f1f5f9' : '#111827' }}>
              All Boards — Reservations
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={allBoards} margin={{ top: 20, right: 20, bottom: 60, left: 0 }}
                        barCategoryGap="30%">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e0e7ff'} vertical={false} />
            {/*
            
  <XAxis 
                  dataKey="roadsign_code" 
                  tick={{ fontSize: 11, fill: isDark ? '#f1f5f9' : '#111827' }}
                  angle={-40} 
                  textAnchor="end" 
                  interval={0} 
                  height={80}
                />

            
            */ }
              
                <YAxis tick={{ fontSize: 11, fill: isDark ? '#f1f5f9' : '#111827' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />}
                         cursor={{ fill: isDark ? "rgba(99,102,241,.1)" : "rgba(99,102,241,.06)" }} />
                <Bar dataKey="total_reservations" fill="url(#barGrad)" radius={[6,6,0,0]}
                     animationDuration={900} animationEasing="ease-out"
                     label={<CustomBarLabel />} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── pie + radial (Top N) ── */}
          {topBoards.length > 0 && (
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: 20, marginBottom: 26,
            }}>
              {/* donut pie */}
              <div style={{ ...cardStyle, padding: "22px 16px" }}>
                <h2 style={{ margin: "0 0 10px 6px", fontSize: 16, fontWeight: 700, color: isDark ? '#f1f5f9' : '#111827' }}>
                  🏆 Top {topBoards.length} — Donut
                </h2>
                <ResponsiveContainer width="100%" height={270}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%"
                         innerRadius={64} outerRadius={95}
                         dataKey="value" nameKey="roadsign_code"
                         activeIndex={activePieIdx}
                         activeShape={<ActivePieShape />}
                         onMouseEnter={(_, idx) => setActivePieIdx(idx)}
                         animationBegin={200} animationDuration={900} paddingAngle={4}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Legend formatter={v => <span style={{ fontSize: 12, color: isDark ? '#f1f5f9' : '#111827' }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* radial bar */}
              <div style={{ ...cardStyle, padding: "22px 16px" }}>
                <h2 style={{ margin: "0 0 10px 6px", fontSize: 16, fontWeight: 700, color: isDark ? '#f1f5f9' : '#111827' }}>
                  📊 Top {topBoards.length} — Radial
                </h2>
                <ResponsiveContainer width="100%" height={270}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius={30} outerRadius={120}
                                  startAngle={180} endAngle={-180}
                                  data={topBoards.map((b, i) => ({
                                    name: b.roadsign_code,
                                    value: b.total_reservations,
                                    fill: COLORS[i % COLORS.length],
                                  }))}>
                    <RadialBar minAngle={15} background clockWise
                               dataKey="value" animationBegin={300} animationDuration={1000} />
                    <Legend iconSize={10} formatter={v => <span style={{ fontSize: 12, color: isDark ? '#f1f5f9' : '#111827' }}>{v}</span>} />
                    <Tooltip
                      formatter={(val, name) => [`${val} reservations`, name]}
                      contentStyle={{
                        background: isDark ? '#1e293b' : '#ffffff',
                        border: isDark ? '1px solid #334155' : '1px solid #e0e7ff',
                        borderRadius: 8, fontSize: 12,
                        color: isDark ? '#f1f5f9' : '#111827',
                      }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── detail table ── */}
          <div style={{ ...cardStyle, overflow: "hidden" }}>
            <div style={{
              padding: "18px 22px 14px",
              borderBottom: isDark ? '1px solid #334155' : '1px solid #e0e7ff',
            }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: isDark ? '#f1f5f9' : '#111827' }}>All Boards Detail</h2>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={tableHeadStyle}>
                    {["#", "Code", "Board Name", "Reservations"].map(h => (
                      <th key={h} style={{
                        padding: "11px 16px", textAlign: "left",
                        color: "#6366f1", fontWeight: 700,
                        fontSize: 11, textTransform: "uppercase", letterSpacing: 1,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allBoards.map((b, i) => (
                    <tr key={b.board_id}
                        style={{ transition: "background .15s", cursor: "default" }}
                        onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(99,102,241,.15)" : "rgba(99,102,241,.06)"}
                        onMouseLeave={e => e.currentTarget.style.background = ""}>
                      <td style={{ padding: "10px 16px", opacity: .45, color: isDark ? '#f1f5f9' : '#111827' }}>{i + 1}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{
                          background: isDark ? "rgba(99,102,241,.2)" : "rgba(99,102,241,.1)", 
                          color: isDark ? '#a78bfa' : '#4f46e5',
                          padding: "3px 9px", borderRadius: 20,
                          fontSize: 11, fontWeight: 700,
                        }}>
                          {b.roadsign_code}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px", color: isDark ? '#f1f5f9' : '#111827' }} dir="auto">{b.board_name}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            height: 6, borderRadius: 4,
                            width: `${Math.round(
                              (b.total_reservations / (data.total_reservations_all_boards || 1)) * 120
                            )}px`,
                            background: `linear-gradient(90deg,${COLORS[i % COLORS.length]},${COLORS[(i+1)%COLORS.length]})`,
                            minWidth: 6, transition: "width .5s ease",
                          }} />
                          <strong style={{ color: COLORS[i % COLORS.length] }}>
                            {b.total_reservations}
                          </strong>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}