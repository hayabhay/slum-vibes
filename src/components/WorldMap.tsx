import { memo } from 'react';
import type { RefObject } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { countryRegionMap } from '../data/countryRegionMap';
import { getRegionColor, getRegionHoverColor, hasCountryData } from '../utils/mapHelpers';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';

function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return hex + a;
}

interface WorldMapProps {
  onCountryClick: (countryId: string) => void;
  onCountryHover: (name: string, x: number, y: number) => void;
  onCountryLeave: () => void;
  selectedCountryId: string | null;
  isDark: boolean;
  isDraggingRef: RefObject<boolean>;
}

function WorldMap({ onCountryClick, onCountryHover, onCountryLeave, selectedCountryId, isDark, isDraggingRef }: WorldMapProps) {
  const ocean          = 'var(--ocean)';
  const mutedFill      = isDark ? '#ffffff08' : '#00000008';
  const mutedHover     = isDark ? '#ffffff14' : '#00000014';
  const stroke         = isDark ? '#EEEEEE'   : '#000000';
  const strokeWidth    = 0.25;
  const strokeWidthHover = 0.6;

  return (
    <ComposableMap
      projection="geoNaturalEarth1"
      projectionConfig={{ scale: 170, center: [0, 0] }}
      width={960}
      height={460}
      style={{ height: '100%', width: 'auto', display: 'block' }}
    >
      <rect width={960} height={460} fill={ocean} />
      <Geographies geography={GEO_URL}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const countryId  = geo.id as string;
            const regionId   = countryRegionMap[countryId];
            const clickable  = hasCountryData(countryId);
            const isSelected = countryId === selectedCountryId;

            const rawColor  = regionId ? getRegionColor(countryId)      : null;
            const rawHover  = regionId ? getRegionHoverColor(countryId) : null;
            const fillColor = rawColor ? withAlpha(rawColor, 0.10) : mutedFill;
            const fillHover = rawHover ? withAlpha(rawHover, 0.22) : mutedHover;

            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                onClick={() => {
                  if (!isDraggingRef.current && clickable) onCountryClick(countryId);
                }}
                onMouseEnter={(e) => {
                  if (!isDraggingRef.current && regionId) {
                    onCountryHover(geo.properties.name as string, e.clientX, e.clientY);
                  }
                }}
                onMouseMove={(e) => {
                  if (!isDraggingRef.current && regionId) {
                    onCountryHover(geo.properties.name as string, e.clientX, e.clientY);
                  }
                }}
                onMouseLeave={onCountryLeave}
                style={{
                  default: {
                    fill: isSelected ? fillHover : fillColor,
                    stroke,
                    strokeWidth,
                    outline: 'none',
                  },
                  hover: {
                    fill: fillHover,
                    stroke,
                    strokeWidth: strokeWidthHover,
                    outline: 'none',
                    cursor: clickable ? 'pointer' : 'default',
                  },
                  pressed: {
                    fill: fillHover,
                    stroke,
                    strokeWidth: strokeWidthHover,
                    outline: 'none',
                  },
                }}
              />
            );
          })
        }
      </Geographies>
    </ComposableMap>
  );
}

export default memo(WorldMap);
