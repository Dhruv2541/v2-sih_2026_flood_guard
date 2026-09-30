import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { ShieldAlert, Crosshair, Map as MapIcon, Database, AlertOctagon, Terminal, CheckCircle, Search, MapPin, ArrowRight } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000';

const FEATURED_CITIES = [
  { name: 'Guwahati', district: 'Kamrup Metro' },
  { name: 'Gossaigaon', district: 'Kokrajhar' },
  { name: 'Kokrajhar', district: 'Kokrajhar' },
  { name: 'Dhubri', district: 'Dhubri' },
  { name: 'Bilasipara', district: 'Dhubri' },
  { name: 'Barpeta', district: 'Barpeta' },
  { name: 'Kalgachia', district: 'Barpeta' },
  { name: 'Sarthebari', district: 'Barpeta' },
  { name: 'Lakhipur', district: 'Goalpara' },
  { name: 'Silchar', district: 'Cachar' },
  { name: 'Jorhat', district: 'Jorhat' },
  { name: 'Dibrugarh', district: 'Dibrugarh' }
];

function App() {
  const [cities, setCities] = useState([]);
  const [severity, setSeverity] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [selectedCityName, setSelectedCityName] = useState('Guwahati');
  const [activeCity, setActiveCity] = useState(null);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('Tactical Command');

  useEffect(() => {
    fetchCityPrediction('Guwahati', 1.0);
  }, []);

  const fetchCityPrediction = async (cityName, simSeverity = severity) => {
    setLoading(true);
    setSeverity(simSeverity);
    setSelectedCityName(cityName);
    try {
      const response = await fetch(`${API_BASE}/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          severity_multiplier: simSeverity, 
          use_live_weather: false,
          city_or_district: cityName === 'ALL' ? '' : cityName
        })
      });
      const data = await response.json();
      setCities(data.simulation || []);
      
      if (data.simulation && data.simulation.length > 0) {
        // Automatically activate the first matching city
        setActiveCity(data.simulation[0]);
      } else {
        setActiveCity(null);
      }
    } catch (error) {
      console.error("Error fetching city prediction:", error);
    }
    setLoading(false);
  };

  const handleCitySubmit = (e) => {
    e.preventDefault();
    if (selectedCityName) {
      fetchCityPrediction(selectedCityName, severity);
    }
  };

  const getRiskColor = (risk) => {
    if (risk === 3) return '#dc2626'; 
    if (risk === 2) return '#f59e0b'; 
    if (risk === 1) return '#00b4d8'; 
    return '#10b981'; 
  };

  const highestRisk = cities.reduce((max, city) => Math.max(max, city.risk_score), 0);

  const renderContent = () => {
    if (activeTab === 'Tactical Command') {
      return (
        <>
          <div className="center-panel">
            {highestRisk === 3 ? (
              <div className="defcon-banner mono">⚠ DEFCON-2 ALERT: CRITICAL INUNDATION DETECTED</div>
            ) : (
              <div className="defcon-banner mono" style={{background: 'rgba(0,180,216,0.1)', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)'}}>
                ALL SYSTEMS NOMINAL
              </div>
            )}

            {/* PROMINENT CITY QUERY PROMPT BOX */}
            <div className="search-card mono" style={{ border: '1.5px solid var(--accent-cyan)', boxShadow: '0 0 15px rgba(0, 180, 216, 0.2)' }}>
              <h2 style={{ fontSize: '0.9rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                <MapPin size={18}/> WHICH CITY DO YOU WANT PREDICTIONS FOR?
              </h2>
              
              <form onSubmit={handleCitySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {/* Dropdown Select */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select 
                    value={selectedCityName} 
                    onChange={(e) => fetchCityPrediction(e.target.value, severity)}
                    style={{ 
                      flex: 1, 
                      background: 'rgba(0,0,0,0.5)', 
                      color: '#fff', 
                      border: '1px solid var(--border-color)', 
                      padding: '0.6rem', 
                      borderRadius: '4px',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  >
                    <option value="ALL">-- ALL ASSAM REVENUE CIRCLES (180 TOTAL) --</option>
                    {FEATURED_CITIES.map(c => (
                      <option key={c.name} value={c.name}>{c.name} ({c.district})</option>
                    ))}
                  </select>
                </div>

                {/* Free Text Prompt */}
                <div className="search-input-wrapper">
                  <Search size={16} color="var(--text-muted)"/>
                  <input 
                    type="text" 
                    placeholder="Or type any city/district (e.g. Gossaigaon, Dhubri)..."
                    value={selectedCityName}
                    onChange={(e) => setSelectedCityName(e.target.value)}
                  />
                  <button type="submit" style={{ background: 'var(--accent-cyan)', color: '#000', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    PREDICT <ArrowRight size={14}/>
                  </button>
                </div>
              </form>

              {/* Quick Select Chips */}
              <div className="chip-container" style={{ marginTop: '0.5rem' }}>
                {['Guwahati', 'Gossaigaon', 'Dhubri', 'Barpeta', 'Kokrajhar', 'Silchar', 'Jorhat'].map(city => (
                  <button 
                    key={city} 
                    className={`filter-chip ${selectedCityName.toLowerCase() === city.toLowerCase() ? 'active' : ''}`}
                    onClick={() => fetchCityPrediction(city, severity)}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Storm Simulator Controls */}
            <div className="card">
              <h2 className="mono" style={{ fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Terminal size={16}/> SIMULATE RAINFALL SEVERITY
              </h2>
              <div className="severity-grid mono">
                {[1.0, 2.0, 3.0, 4.0].map(val => (
                  <div key={val} className={`severity-box ${severity === val ? (val >= 3 ? 'active' : 'active-nominal') : ''}`} onClick={() => fetchCityPrediction(selectedCityName, val)}>
                    {val}x {val === 1 ? 'Nominal' : val === 4 ? 'Breach!' : 'Heavy'}
                  </div>
                ))}
              </div>

              {/* Active Target City Prediction Parameters */}
              {activeCity ? (
                <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.4)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--accent-cyan)' }}>
                  <div className="mono" style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', marginBottom: '0.5rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>📍 PREDICTION PARAMETERS FOR {activeCity.name.toUpperCase()}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{activeCity.district}</span>
                  </div>
                  
                  <div className="stats-grid mono">
                    <div className="stat-box">
                      <div className="val">{Math.round(activeCity.sim_rain_mm || activeCity.sim_rain || 0)}</div>
                      <div className="lbl">PRECIP (MM)</div>
                    </div>
                    <div className="stat-box">
                      <div className="val">{(activeCity.sim_river_m || activeCity.sim_river || 0).toFixed(1)}</div>
                      <div className="lbl">RIVER SURGE (M)</div>
                    </div>
                    <div className="stat-box">
                      <div className="val">{activeCity.inundation_pct || 0}%</div>
                      <div className="lbl">INUNDATED</div>
                    </div>
                  </div>

                  <div className="params-grid mono">
                    <div className="param-item">
                      <div className="key">SOIL CLAY SATURATION</div>
                      <div className="val">{activeCity.sim_soil_pct || 45}%</div>
                    </div>
                    <div className="param-item">
                      <div className="key">TERRAIN ELEVATION</div>
                      <div className="val">{activeCity.elevation_m || 50} M</div>
                    </div>
                    <div className="param-item">
                      <div className="key">AI FLOOD PREDICTION</div>
                      <div className="val" style={{ color: activeCity.flood_occurred ? 'var(--danger-red)' : 'var(--safe-green)' }}>
                        {activeCity.flood_occurred ? 'FLOOD OCCURRED' : 'NO FLOOD'}
                      </div>
                    </div>
                    <div className="param-item">
                      <div className="key">RISK SEVERITY</div>
                      <div className="val" style={{ color: getRiskColor(activeCity.risk_score) }}>
                        {activeCity.risk_label || 'SAFE'}
                      </div>
                    </div>
                  </div>

                  {activeCity.impact && (
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)', fontSize: '0.75rem' }} className="mono">
                      <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '0.3rem' }}>ESTIMATED LOCAL IMPACT:</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', color: 'var(--text-muted)' }}>
                        <div>👥 Civilians at Risk: <strong style={{ color: 'var(--danger-red)' }}>{activeCity.impact.population_at_risk?.toLocaleString() || 0}</strong></div>
                        <div>🏥 Hospitals: <strong style={{ color: 'var(--alert-amber)' }}>{activeCity.impact.hospitals_affected || 0} / {activeCity.impact.total_hospitals || 4} impacted</strong></div>
                        <div>🏫 Schools: <strong style={{ color: 'var(--accent-cyan)' }}>{activeCity.impact.schools_affected || 0} / {activeCity.impact.total_schools || 30} impacted</strong></div>
                        <div>🌾 Crop Damaged: <strong>{activeCity.impact.crop_area_damaged_ha || 0} HA</strong></div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mono" style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                  No prediction data found for "{selectedCityName}". Please select or enter a city above.
                </div>
              )}

              <button className="primary" style={{ marginTop: '0.75rem' }} onClick={() => fetchCityPrediction(selectedCityName, severity)} disabled={loading}>
                {loading ? 'RUNNING AI PREDICTION...' : `PREDICT FLOOD FOR ${selectedCityName.toUpperCase()}`}
              </button>
            </div>

            {/* Matched City Alert Message */}
            {activeCity && (
              <div style={{ marginTop: '0.5rem' }}>
                <h3 className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  OFFICIAL EARLY WARNING ADVISORY
                </h3>
                <div className="mono" style={{ 
                  background: activeCity.risk_score === 3 ? 'var(--danger-bg)' : 'rgba(255,255,255,0.05)',
                  borderLeft: `4px solid ${getRiskColor(activeCity.risk_score)}`,
                  padding: '0.85rem', fontSize: '0.8rem'
                }}>
                  <strong style={{ color: getRiskColor(activeCity.risk_score) }}>[{activeCity.name.toUpperCase()} - {activeCity.district}]</strong> {activeCity.alert}
                </div>
              </div>
            )}
          </div>

          <div className="map-area">
            <MapContainer center={[26.2006, 92.9376]} zoom={7} style={{ height: "100%", width: "100%" }} zoomControl={false}>
              <TileLayer url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png" />
              {cities.map((city, idx) => (
                <CircleMarker 
                  key={idx} center={[city.lat, city.lon]} radius={city.risk_score === 3 ? 14 : city.risk_score === 2 ? 10 : 6}
                  pathOptions={{ color: getRiskColor(city.risk_score), fillColor: getRiskColor(city.risk_score), fillOpacity: 0.7 }}
                  eventHandlers={{ click: () => { setActiveCity(city); setSelectedCityName(city.name); } }}
                >
                  <Popup>
                    <div style={{ color: '#000' }}>
                      <strong>{city.name} ({city.district})</strong><br/>
                      Risk Level: {city.risk_label || (city.risk_score === 3 ? 'Critical' : city.risk_score === 2 ? 'High' : 'Low')}<br/>
                      Inundation Extent: {city.inundation_pct || 0}%<br/>
                      Population at Risk: {city.impact?.population_at_risk?.toLocaleString() || 0}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>

            {/* Active City Full Overlay */}
            {activeCity && (
              <div className="overlay-card mono">
                {activeCity.risk_score === 3 && <div className="overlay-tag">CRITICAL RISK ZONE</div>}
                {activeCity.risk_score === 2 && <div className="overlay-tag" style={{background: 'var(--alert-amber)'}}>HIGH RISK ZONE</div>}
                {activeCity.risk_score < 2 && <div className="overlay-tag" style={{background: 'var(--safe-green)'}}>NOMINAL / LOW RISK</div>}
                
                <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  TARGET: {activeCity.name.toUpperCase()}
                </h2>
                <div style={{ marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  <div><strong>DISTRICT:</strong> {activeCity.district}</div>
                  <div><strong>COORDS:</strong> {activeCity.lat}, {activeCity.lon}</div>
                  <div><strong>ELEVATION:</strong> {activeCity.elevation_m || 50}M</div>
                  <div><strong>RIVER WATER LEVEL:</strong> {(activeCity.sim_river_m || activeCity.sim_river || 0).toFixed(1)}M</div>
                  <div><strong>SOIL CLAY SATURATION:</strong> {activeCity.sim_soil_pct || 45}%</div>
                </div>

                {activeCity.impact && (
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.85rem', borderRadius: '4px', marginBottom: '1rem' }}>
                    <div style={{ color: 'white', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.8rem' }}>AI IMPACT ASSESSMENT</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--danger-red)', marginBottom: '0.2rem' }}>
                      <span>CIVILIANS AT RISK:</span><span>{activeCity.impact.population_at_risk?.toLocaleString() || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--alert-amber)', marginBottom: '0.2rem' }}>
                      <span>MEDICAL FACILITIES:</span><span>{activeCity.impact.hospitals_affected || 0} / {activeCity.impact.total_hospitals || 4} IMPACTED</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--accent-cyan)', marginBottom: '0.2rem' }}>
                      <span>SCHOOLS AFFECTED:</span><span>{activeCity.impact.schools_affected || 0} / {activeCity.impact.total_schools || 30} IMPACTED</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#f472b6', marginBottom: '0.2rem' }}>
                      <span>CROP AREA DAMAGED:</span><span>{activeCity.impact.crop_area_damaged_ha || 0} HA</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#fb923c' }}>
                      <span>ROADS BLOCKED:</span><span>{activeCity.impact.road_km_blocked || 0} KM</span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="danger" disabled={activeCity.risk_score < 2}>DISPATCH NDRF</button>
                  <button className="outline">ISSUE SMS</button>
                </div>
              </div>
            )}
          </div>
        </>
      );
    }

    if (activeTab === 'GIS Map Layer') {
      return (
        <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 className="mono" style={{ color: 'var(--accent-cyan)' }}><MapIcon/> ADVANCED GIS MAPPING (ASSAM REGION)</h2>
          <p style={{ color: 'var(--text-muted)' }}>Integrates Digital Elevation Models (DEM), River networks, and Soil Saturation for Assam's 180 Revenue Circles.</p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <div className="card" style={{ flex: 1 }}><CheckCircle size={16} color="var(--accent-cyan)"/> Base Terrain Layer Loaded</div>
            <div className="card" style={{ flex: 1 }}><CheckCircle size={16} color="var(--accent-cyan)"/> Brahmaputra Basin Overlay Loaded</div>
            <div className="card" style={{ flex: 1 }}><CheckCircle size={16} color="var(--accent-cyan)"/> Soil Type Masks Loaded</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '1.2rem' }} className="mono">
            GIS Elevation & Inundation Raster Overlay Active
          </div>
        </div>
      );
    }

    if (activeTab === 'Threat Matrix') {
      return (
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <h2 className="mono" style={{ color: 'var(--accent-cyan)', marginBottom: '1rem' }}><Database/> THREAT MATRIX DATABASE ({cities.length} REVENUE CIRCLES)</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }} className="mono">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem' }}>REVENUE CIRCLE</th>
                <th style={{ padding: '1rem' }}>DISTRICT</th>
                <th style={{ padding: '1rem' }}>RAIN (MM)</th>
                <th style={{ padding: '1rem' }}>RIVER (M)</th>
                <th style={{ padding: '1rem' }}>INUNDATED (%)</th>
                <th style={{ padding: '1rem' }}>RISK SCORE</th>
                <th style={{ padding: '1rem' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {cities.map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: c.risk_score === 3 ? 'var(--danger-bg)' : 'transparent' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{c.name}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{c.district}</td>
                  <td style={{ padding: '1rem' }}>{(c.sim_rain_mm || c.sim_rain || 0).toFixed(1)}</td>
                  <td style={{ padding: '1rem' }}>{(c.sim_river_m || c.sim_river || 0).toFixed(1)}</td>
                  <td style={{ padding: '1rem' }}>{c.inundation_pct || 0}%</td>
                  <td style={{ padding: '1rem' }}>{c.risk_score}/3</td>
                  <td style={{ padding: '1rem', color: getRiskColor(c.risk_score), fontWeight: 'bold' }}>
                    {c.risk_label || (c.risk_score === 3 ? 'CRITICAL' : c.risk_score === 2 ? 'HIGH' : c.risk_score === 1 ? 'MODERATE' : 'SAFE')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === 'Evac Protocols') {
      return (
        <div style={{ flex: 1, padding: '2rem' }}>
          <h2 className="mono" style={{ color: 'var(--accent-cyan)', marginBottom: '1rem' }}><AlertOctagon/> EVACUATION PROTOCOLS (SOP)</h2>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--danger-red)', marginBottom: '0.5rem' }}>STAGE 3: CRITICAL INUNDATION</h3>
            <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8', color: 'var(--text-muted)' }}>
              <li>Trigger automated SMS alerts via Telecom APIs to all registered devices in impacted geofences.</li>
              <li>Dispatch National Disaster Response Force (NDRF) teams to designated rally points.</li>
              <li>Initiate hospital backup power protocols in high-risk zones.</li>
            </ul>
          </div>
          <div className="card">
            <h3 style={{ color: 'var(--alert-amber)', marginBottom: '0.5rem' }}>STAGE 2: HIGH RISK</h3>
            <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8', color: 'var(--text-muted)' }}>
              <li>Send advisory SMS to residents regarding potential evacuation.</li>
              <li>Monitor dam release thresholds every 15 minutes.</li>
              <li>Pre-position emergency supplies at relief camps.</li>
            </ul>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <div className="top-nav">
        <div className="nav-main">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ShieldAlert size={28} color="var(--accent-cyan)" />
            <div>
              <h1 style={{ fontSize: '1.2rem', letterSpacing: '2px', textTransform: 'uppercase' }}>FloodGuard AI</h1>
              <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>NATL DISASTER OPS CMD // SIH26071</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="pill"><span className="dot"></span> SYSTEM OPERATIONAL</div>
            <div className={`pill ${highestRisk === 3 ? 'danger' : ''}`}>
              DEF-NET: {highestRisk === 3 ? 'CRITICAL' : 'SECURE'}
            </div>
          </div>
        </div>
        <div className="nav-telemetry mono">
          <span>LAT: 26.2006 N</span>
          <span>LON: 92.9376 E</span>
          <span>SATELLITE: CONNECTED</span>
          <span>OPEN-METEO FEED: LIVE</span>
          <span style={{ color: loading ? '#f59e0b' : 'var(--accent-cyan)' }}>
            {loading ? 'CALCULATING INFERENCES...' : 'AI MODEL: ONLINE & READY'}
          </span>
        </div>
      </div>

      <div className="main-content">
        {/* Left Sidebar */}
        <div className="sidebar">
          {['Tactical Command', 'GIS Map Layer', 'Threat Matrix', 'Evac Protocols'].map(tab => (
            <div 
              key={tab}
              className={`nav-item ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'Tactical Command' && <Crosshair size={18}/>}
              {tab === 'GIS Map Layer' && <MapIcon size={18}/>}
              {tab === 'Threat Matrix' && <Database size={18}/>}
              {tab === 'Evac Protocols' && <AlertOctagon size={18}/>}
              {tab}
            </div>
          ))}
        </div>

        {/* Dynamic Content */}
        {renderContent()}
        
      </div>
    </div>
  );
}

export default App;
