import React, { useEffect, useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

type CountryTraffic = {
	code: string;
	pageviews: number;
	clicks: number;
	visitors: number;
};

type TrafficPayload = {
	countries?: CountryTraffic[];
	totals?: {
		visitors?: number;
		pageviews?: number;
		clicks?: number;
	};
};

declare global {
	interface Window {
		__trafficMapLastPayload?: TrafficPayload;
	}
}

const GEO_URL = 'https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json';

const COUNTRY_NAMES_FR: Record<string, string> = {
	CA: 'Canada',
	US: 'États-Unis',
	FR: 'France',
	BE: 'Belgique',
	CH: 'Suisse',
	GB: 'Royaume-Uni',
	CM: 'Cameroun',
	SN: 'Sénégal',
	CI: 'Côte d’Ivoire',
	MA: 'Maroc',
	DZ: 'Algérie',
	TN: 'Tunisie',
	NG: 'Nigeria',
	GH: 'Ghana',
	AE: 'Émirats arabes unis',
	DE: 'Allemagne',
	ES: 'Espagne',
	IT: 'Italie',
	PT: 'Portugal',
	IN: 'Inde',
	CN: 'Chine',
	BR: 'Brésil',
	MX: 'Mexique',
	AU: 'Australie',
};

const COUNTRY_NAMES_EN: Record<string, string[]> = {
	CA: ['Canada'],
	US: ['United States of America', 'United States', 'USA'],
	FR: ['France'],
	BE: ['Belgium'],
	CH: ['Switzerland'],
	GB: ['United Kingdom', 'England'],
	CM: ['Cameroon'],
	SN: ['Senegal'],
	CI: ["Ivory Coast", "Côte d'Ivoire", 'Cote d\'Ivoire'],
	MA: ['Morocco'],
	DZ: ['Algeria'],
	TN: ['Tunisia'],
	NG: ['Nigeria'],
	GH: ['Ghana'],
	AE: ['United Arab Emirates'],
	DE: ['Germany'],
	ES: ['Spain'],
	IT: ['Italy'],
	PT: ['Portugal'],
	IN: ['India'],
	CN: ['China'],
	BR: ['Brazil'],
	MX: ['Mexico'],
	AU: ['Australia'],
};

function normalize(value: string): string {
	return String(value || '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();
}

function getCountryCodeByGeoName(name: string): string | null {
	const normalized = normalize(name);
	for (const [code, names] of Object.entries(COUNTRY_NAMES_EN)) {
		if (names.some((n) => normalize(n) === normalized)) return code;
	}
	return null;
}

function formatCompact(value: number): string {
	return Number(value || 0).toLocaleString('fr-CA');
}

function colorForValue(value: number, max: number): string {
	if (!value) return 'rgba(255,255,255,0.08)';
	const ratio = Math.max(0.08, Math.min(1, value / Math.max(1, max)));
	const blue = 92 + Math.round((255 - 92) * ratio);
	const green = 124 + Math.round((148 - 124) * ratio);
	const alpha = 0.24 + ratio * 0.72;
	return `rgba(${blue}, ${green}, 255, ${alpha})`;
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

		const onLoading = () => {
			setLoading(true);
			setError('');
		};

		const onData = (event: Event) => {
			const detail = (event as CustomEvent<TrafficPayload>).detail;
			applyPayload(detail);
		};

		const onError = (event: Event) => {
			const detail = (event as CustomEvent<{ message?: string }>).detail;
			setError(String(detail?.message || 'Erreur chargement carte'));
			setLoading(false);
		};

		window.addEventListener('capitune:traffic-map-loading', onLoading);
		window.addEventListener('capitune:traffic-map-data', onData as EventListener);
		window.addEventListener('capitune:traffic-map-error', onError as EventListener);

		if (window.__trafficMapLastPayload) {
			applyPayload(window.__trafficMapLastPayload);
		}

		return () => {
			window.removeEventListener('capitune:traffic-map-loading', onLoading);
			window.removeEventListener('capitune:traffic-map-data', onData as EventListener);
			window.removeEventListener('capitune:traffic-map-error', onError as EventListener);
		};
	}, []);

	const countryMap = useMemo(() => {
		return countries.reduce<Record<string, CountryTraffic>>((acc, item) => {
			acc[String(item.code || '').toUpperCase()] = item;
			return acc;
		}, {});
	}, [countries]);

	const maxVisitors = useMemo(() => {
		return countries.reduce((max, item) => Math.max(max, Number(item.visitors || 0)), 0);
	}, [countries]);

	const topCountry = countries[0] ?? null;
	const activeCountry = hovered ?? topCountry;

	return (
		<div className="traffic-map-react">
			<div className="traffic-map-badges">
				<span className="traffic-badge"><i className="fa fa-location-dot" />{countries.length} pays détectés</span>
				<span className="traffic-badge"><i className="fa fa-users" />{formatCompact(Number(totals?.visitors || 0))} visiteurs</span>
			</div>

			<div className="traffic-map-shell">
				{loading ? (
					<div className="traffic-map-empty">Chargement de la carte…</div>
				) : error ? (
					<div className="traffic-map-empty">{error}</div>
				) : (
					<ComposableMap projection="geoMercator" projectionConfig={{ scale: 118 }} className="traffic-map-svg" aria-label="Carte mondiale du trafic">
						<Geographies geography={GEO_URL}>
							{({ geographies }) =>
								geographies.map((geo) => {
									const geoName = String((geo.properties as { name?: string })?.name || '');
									const code = getCountryCodeByGeoName(geoName);
									const item = code ? countryMap[code] : undefined;
									const visits = Number(item?.visitors || 0);

									return (
										<Geography
											key={geo.rsmKey}
											geography={geo}
											onMouseEnter={() => {
												if (item) setHovered(item);
											}}
											onMouseLeave={() => setHovered(null)}
											style={{
												default: {
													fill: colorForValue(visits, maxVisitors),
													stroke: 'rgba(255,255,255,0.16)',
													strokeWidth: 0.6,
													outline: 'none',
												},
												hover: {
													fill: item ? '#ff9408' : 'rgba(255,255,255,0.12)',
													stroke: '#ffffff',
													strokeWidth: 0.9,
													outline: 'none',
												},
												pressed: {
													fill: item ? '#ff9408' : 'rgba(255,255,255,0.12)',
													stroke: '#ffffff',
													strokeWidth: 0.9,
													outline: 'none',
												},
											}}
										/>
									);
								})
							}
						</Geographies>
					</ComposableMap>
				)}
			</div>

			<div className="traffic-map-legend">
				<div>
					<strong>{activeCountry ? (COUNTRY_NAMES_FR[activeCountry.code] || activeCountry.code) : 'Vue mondiale'}</strong>
					<span>
						{activeCountry
							? `${formatCompact(activeCountry.pageviews)} vues · ${formatCompact(activeCountry.clicks)} clics · ${formatCompact(activeCountry.visitors)} visiteurs`
							: 'Survolez un pays pour voir le détail.'}
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
