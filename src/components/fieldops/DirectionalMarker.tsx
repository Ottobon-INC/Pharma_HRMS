import L from 'leaflet';
import { FieldVisitStatus } from '../../types';

export function getStatusColor(status: FieldVisitStatus | string, hasException?: boolean): string {
 if (hasException || status === 'FAILED' || status === 'CANCELLED') return '#ef4444'; // Red
 if (status === 'ARRIVED' || status === 'COMPLETED' || status === 'IN_PROGRESS') return '#10b981'; // Emerald
 if (status === 'EN_ROUTE') return '#f59e0b'; // Amber
 return '#3b82f6'; // Blue for ASSIGNED and other
}

/**
 * Creates a Leaflet DivIcon containing a modern directional SVG pin.
 * Rotates to match the heading (degrees from North: 0 = North, 90 = East, 180 = South, 270 = West).
 */
export function createDirectionalIcon(
 status: FieldVisitStatus | string,
 heading: number = 0,
 hasException: boolean = false
): L.DivIcon {
 const color = getStatusColor(status, hasException);
 const normalizedHeading = ((heading % 360) + 360) % 360;

 // Modern navigation puck / directional marker SVG
 const svgHtml = `
  <div style="
   display: flex;
   align-items: center;
   justify-content: center;
   width: 40px;
   height: 40px;
   position: relative;
 ">
   <!-- Outer Pulse Ring for En Route -->
   ${status === 'EN_ROUTE' ? `
    <div style="
     position: absolute;
     width: 38px;
     height: 38px;
     border-radius: 50%;
     background-color: ${color}33;
     animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
   "></div>
   ` : ''}

   <!-- Main Marker Body -->
   <div style="
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 4px 10px rgba(0,0,0,0.25), 0 0 0 2px ${color};
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 2;
  ">
    <!-- Rotatable Directional Arrow / Chevron -->
    <div style="
     transform: rotate(${normalizedHeading}deg);
     transition: transform 0.4s ease-out;
     display: flex;
     align-items: center;
     justify-content: center;
     width: 100%;
     height: 100%;
   ">
     <svg width="18"height="18"viewBox="0 0 24 24"fill="none"xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L4 20L12 16.5L20 20L12 3Z"fill="${color}"stroke="${color}"stroke-width="1.5"stroke-linejoin="round"stroke-linecap="round"/>
     </svg>
    </div>
   </div>
  </div>
 `;

 return L.divIcon({
  className: 'directional-agent-marker',
  html: svgHtml,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
 });
}
