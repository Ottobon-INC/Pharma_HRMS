import L from 'leaflet';

/**
 * Creates a modern Leaflet DivIcon for employee attendance check-ins.
 * Green avatar puck with active clock-in ring pulse if currently on shift.
 */
export function createCheckInMarkerIcon(
 isActive: boolean,
 employeeName?: string
): L.DivIcon {
 const color = isActive ? '#059669' : '#64748b'; // Emerald if active, Slate if checked out

 const svgHtml = `
  <div style="
   position: relative;
   width: 36px;
   height: 36px;
   display: flex;
   align-items: center;
   justify-content: center;
 ">
   ${isActive ? `
    <!-- Active Shift Glowing Pulse -->
    <div style="
     position: absolute;
     width: 34px;
     height: 34px;
     border-radius: 50%;
     background-color: ${color}33;
     animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
   "></div>
   ` : ''}

   <!-- Main Badge -->
   <div style="
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #ffffff;
    border: 2.5px solid ${color};
    box-shadow: 0 4px 10px rgba(0,0,0,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 2;
  ">
    <svg width="15"height="15"viewBox="0 0 24 24"fill="none"xmlns="http://www.w3.org/2000/svg">
     <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"stroke="${color}"stroke-width="2"stroke-linecap="round"stroke-linejoin="round"/>
     <circle cx="12"cy="7"r="4"stroke="${color}"stroke-width="2"stroke-linecap="round"stroke-linejoin="round"/>
    </svg>
   </div>

   <!-- Optional Mini Name Pill -->
   ${employeeName ? `
    <div style="
     position: absolute;
     bottom: -16px;
     background: rgba(15, 23, 42, 0.9);
     color: white;
     font-size: 8px;
     font-weight: 800;
     padding: 1px 5px;
     border-radius: 4px;
     white-space: nowrap;
     max-width: 80px;
     overflow: hidden;
     text-overflow: ellipsis;
     border: 1px solid rgba(255,255,255,0.25);
     box-shadow: 0 2px 4px rgba(0,0,0,0.3);
     z-index: 3;
   ">
     ${employeeName}
    </div>
   ` : ''}
  </div>
 `;

 return L.divIcon({
  className: 'custom-checkin-marker',
  html: svgHtml,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18]
 });
}
