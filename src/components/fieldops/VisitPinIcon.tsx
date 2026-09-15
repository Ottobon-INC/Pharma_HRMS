import L from 'leaflet';
import { PinCategory } from '../../types';

export function getPinColor(category: PinCategory | string): string {
 switch (category) {
  case 'Patient Home':
   return '#0d9488'; // Teal
  case 'Clinic Entrance':
   return '#2563eb'; // Blue
  case 'Sample Collected':
   return '#0891b2'; // Cyan
  case 'Lab Drop-off':
   return '#d97706'; // Amber
  case 'Delivery Point':
   return '#059669'; // Emerald
  case 'Exception Site':
   return '#dc2626'; // Red
  default:
   return '#475569'; // Slate
 }
}

/**
 * Creates a Leaflet DivIcon containing a sleek, modern thumbtack / dropped-pin SVG.
 */
export function createVisitPinIcon(category: PinCategory | string, label?: string): L.DivIcon {
 const color = getPinColor(category);

 const svgHtml = `
  <div style="
   position: relative;
   width: 32px;
   height: 38px;
   display: flex;
   flex-direction: column;
   align-items: center;
   filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3));
 ">
   <!-- Pin Head -->
   <div style="
    width: 28px;
    height: 28px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    background: ${color};
    border: 2px solid #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div style="
     width: 8px;
     height: 8px;
     border-radius: 50%;
     background: #ffffff;
     transform: rotate(45deg);
   "></div>
   </div>

   <!-- Optional Mini Label Badge -->
   ${label ? `
    <div style="
     position: absolute;
     top: -14px;
     background: rgba(15, 23, 42, 0.9);
     color: white;
     font-size: 8px;
     font-weight: 800;
     padding: 1px 4px;
     border-radius: 4px;
     white-space: nowrap;
     max-width: 70px;
     overflow: hidden;
     text-overflow: ellipsis;
     border: 1px solid rgba(255,255,255,0.3);
   ">
     ${label}
    </div>
   ` : ''}
  </div>
 `;

 return L.divIcon({
  className: 'custom-dropped-pin-icon',
  html: svgHtml,
  iconSize: [32, 38],
  iconAnchor: [16, 38],
  popupAnchor: [0, -36]
 });
}
