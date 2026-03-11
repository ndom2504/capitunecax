import React, { useEffect, useMemo, useState } from 'react';

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

const COUNTRY_POINTS: Record<string, { x: number; y: number }> = {
	CA: { x: 96, y: 88 },
	US: { x: 101, y: 106 },
	MX: { x: 99, y: 132 },
	BR: { x: 152, y: 188 },
	GB: { x: 207, y: 88 },
	FR: { x: 214, y: 98 },
	BE: { x: 216, y: 94 },
	CH: { x: 220, y: 102 },
	ES: { x: 204, y: 112 },
	PT: { x: 196, y: 114 },
	DE: { x: 224, y: 92 },
	IT: { x: 230, y: 112 },
	MA: { x: 198, y: 132 },
	DZ: { x: 218, y: 136 },
	TN: { x: 234, y: 138 },
	SN: { x: 180, y: 145 },
	CI: { x: 198, y: 156 },
	GH: { x: 205, y: 158 },
	NG: { x: 220, y: 158 },
	CM: { x: 229, y: 168 },
	AE: { x: 278, y: 148 },
	IN: { x: 309, y: 154 },
	CN: { x: 344, y: 121 },
	AU: { x: 360, y: 224 },
};

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

function formatCompact(value: number): string {
	return Number(value || 0).toLocaleString('fr-CA');
}

function dotRadius(value: number, max: number): number {
	if (!value) return 0;
	const ratio = Math.max(0.12, Math.min(1, value / Math.max(1, max)));
	return 4 + ratio * 10;
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

	const maxVisitors = useMemo(() => {
		return countries.reduce((max, item) => Math.max(max, Number(item.visitors || 0)), 0);
	}, [countries]);

	const dots = useMemo(() => {
		return countries
			.filter((item) => COUNTRY_POINTS[String(item.code || '').toUpperCase()])
			.map((item) => {
				const code = String(item.code || '').toUpperCase();
				const point = COUNTRY_POINTS[code];
				return { ...item, code, point, radius: dotRadius(Number(item.visitors || 0), maxVisitors) };
			})
			.sort((a, b) => a.radius - b.radius);
	}, [countries, maxVisitors]);

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
					<svg viewBox="0 0 420 280" className="traffic-map-svg" aria-label="Carte mondiale du trafic">
						<defs>
							<radialGradient id="oceanGlow" cx="50%" cy="35%" r="80%">
								<stop offset="0%" stopColor="rgba(89,144,255,0.14)" />
								<stop offset="100%" stopColor="rgba(89,144,255,0)" />
							</radialGradient>
							<linearGradient id="landFill" x1="0" x2="1">
								<stop offset="0%" stopColor="#1b2944" />
								<stop offset="100%" stopColor="#24385c" />
							</linearGradient>
						</defs>
						<rect x="0" y="0" width="420" height="280" fill="url(#oceanGlow)" />
						<g stroke="rgba(255,255,255,0.06)" strokeWidth="1">
							<path d="M0 48 H420 M0 96 H420 M0 144 H420 M0 192 H420 M0 240 H420" />
							<path d="M52 0 V280 M104 0 V280 M156 0 V280 M208 0 V280 M260 0 V280 M312 0 V280 M364 0 V280" />
						</g>
						<g fill="url(#landFill)" stroke="rgba(176, 208, 255, 0.15)" strokeWidth="1.2">
							<path d="M60 84l24-9 18-22 35-7 44 8 18 20-8 14 22 18-11 16-30 8-23 18-27 0-10 23-27-4-18-17-8-33 6-23 12-10-12-18z" />
							<path d="M129 150l26 9 18 29 10 32-10 20-20 10-23-15-11-30 5-22z" />
							<path d="M194 76l26-8 38 4 22 12 20 1 15 18-8 13-21 7-20 1-8 20-28 7-23-10-11-17-17-9-4-18 11-13z" />
							<path d="M214 147l19 11 19 2 7 16-9 15-21 4-7 22-12 18-23-13-10-21 6-16 12-10 7-16z" />
							<path d="M262 90l27-6 35 7 29-2 22 15 7 18-10 14-23 7-11 18-27 8-12-8-22 8-18-22-12-6-8-19 10-16z" />
							<path d="M334 206l18-4 24 8 12 18-16 13-34-5-16-17z" />
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
									<circle cx={item.point.x} cy={item.point.y} r={item.radius * 2.2} fill="rgba(255,148,8,0.12)" />
									<circle cx={item.point.x} cy={item.point.y} r={item.radius * 1.45} fill="rgba(91,140,255,0.16)" />
									<circle
										cx={item.point.x}
										cy={item.point.y}
										r={item.radius}
										fill={isActive ? '#ffd166' : '#ff9408'}
										stroke="#ffffff"
										strokeWidth={isActive ? 2.2 : 1.4}
									/>
								</g>
							);
						})}
					</svg>
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
