// @ts-expect-error — pas de types pour ce package de donnees pure SVG
import world from '@svg-maps/world';
import React, { useEffect, useMemo, useState } from 'react';

type CountryTraffic = {
code: string;
pageviews: number;
clicks: number;
visitors: number;
};

type TrafficPayload = {
countries?: CountryTraffic[];
totals?: { visitors?: number; pageviews?: number; clicks?: number };
};

declare global {
interface Window {
__trafficMapLastPayload?: TrafficPayload;
}
}

function latLngToXY(lat: number, lng: number): { x: number; y: number } {
return {
x: ((lng + 180) / 360) * 1000,
y: ((90 - lat) / 180) * 500,
};
}

const COUNTRY_LATLNG: Record<string, [number, number]> = {
CA: [56.13, -106.35],
US: [37.09, -95.71],
MX: [23.63, -102.55],
BR: [-14.24, -51.93],
GB: [55.38, -3.44],
FR: [46.23, 2.21],
BE: [50.50, 4.47],
CH: [46.82, 8.23],
ES: [40.46, -3.75],
PT: [39.40, -8.22],
DE: [51.17, 10.45],
IT: [41.87, 12.57],
NL: [52.13, 5.29],
PL: [51.92, 19.15],
MA: [31.79, -7.09],
DZ: [28.03, 1.66],
TN: [33.89, 9.54],
SN: [14.50, -14.45],
CI: [7.54, -5.55],
GH: [7.95, -1.02],
NG: [9.08, 8.68],
CM: [3.85, 11.52],
CD: [-4.04, 21.76],
ZA: [-30.56, 22.94],
KE: [-0.02, 37.91],
EG: [26.82, 30.80],
SA: [23.89, 45.07],
AE: [23.42, 53.85],
PK: [30.38, 69.35],
IN: [20.59, 78.96],
CN: [35.86, 104.20],
JP: [36.20, 138.25],
KR: [35.91, 127.77],
RU: [61.52, 105.32],
UA: [48.38, 31.17],
TR: [38.96, 35.24],
AU: [-25.27, 133.78],
NZ: [-40.90, 174.89],
ID: [-0.79, 113.92],
SG: [1.35, 103.82],
};

const COUNTRY_NAMES_FR: Record<string, string> = {
CA: 'Canada', US: 'Etats-Unis', FR: 'France', BE: 'Belgique', CH: 'Suisse',
GB: 'Royaume-Uni', CM: 'Cameroun', SN: 'Senegal', CI: "Cote d'Ivoire",
MA: 'Maroc', DZ: 'Algerie', TN: 'Tunisie', NG: 'Nigeria', GH: 'Ghana',
AE: 'Emirats arabes unis', DE: 'Allemagne', ES: 'Espagne', IT: 'Italie',
PT: 'Portugal', NL: 'Pays-Bas', PL: 'Pologne', IN: 'Inde', CN: 'Chine',
JP: 'Japon', KR: 'Coree du Sud', BR: 'Bresil', MX: 'Mexique', AU: 'Australie',
NZ: 'Nouvelle-Zelande', SA: 'Arabie saoudite', EG: 'Egypte', ZA: 'Afrique du Sud',
KE: 'Kenya', CD: 'Congo (RDC)', RU: 'Russie', UA: 'Ukraine', TR: 'Turquie',
PK: 'Pakistan', ID: 'Indonesie', SG: 'Singapour',
};

function formatCompact(value: number): string {
return Number(value || 0).toLocaleString('fr-CA');
}

function dotRadius(value: number, max: number): number {
if (!value) return 0;
const ratio = Math.max(0.18, Math.min(1, value / Math.max(1, max)));
return 5 + ratio * 14;
}

export default function TrafficWorldMap() {
const [countries, setCountries] = useState<CountryTraffic[]>([]);
const [totals, setTotals] = useState<TrafficPayload['totals']>({});
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [hovered, setHovered] = useState<CountryTraffic | null>(null);

useEffect(() => {
const applyPayload = (payload?: TrafficPayload) => {
setCountries(Array.isArray(payload?.countries) ? payload!.countries! : []);
setTotals(payload?.totals ?? {});
setError('');
setLoading(false);
};
const onLoading = () => { setLoading(true); setError(''); };
const onData = (e: Event) => applyPayload((e as CustomEvent<TrafficPayload>).detail);
const onError = (e: Event) => {
setError(String((e as CustomEvent<{ message?: string }>).detail?.message || 'Erreur'));
setLoading(false);
};
window.addEventListener('capitune:traffic-map-loading', onLoading);
window.addEventListener('capitune:traffic-map-data', onData as EventListener);
window.addEventListener('capitune:traffic-map-error', onError as EventListener);
if (window.__trafficMapLastPayload) applyPayload(window.__trafficMapLastPayload);
return () => {
window.removeEventListener('capitune:traffic-map-loading', onLoading);
window.removeEventListener('capitune:traffic-map-data', onData as EventListener);
window.removeEventListener('capitune:traffic-map-error', onError as EventListener);
};
}, []);

const trafficSet = useMemo<Record<string, CountryTraffic>>(() => {
const map: Record<string, CountryTraffic> = {};
countries.forEach((c) => { map[String(c.code || '').toUpperCase()] = c; });
return map;
}, [countries]);

const maxVisitors = useMemo(
() => countries.reduce((max, c) => Math.max(max, Number(c.visitors || 0)), 0),
[countries]
);

const dots = useMemo(() => {
return countries
.filter((c) => COUNTRY_LATLNG[String(c.code || '').toUpperCase()])
.map((c) => {
const code = String(c.code || '').toUpperCase();
const [lat, lng] = COUNTRY_LATLNG[code];
const { x, y } = latLngToXY(lat, lng);
return { ...c, code, x, y, radius: dotRadius(Number(c.visitors || 0), maxVisitors) };
})
.sort((a, b) => a.radius - b.radius);
}, [countries, maxVisitors]);

const topCountry = countries[0] ?? null;
const activeCountry = hovered ?? topCountry;

const locations: Array<{ id: string; name: string; path: string }> =
(world as { locations: Array<{ id: string; name: string; path: string }> }).locations;

return (
<div className="traffic-map-react">
<div className="traffic-map-badges">
<span className="traffic-badge">
<i className="fa fa-location-dot" />
{countries.length} pays detectes
</span>
<span className="traffic-badge">
<i className="fa fa-users" />
{formatCompact(Number(totals?.visitors || 0))} visiteurs
</span>
</div>

<div className="traffic-map-shell">
{loading ? (
<div className="traffic-map-empty">Chargement de la carte...</div>
) : error ? (
<div className="traffic-map-empty">{error}</div>
) : (
<svg
viewBox="0 0 1000 500"
className="traffic-map-svg"
aria-label="Carte mondiale du trafic"
>
<defs>
<radialGradient id="tmOcean" cx="50%" cy="40%" r="70%">
<stop offset="0%" stopColor="#1a3a5c" />
<stop offset="100%" stopColor="#0c1a2e" />
</radialGradient>
<filter id="tmBlur">
<feGaussianBlur stdDeviation="4" />
</filter>
<filter id="tmGlowFilter">
<feGaussianBlur stdDeviation="5" result="blur" />
<feMerge>
<feMergeNode in="blur" />
<feMergeNode in="SourceGraphic" />
</feMerge>
</filter>
</defs>

<rect x="0" y="0" width="1000" height="500" fill="url(#tmOcean)" rx="6" />

<g stroke="rgba(120,180,255,0.05)" strokeWidth="0.5">
{[83, 167, 250, 333, 416].map((y) => (
<line key={y} x1="0" y1={y} x2="1000" y2={y} />
))}
{[100, 200, 300, 400, 500, 600, 700, 800, 900].map((x) => (
<line key={x} x1={x} y1="0" x2={x} y2="500" />
))}
</g>

<g>
{locations.map((loc) => {
const code = loc.id.toUpperCase();
const hasTraffic = Boolean(trafficSet[code]);
const isActive = hasTraffic && activeCountry?.code === code;
return (
<path
key={loc.id}
d={loc.path}
className="traffic-map-node"
fill={
isActive
? 'rgba(255,157,10,0.35)'
: hasTraffic
? 'rgba(89,140,255,0.22)'
: 'rgba(255,255,255,0.05)'
}
stroke={
isActive
? 'rgba(255,200,80,0.8)'
: hasTraffic
? 'rgba(89,140,255,0.45)'
: 'rgba(148,180,255,0.1)'
}
strokeWidth={isActive ? 1.2 : hasTraffic ? 0.8 : 0.4}
onMouseEnter={() => trafficSet[code] && setHovered(trafficSet[code])}
onMouseLeave={() => setHovered(null)}
/>
);
})}
</g>

{dots.map((item) => {
const isActive = activeCountry?.code === item.code;
return (
<g
key={item.code}
onMouseEnter={() => setHovered(item)}
onMouseLeave={() => setHovered(null)}
className="traffic-map-node"
>
<circle
cx={item.x}
cy={item.y}
r={item.radius * 2.8}
fill="rgba(255,157,10,0.08)"
filter="url(#tmBlur)"
/>
<circle
cx={item.x}
cy={item.y}
r={item.radius * 1.7}
fill="none"
stroke={isActive ? 'rgba(255,200,80,0.55)' : 'rgba(255,157,10,0.3)'}
strokeWidth={isActive ? 1.5 : 1}
/>
<circle
cx={item.x}
cy={item.y}
r={item.radius}
fill={isActive ? '#ffd166' : '#ff9d0a'}
stroke={isActive ? '#ffffff' : 'rgba(255,255,255,0.7)'}
strokeWidth={isActive ? 2 : 1.2}
filter={isActive ? 'url(#tmGlowFilter)' : undefined}
/>
</g>
);
})}
</svg>
)}
</div>

<div className="traffic-map-legend">
<div className="traffic-legend-info">
<strong>
{activeCountry
? COUNTRY_NAMES_FR[activeCountry.code] || activeCountry.code
: 'Vue mondiale'}
</strong>
<span>
{activeCountry
? `${formatCompact(activeCountry.pageviews)} vues . ${formatCompact(activeCountry.clicks)} clics . ${formatCompact(activeCountry.visitors)} visiteurs`
: 'Survolez un pays pour voir le detail.'}
</span>
</div>
<div className="traffic-legend-scale">
<span>Faible</span>
<div className="traffic-legend-bar" />
<span>Fort</span>
</div>
</div>
</div>
);
}
