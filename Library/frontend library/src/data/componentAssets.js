// High-detail realistic electronics component assets for the Smart Digital Almirah
// Studio-lit multi-part visuals rendered cleanly inside transparent plastic bins (100% offline-reliable)

const toDataUri = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const createResistorSvg = () => toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
  <defs>
    <linearGradient id="resBody" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/><stop offset="35%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#92400e"/>
    </linearGradient>
    <linearGradient id="resLead" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#94a3b8"/><stop offset="50%" stop-color="#e2e8f0"/><stop offset="100%" stop-color="#64748b"/>
    </linearGradient>
    <filter id="s1"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#0f172a" flood-opacity="0.28"/></filter>
  </defs>
  <g filter="url(#s1)">
    ${[0,1,2,3,4].map(i => {
      const y = 32 + i * 32;
      return `
      <line x1="25" y1="${y}" x2="295" y2="${y}" stroke="url(#resLead)" stroke-width="4" stroke-linecap="round"/>
      <rect x="85" y="${y-10}" width="150" height="20" rx="9" fill="url(#resBody)"/>
      <circle cx="92" cy="${y}" r="11" fill="url(#resBody)"/>
      <circle cx="228" cy="${y}" r="11" fill="url(#resBody)"/>
      <rect x="108" y="${y-10}" width="8" height="20" fill="#78350f"/>
      <rect x="132" y="${y-10}" width="8" height="20" fill="${i%2===0 ? '#18181b' : '#dc2626'}"/>
      <rect x="156" y="${y-10}" width="8" height="20" fill="${i%3===0 ? '#dc2626' : '#ea580c'}"/>
      <rect x="198" y="${y-10}" width="8" height="20" fill="#eab308"/>
      <rect x="92" y="${y-7}" width="136" height="3" rx="1.5" fill="#ffffff" opacity="0.45"/>`;
    }).join('')}
  </g>
</svg>`);

const createCapacitorSvg = () => toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
  <defs>
    <linearGradient id="capBlue" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1d4ed8"/><stop offset="40%" stop-color="#3b82f6"/><stop offset="85%" stop-color="#1e40af"/><stop offset="100%" stop-color="#172554"/>
    </linearGradient>
    <linearGradient id="capDark" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1e293b"/><stop offset="40%" stop-color="#475569"/><stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <filter id="s2"><feDropShadow dx="1" dy="4" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.3"/></filter>
  </defs>
  <g filter="url(#s2)">
    <!-- Large Electrolytic 1 -->
    <line x1="68" y1="120" x2="68" y2="178" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>
    <line x1="92" y1="120" x2="92" y2="168" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="80" cy="44" rx="28" ry="9" fill="#e2e8f0"/>
    <path d="M52 44 L52 122 A28 9 0 0 0 108 122 L108 44 Z" fill="url(#capBlue)"/>
    <path d="M52 44 L52 122 A28 9 0 0 0 66 128 L66 50 Z" fill="#dbeafe"/>
    <text x="86" y="88" font-family="monospace" font-size="10" font-weight="800" fill="#ffffff" text-anchor="middle">470μF</text>
    <!-- Dark Electrolytic 2 -->
    <line x1="145" y1="125" x2="145" y2="178" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>
    <line x1="167" y1="125" x2="167" y2="168" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="156" cy="56" rx="24" ry="8" fill="#cbd5e1"/>
    <path d="M132 56 L132 126 A24 8 0 0 0 180 126 L180 56 Z" fill="url(#capDark)"/>
    <path d="M132 56 L132 126 A24 8 0 0 0 144 131 L144 61 Z" fill="#e2e8f0"/>
    <text x="162" y="96" font-family="monospace" font-size="9" font-weight="800" fill="#f8fafc" text-anchor="middle">100μF</text>
    <!-- Ceramic Discs -->
    <line x1="215" y1="110" x2="215" y2="174" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
    <line x1="233" y1="110" x2="233" y2="174" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
    <circle cx="224" cy="88" r="24" fill="#d97706" stroke="#b45309" stroke-width="1.5"/>
    <text x="224" y="92" font-family="monospace" font-size="11" font-weight="900" fill="#451a03" text-anchor="middle">104</text>
    <line x1="265" y1="118" x2="265" y2="174" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
    <line x1="281" y1="118" x2="281" y2="174" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
    <circle cx="273" cy="98" r="20" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>
    <text x="273" y="102" font-family="monospace" font-size="10" font-weight="900" fill="#451a03" text-anchor="middle">22p</text>
  </g>
</svg>`);

const createLedSvg = () => toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
  <defs>
    <filter id="s3"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.25"/></filter>
  </defs>
  <g filter="url(#s3)">
    ${[
      { x: 58, body: '#ef4444', rim: '#b91c1c', glow: '#fca5a5' },
      { x: 126, body: '#22c55e', rim: '#15803d', glow: '#86efac' },
      { x: 194, body: '#eab308', rim: '#a16207', glow: '#fde047' },
      { x: 262, body: '#3b82f6', rim: '#1d4ed8', glow: '#93c5fd' }
    ].map(l => `
      <line x1="${l.x-8}" y1="116" x2="${l.x-8}" y2="180" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>
      <line x1="${l.x+8}" y1="116" x2="${l.x+8}" y2="168" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>
      <rect x="${l.x-20}" y="106" width="40" height="12" rx="3" fill="${l.rim}"/>
      <path d="M${l.x-17} 106 L${l.x-17} 56 A17 17 0 0 1 ${l.x+17} 56 L${l.x+17} 106 Z" fill="${l.body}"/>
      <path d="M${l.x-11} 58 Q${l.x-6} 46 ${l.x-1} 47 Q${l.x-6} 59 ${l.x-11} 82 Z" fill="#ffffff" opacity="0.7"/>
      <circle cx="${l.x}" cy="76" r="6" fill="${l.glow}" opacity="0.5"/>
    `).join('')}
  </g>
</svg>`);

const createDiodeSvg = () => toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
  <defs><filter id="s4"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#0f172a" flood-opacity="0.3"/></filter></defs>
  <g filter="url(#s4)">
    ${[48, 98, 148].map((y, idx) => `
      <line x1="28" y1="${y}" x2="292" y2="${y}" stroke="#cbd5e1" stroke-width="4.5" stroke-linecap="round"/>
      <rect x="96" y="${y-15}" width="128" height="30" rx="5" fill="#18181b" stroke="#334155" stroke-width="1"/>
      <rect x="196" y="${y-15}" width="16" height="30" fill="#cbd5e1"/>
      <rect x="100" y="${y-12}" width="94" height="4" fill="#ffffff" opacity="0.15"/>
      <text x="148" y="${y+4}" font-family="monospace" font-size="11" font-weight="800" fill="#e2e8f0" text-anchor="middle">${idx===2?'1N5819':'1N4007'}</text>
    `).join('')}
  </g>
</svg>`);

const createTransistorSvg = () => toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
  <defs><filter id="s5"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.28"/></filter></defs>
  <g filter="url(#s5)">
    ${[
      { x: 92, label: '2N2222' },
      { x: 224, label: 'BC547' }
    ].map(t => `
      <line x1="${t.x-18}" y1="108" x2="${t.x-24}" y2="178" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>
      <line x1="${t.x}" y1="108" x2="${t.x}" y2="178" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>
      <line x1="${t.x+18}" y1="108" x2="${t.x+24}" y2="178" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>
      <path d="M${t.x-34} 102 A34 34 0 0 1 ${t.x+34} 102 Z" fill="#1e293b"/>
      <rect x="${t.x-34}" y="52" width="68" height="60" rx="6" fill="#0f172a" stroke="#334155"/>
      <text x="${t.x}" y="86" font-family="monospace" font-size="11" font-weight="800" fill="#f8fafc" text-anchor="middle">${t.label}</text>
    `).join('')}
  </g>
</svg>`);

const createIcSvg = () => toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
  <defs><filter id="s6"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.3"/></filter></defs>
  <g filter="url(#s6)" transform="translate(40, 32)">
    ${[14,32,50,68,86,104,122,140,158,176,194,212].map(x => `
      <rect x="${x}" y="0" width="7" height="16" rx="1" fill="#cbd5e1"/>
      <rect x="${x}" y="96" width="7" height="16" rx="1" fill="#cbd5e1"/>
    `).join('')}
    <rect x="0" y="14" width="240" height="84" rx="6" fill="#0f172a" stroke="#334155" stroke-width="2"/>
    <circle cx="16" cy="56" r="7" fill="#334155"/>
    <text x="124" y="54" font-family="monospace" font-size="14" font-weight="900" fill="#f1f5f9" text-anchor="middle">ATMEGA328P / NE555</text>
    <text x="124" y="72" font-family="monospace" font-size="9" font-weight="700" fill="#94a3b8" text-anchor="middle">DUAL IN-LINE PACKAGE (DIP)</text>
  </g>
</svg>`);

const createArduinoSvg = () => toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
  <defs><filter id="s7"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.3"/></filter></defs>
  <g filter="url(#s7)" transform="translate(26, 22)">
    <rect width="268" height="156" rx="8" fill="#00878F" stroke="#00666c" stroke-width="2"/>
    <rect x="-4" y="22" width="42" height="36" rx="3" fill="#cbd5e1" stroke="#475569" stroke-width="1.5"/>
    <rect x="-4" y="102" width="44" height="36" rx="3" fill="#0f172a"/>
    <circle cx="56" cy="24" r="6" fill="#ef4444" stroke="#ffffff" stroke-width="1.5"/>
    <rect x="92" y="88" width="116" height="28" rx="3" fill="#0f172a" stroke="#334155"/>
    <text x="150" y="106" font-family="monospace" font-size="9" font-weight="800" fill="#e2e8f0" text-anchor="middle">ATMEGA328P-PU</text>
    <rect x="88" y="8" width="150" height="13" rx="2" fill="#09090b"/>
    <rect x="88" y="135" width="150" height="13" rx="2" fill="#09090b"/>
    <text x="165" y="54" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="#ffffff">ARDUINO</text>
    <text x="165" y="70" font-family="monospace" font-size="11" font-weight="800" fill="#a7f3d0">UNO R3</text>
    <circle cx="246" cy="48" r="5" fill="#fbbf24"/>
    <circle cx="246" cy="64" r="5" fill="#22c55e"/>
  </g>
</svg>`);

const createEsp32Svg = () => toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
  <defs><filter id="s8"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.3"/></filter></defs>
  <g filter="url(#s8)" transform="translate(46, 18)">
    <rect width="228" height="164" rx="8" fill="#0f172a" stroke="#334155" stroke-width="2"/>
    <rect x="82" y="-4" width="64" height="22" rx="3" fill="#cbd5e1" stroke="#64748b"/>
    <rect x="44" y="34" width="140" height="82" rx="5" fill="#cbd5e1" stroke="#64748b" stroke-width="1.5"/>
    <text x="114" y="70" font-family="monospace" font-size="13" font-weight="900" fill="#0f172a" text-anchor="middle">ESP-WROOM-32</text>
    <text x="114" y="90" font-family="monospace" font-size="10" font-weight="700" fill="#334155" text-anchor="middle">Wi-Fi + BLE</text>
    <path d="M56 132 L80 132 L80 144 L104 144 L104 132 L128 132 L128 144 L152 144 L152 132 L172 132" stroke="#f59e0b" stroke-width="3" fill="none"/>
    ${[24,38,52,66,80,94,108,122,136].map(y => `
      <circle cx="14" cy="${y}" r="4" fill="#fbbf24"/><circle cx="214" cy="${y}" r="4" fill="#fbbf24"/>
    `).join('')}
  </g>
</svg>`);

const createRpiSvg = () => toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
  <defs><filter id="s9"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.3"/></filter></defs>
  <g filter="url(#s9)" transform="translate(26, 20)">
    <rect width="268" height="160" rx="8" fill="#15803d" stroke="#166534" stroke-width="2"/>
    <rect x="205" y="18" width="66" height="38" rx="3" fill="#cbd5e1" stroke="#475569"/>
    <rect x="205" y="64" width="66" height="36" rx="3" fill="#3b82f6" stroke="#1d4ed8"/>
    <rect x="205" y="108" width="66" height="36" rx="3" fill="#cbd5e1" stroke="#475569"/>
    <rect x="86" y="56" width="60" height="60" rx="4" fill="#0f172a" stroke="#475569"/>
    <text x="116" y="89" font-family="monospace" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">BCM2711</text>
    <rect x="24" y="10" width="150" height="16" rx="2" fill="#09090b"/>
    <line x1="30" y1="18" x2="168" y2="18" stroke="#fbbf24" stroke-width="4" stroke-dasharray="4,4"/>
  </g>
</svg>`);

const createUltrasonicSvg = () => toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
  <defs>
    <radialGradient id="mesh" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#334155"/><stop offset="100%" stop-color="#09090b"/></radialGradient>
    <filter id="s10"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.32"/></filter>
  </defs>
  <g filter="url(#s10)" transform="translate(26, 30)">
    <rect width="268" height="122" rx="10" fill="#1d4ed8" stroke="#60a5fa" stroke-width="2"/>
    <circle cx="74" cy="61" r="44" fill="#cbd5e1" stroke="#64748b" stroke-width="3"/>
    <circle cx="74" cy="61" r="32" fill="url(#mesh)"/>
    <circle cx="194" cy="61" r="44" fill="#cbd5e1" stroke="#64748b" stroke-width="3"/>
    <circle cx="194" cy="61" r="32" fill="url(#mesh)"/>
    <rect x="112" y="114" width="44" height="32" rx="2" fill="#09090b"/>
    ${[120,129,138,147].map(x => `<rect x="${x}" y="140" width="4" height="18" fill="#cbd5e1"/>`).join('')}
    <rect x="118" y="14" width="32" height="14" rx="3" fill="#e2e8f0"/>
    <text x="134" y="98" font-family="monospace" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">HC-SR04</text>
  </g>
</svg>`);

const createIrSensorSvg = () => toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
  <defs><filter id="s11"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.3"/></filter></defs>
  <g filter="url(#s11)" transform="translate(36, 40)">
    <rect x="36" y="10" width="210" height="100" rx="8" fill="#0f172a" stroke="#334155" stroke-width="2"/>
    <circle cx="24" cy="40" r="16" fill="#38bdf8" stroke="#0284c7" stroke-width="2"/>
    <circle cx="24" cy="80" r="16" fill="#18181b" stroke="#475569" stroke-width="2"/>
    <rect x="102" y="40" width="36" height="36" rx="4" fill="#2563eb" stroke="#60a5fa"/>
    <circle cx="120" cy="58" r="9" fill="#e2e8f0"/>
    <line x1="114" y1="58" x2="126" y2="58" stroke="#334155" stroke-width="2.5"/>
    <rect x="158" y="42" width="32" height="32" rx="3" fill="#1e293b" stroke="#475569"/>
    <rect x="234" y="42" width="24" height="32" fill="#cbd5e1"/>
  </g>
</svg>`);

const createTempSensorSvg = () => toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
  <defs><filter id="s12"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.3"/></filter></defs>
  <g filter="url(#s12)">
    ${[122, 160, 198].map(x => `<line x1="${x}" y1="110" x2="${x}" y2="180" stroke="#94a3b8" stroke-width="5" stroke-linecap="round"/>`).join('')}
    <rect x="108" y="32" width="104" height="84" rx="10" fill="#0f172a" stroke="#334155" stroke-width="2"/>
    <text x="160" y="74" font-family="monospace" font-size="16" font-weight="900" fill="#f8fafc" text-anchor="middle">LM35DZ</text>
    <text x="160" y="94" font-family="monospace" font-size="10" font-weight="700" fill="#38bdf8" text-anchor="middle">TEMP SENSOR</text>
  </g>
</svg>`);

const createHumiditySensorSvg = () => toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
  <defs><filter id="s13"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.3"/></filter></defs>
  <g filter="url(#s13)" transform="translate(88, 18)">
    <rect width="144" height="128" rx="10" fill="#0284c7" stroke="#38bdf8" stroke-width="2"/>
    <g fill="#0c4a6e">
      ${[34,60,86,112].map(x => [32,58,84].map(y => `<rect x="${x-6}" y="${y-6}" width="12" height="12" rx="2"/>`).join('')).join('')}
    </g>
    ${[36,60,84,108].map(x => `<line x1="${x}" y1="128" x2="${x}" y2="168" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round"/>`).join('')}
    <text x="72" y="114" font-family="monospace" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">DHT11</text>
  </g>
</svg>`);

const createDcMotorSvg = () => toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
  <defs><filter id="s14"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.3"/></filter></defs>
  <g filter="url(#s14)" transform="translate(40, 36)">
    <rect x="20" y="34" width="84" height="58" rx="8" fill="#cbd5e1" stroke="#64748b" stroke-width="2"/>
    <rect x="98" y="16" width="144" height="94" rx="12" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
    <circle cx="195" cy="63" r="24" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
    <rect x="187" y="42" width="16" height="42" rx="3" fill="#e2e8f0"/>
    <path d="M20 50 Q0 42 -12 72" stroke="#dc2626" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M20 74 Q0 88 -12 108" stroke="#0f172a" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>
</svg>`);

const createServoMotorSvg = () => toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
  <defs><filter id="s15"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.3"/></filter></defs>
  <g filter="url(#s15)" transform="translate(56, 26)">
    <rect x="44" y="48" width="114" height="92" rx="8" fill="#0284c7" stroke="#38bdf8" stroke-width="2"/>
    <rect x="20" y="66" width="162" height="16" rx="3" fill="#0369a1"/>
    <rect x="64" y="24" width="72" height="26" rx="4" fill="#0284c7"/>
    <circle cx="96" cy="24" r="18" fill="#0284c7"/>
    <circle cx="96" cy="24" r="10" fill="#ffffff"/>
    <path d="M96 14 L166 8 A10 10 0 0 1 166 34 L96 32 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="101" y="114" font-family="system-ui, sans-serif" font-size="13" font-weight="900" fill="#e0f2fe" text-anchor="middle">SG90</text>
  </g>
</svg>`);

const createStepperMotorSvg = () => toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
  <defs><filter id="s16"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.3"/></filter></defs>
  <g filter="url(#s16)" transform="translate(76, 18)">
    <rect x="14" y="48" width="140" height="22" rx="4" fill="#94a3b8"/>
    <circle cx="84" cy="70" r="56" fill="#cbd5e1" stroke="#475569" stroke-width="3"/>
    <circle cx="84" cy="70" r="34" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
    <rect x="78" y="4" width="12" height="44" rx="2" fill="#d97706"/>
    <path d="M74 126 L74 166 M84 126 L84 166 M94 126 L94 166" stroke="#3b82f6" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>`);

const createWiresSvg = () => toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
  <defs><filter id="s17"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#0f172a" flood-opacity="0.28"/></filter></defs>
  <g filter="url(#s17)" transform="translate(20, 26)">
    ${[
      { y: 12, c: '#ef4444' },
      { y: 34, c: '#f97316' },
      { y: 56, c: '#eab308' },
      { y: 78, c: '#22c55e' },
      { y: 100, c: '#3b82f6' },
      { y: 122, c: '#a855f7' }
    ].map(w => `
      <rect x="14" y="${w.y}" width="30" height="12" rx="2" fill="#18181b"/>
      <rect x="236" y="${w.y}" width="30" height="12" rx="2" fill="#18181b"/>
      <path d="M44 ${w.y+6} C110 ${w.y-16}, 170 ${w.y+28}, 236 ${w.y+6}" stroke="${w.c}" stroke-width="6.5" fill="none"/>
    `).join('')}
  </g>
</svg>`);

const createUsbCableSvg = () => toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
  <defs><filter id="s18"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.3"/></filter></defs>
  <g filter="url(#s18)" transform="translate(30, 34)">
    <rect x="10" y="42" width="46" height="32" rx="3" fill="#cbd5e1" stroke="#475569" stroke-width="2"/>
    <rect x="46" y="34" width="42" height="48" rx="5" fill="#0f172a"/>
    <path d="M88 58 C135 96, 155 18, 200 58" stroke="#1e293b" stroke-width="11" fill="none" stroke-linecap="round"/>
    <rect x="194" y="36" width="40" height="44" rx="5" fill="#0f172a"/>
    <rect x="234" y="44" width="24" height="28" rx="4" fill="#cbd5e1" stroke="#475569" stroke-width="2"/>
  </g>
</svg>`);

const createPowerCableSvg = () => toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
  <defs><filter id="s19"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.3"/></filter></defs>
  <g filter="url(#s19)" transform="translate(30, 40)">
    <rect x="14" y="30" width="54" height="44" rx="6" fill="#eab308" stroke="#a16207" stroke-width="2"/>
    <path d="M68 42 C118 68, 146 18, 198 42" stroke="#dc2626" stroke-width="9" fill="none"/>
    <path d="M68 62 C118 88, 146 38, 198 62" stroke="#0f172a" stroke-width="9" fill="none"/>
    <rect x="196" y="34" width="32" height="34" rx="4" fill="#0f172a"/>
    <rect x="228" y="42" width="24" height="18" rx="2" fill="#cbd5e1"/>
  </g>
</svg>`);

const createMultimeterSvg = () => toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
  <defs><filter id="s20"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.3"/></filter></defs>
  <g filter="url(#s20)" transform="translate(96, 12)">
    <rect width="128" height="176" rx="16" fill="#eab308" stroke="#a16207" stroke-width="2.5"/>
    <rect x="12" y="12" width="104" height="152" rx="10" fill="#1e293b"/>
    <rect x="20" y="22" width="88" height="40" rx="5" fill="#99f6e4"/>
    <text x="64" y="49" font-family="monospace" font-size="18" font-weight="900" fill="#042f2e" text-anchor="middle">12.0 V</text>
    <circle cx="64" cy="102" r="26" fill="#0f172a" stroke="#475569" stroke-width="2"/>
    <line x1="64" y1="102" x2="64" y2="80" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
    <circle cx="40" cy="144" r="6" fill="#dc2626"/>
    <circle cx="88" cy="144" r="6" fill="#09090b"/>
  </g>
</svg>`);

const createToolsSvg = () => toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
  <defs><filter id="s21"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.3"/></filter></defs>
  <g filter="url(#s21)" transform="translate(46, 20)">
    <!-- Red Wire Cutter -->
    <path d="M36 144 L76 48 L92 48 L56 144 Z" fill="#dc2626"/>
    <path d="M116 144 L76 48 L60 48 L96 144 Z" fill="#dc2626"/>
    <path d="M62 50 L76 12 L90 50 Z" fill="#cbd5e1" stroke="#475569"/>
    <!-- Blue Screwdriver -->
    <rect x="164" y="76" width="24" height="72" rx="8" fill="#2563eb"/>
    <rect x="172" y="16" width="8" height="62" fill="#cbd5e1"/>
  </g>
</svg>`);

const createBreadboardSvg = () => toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
  <defs><filter id="s22"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.28"/></filter></defs>
  <g filter="url(#s22)" transform="translate(22, 34)">
    <rect width="276" height="128" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    <line x1="18" y1="16" x2="258" y2="16" stroke="#ef4444" stroke-width="2.5"/>
    <line x1="18" y1="26" x2="258" y2="26" stroke="#3b82f6" stroke-width="2.5"/>
    <rect x="14" y="60" width="248" height="8" rx="2" fill="#e2e8f0"/>
    <line x1="18" y1="102" x2="258" y2="102" stroke="#3b82f6" stroke-width="2.5"/>
    <line x1="18" y1="112" x2="258" y2="112" stroke="#ef4444" stroke-width="2.5"/>
    <g fill="#475569">
      ${[30,50,70,90,110,130,150,170,190,210,230,248].map(x =>
        [40,50,78,88].map(y => `<circle cx="${x}" cy="${y}" r="2.2"/>`).join('')
      ).join('')}
    </g>
  </g>
</svg>`);

const createPcbSvg = () => toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
  <defs><filter id="s23"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.3"/></filter></defs>
  <g filter="url(#s23)" transform="translate(42, 28)">
    <rect width="236" height="142" rx="8" fill="#15803d" stroke="#166534" stroke-width="2"/>
    <circle cx="16" cy="16" r="6" fill="#fbbf24"/>
    <circle cx="220" cy="16" r="6" fill="#fbbf24"/>
    <circle cx="16" cy="126" r="6" fill="#fbbf24"/>
    <circle cx="220" cy="126" r="6" fill="#fbbf24"/>
    <path d="M44 46 L104 46 L128 76 L192 76" stroke="#facc15" stroke-width="3" fill="none"/>
    <path d="M44 82 L84 82 L108 112 L176 112" stroke="#facc15" stroke-width="3" fill="none"/>
    <g fill="#facc15">
      ${[60,90,120,150,180].map(x => `<circle cx="${x}" cy="32" r="3"/><circle cx="${x}" cy="112" r="3"/>`).join('')}
    </g>
  </g>
</svg>`);

const createProjectKitSvg = () => toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" height="100%">
  <defs><filter id="s24"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.28"/></filter></defs>
  <g filter="url(#s24)" transform="translate(46, 24)">
    <rect width="228" height="148" rx="12" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>
    <rect x="76" y="-12" width="76" height="16" rx="4" fill="#2563eb"/>
    <rect x="14" y="18" width="60" height="50" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
    <rect x="84" y="18" width="60" height="50" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
    <rect x="154" y="18" width="60" height="50" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
    <rect x="14" y="78" width="96" height="54" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
    <rect x="120" y="78" width="94" height="54" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
    <circle cx="44" cy="43" r="10" fill="#ef4444"/><circle cx="114" cy="43" r="10" fill="#00878F"/>
    <circle cx="184" cy="43" r="10" fill="#eab308"/><rect x="34" y="94" width="54" height="22" rx="3" fill="#1d4ed8"/>
    <rect x="140" y="94" width="54" height="22" rx="3" fill="#15803d"/>
  </g>
</svg>`);

const buildComp = (cfg) => ({
  ...cfg,
  photoUrl: cfg.graphic(),
  fallbackSvg: cfg.graphic()
});

export const ALMIRAH_COMPONENTS = [
  // 1. BASIC ELECTRONICS
  buildComp({
    key: 'resistors',
    label: 'Resistors',
    category: 'Basic Electronics',
    matchedDbName: 'Resistors',
    shelfIndex: 1,
    name: 'Resistors (1kΩ, 220Ω, 10kΩ)',
    whatItDoes: 'Limits the flow of electric current.',
    availableStock: 50,
    totalStock: 50,
    unit: 'pcs',
    graphic: createResistorSvg
  }),
  buildComp({
    key: 'capacitors',
    label: 'Capacitors',
    category: 'Basic Electronics',
    matchedDbName: 'Capacitor',
    shelfIndex: 1,
    name: 'Capacitors Assortment',
    whatItDoes: 'Stores and releases electrical energy.',
    availableStock: 45,
    totalStock: 50,
    unit: 'pcs',
    graphic: createCapacitorSvg
  }),
  buildComp({
    key: 'leds',
    label: 'LEDs',
    category: 'Basic Electronics',
    matchedDbName: 'LED',
    shelfIndex: 1,
    name: 'Diffused LEDs (Red/Green/Blue)',
    whatItDoes: 'Produces light when current flows through it.',
    availableStock: 30,
    totalStock: 30,
    unit: 'pcs',
    graphic: createLedSvg
  }),

  // 2. SEMICONDUCTORS
  buildComp({
    key: 'diodes',
    label: 'Diodes',
    category: 'Semiconductors',
    matchedDbName: 'Diode',
    shelfIndex: 2,
    name: '1N4007 Rectifier Diodes',
    whatItDoes: 'Allows electric current to flow in only one direction.',
    availableStock: 60,
    totalStock: 60,
    unit: 'pcs',
    graphic: createDiodeSvg
  }),
  buildComp({
    key: 'transistors',
    label: 'Transistors',
    category: 'Semiconductors',
    matchedDbName: 'Transistor',
    shelfIndex: 2,
    name: '2N2222 NPN Transistors',
    whatItDoes: 'Amplifies or switches electrical signals and power.',
    availableStock: 40,
    totalStock: 40,
    unit: 'pcs',
    graphic: createTransistorSvg
  }),
  buildComp({
    key: 'ics',
    label: 'ICs',
    category: 'Semiconductors',
    matchedDbName: 'Integrated Circuits',
    shelfIndex: 2,
    name: 'NE555 & ATmega328P ICs',
    whatItDoes: 'Performs complex processing and timing operations on a single microchip.',
    availableStock: 18,
    totalStock: 20,
    unit: 'pcs',
    graphic: createIcSvg
  }),

  // 3. MICROCONTROLLERS
  buildComp({
    key: 'arduino',
    label: 'Arduino Uno',
    category: 'Microcontrollers',
    matchedDbName: 'Arduino Uno',
    shelfIndex: 3,
    name: 'Arduino Uno R3 Board',
    whatItDoes: 'Controls electronic components according to programmed instructions.',
    availableStock: 5,
    totalStock: 5,
    unit: 'pcs',
    graphic: createArduinoSvg
  }),
  buildComp({
    key: 'esp32',
    label: 'ESP32',
    category: 'Microcontrollers',
    matchedDbName: 'ESP32',
    shelfIndex: 3,
    name: 'ESP32 Wi-Fi & BLE Board',
    whatItDoes: 'Provides high-speed Wi-Fi and Bluetooth processing for smart IoT projects.',
    availableStock: 7,
    totalStock: 7,
    unit: 'pcs',
    graphic: createEsp32Svg
  }),
  buildComp({
    key: 'rpi',
    label: 'Raspberry Pi',
    category: 'Microcontrollers',
    matchedDbName: 'Raspberry Pi',
    shelfIndex: 3,
    name: 'Raspberry Pi 4 Model B',
    whatItDoes: 'Runs a full Linux computer operating system for advanced robotics and vision.',
    availableStock: 4,
    totalStock: 4,
    unit: 'pcs',
    graphic: createRpiSvg
  }),

  // 4. SENSORS
  buildComp({
    key: 'ultrasonic',
    label: 'Ultrasonic Sensor',
    category: 'Sensors',
    matchedDbName: 'Ultrasonic Sensor',
    shelfIndex: 4,
    name: 'HC-SR04 Ultrasonic Sensor',
    whatItDoes: 'Measures distance using ultrasonic sound waves.',
    availableStock: 10,
    totalStock: 10,
    unit: 'pcs',
    graphic: createUltrasonicSvg
  }),
  buildComp({
    key: 'irsensor',
    label: 'IR Sensor',
    category: 'Sensors',
    matchedDbName: 'IR Sensor',
    shelfIndex: 4,
    name: 'Infrared Proximity & Line Sensor',
    whatItDoes: 'Detects nearby obstacles and tracks lines using infrared light.',
    availableStock: 15,
    totalStock: 15,
    unit: 'pcs',
    graphic: createIrSensorSvg
  }),
  buildComp({
    key: 'tempsensor',
    label: 'Temperature Sensor',
    category: 'Sensors',
    matchedDbName: 'Temperature Sensor',
    shelfIndex: 4,
    name: 'LM35 Precision Temp Sensor',
    whatItDoes: 'Measures ambient temperature changes.',
    availableStock: 12,
    totalStock: 12,
    unit: 'pcs',
    graphic: createTempSensorSvg
  }),
  buildComp({
    key: 'humiditysensor',
    label: 'Humidity Sensor',
    category: 'Sensors',
    matchedDbName: 'Humidity Sensor',
    shelfIndex: 4,
    name: 'DHT11 / DHT22 Humidity Sensor',
    whatItDoes: 'Measures moisture and humidity levels in the surrounding air.',
    availableStock: 10,
    totalStock: 10,
    unit: 'pcs',
    graphic: createHumiditySensorSvg
  }),

  // 5. MOTORS
  buildComp({
    key: 'dcmotor',
    label: 'DC Motor',
    category: 'Motors',
    matchedDbName: 'DC Motor',
    shelfIndex: 5,
    name: 'TT Gearbox DC Motor (3-6V)',
    whatItDoes: 'Converts electrical energy into continuous rotational mechanical motion.',
    availableStock: 14,
    totalStock: 16,
    unit: 'pcs',
    graphic: createDcMotorSvg
  }),
  buildComp({
    key: 'servomotor',
    label: 'Servo Motor',
    category: 'Motors',
    matchedDbName: 'Servo Motor',
    shelfIndex: 5,
    name: 'TowerPro SG90 Servo Motor',
    whatItDoes: 'Controls angular position.',
    availableStock: 6,
    totalStock: 6,
    unit: 'pcs',
    graphic: createServoMotorSvg
  }),
  buildComp({
    key: 'steppermotor',
    label: 'Stepper Motor',
    category: 'Motors',
    matchedDbName: 'Stepper Motor',
    shelfIndex: 5,
    name: '28BYJ-48 5V Stepper Motor',
    whatItDoes: 'Rotates in precise, repeatable step increments for precision positioning.',
    availableStock: 8,
    totalStock: 8,
    unit: 'pcs',
    graphic: createStepperMotorSvg
  }),

  // 6. CABLES
  buildComp({
    key: 'jumperwires',
    label: 'Jumper Wires',
    category: 'Cables',
    matchedDbName: 'Jumper Wires',
    shelfIndex: 6,
    name: 'DuPont Jumper Wires Ribbon',
    whatItDoes: 'Connects components and pins on breadboards without soldering.',
    availableStock: 20,
    totalStock: 20,
    unit: 'packs',
    graphic: createWiresSvg
  }),
  buildComp({
    key: 'usbcables',
    label: 'USB Cables',
    category: 'Cables',
    matchedDbName: 'USB Cables',
    shelfIndex: 6,
    name: 'USB-A to Type-B & Type-C Cable',
    whatItDoes: 'Transfers data and supplies power between computers and microcontrollers.',
    availableStock: 25,
    totalStock: 25,
    unit: 'pcs',
    graphic: createUsbCableSvg
  }),
  buildComp({
    key: 'powercables',
    label: 'Power Cables',
    category: 'Cables',
    matchedDbName: 'Power Cables',
    shelfIndex: 6,
    name: 'XT60 & DC Barrel Power Cables',
    whatItDoes: 'Transmits high-current electrical power from battery packs to robot circuits.',
    availableStock: 20,
    totalStock: 20,
    unit: 'pcs',
    graphic: createPowerCableSvg
  }),

  // 7. EQUIPMENT & TOOLS
  buildComp({
    key: 'multimeter',
    label: 'Multimeter',
    category: 'Equipment',
    matchedDbName: 'Multimeter',
    shelfIndex: 7,
    name: 'Digital Handheld Multimeter',
    whatItDoes: 'Measures electrical voltage, current, and circuit resistance.',
    availableStock: 6,
    totalStock: 6,
    unit: 'pcs',
    graphic: createMultimeterSvg
  }),
  buildComp({
    key: 'electronictools',
    label: 'Electronic Tools',
    category: 'Equipment',
    matchedDbName: 'Electronic Tools',
    shelfIndex: 7,
    name: 'Hardware Assembly Tools Kit',
    whatItDoes: 'Provides wire strippers, cutters, tweezers, and screwdrivers for hardware assembly.',
    availableStock: 5,
    totalStock: 5,
    unit: 'sets',
    graphic: createToolsSvg
  }),
  buildComp({
    key: 'breadboards',
    label: 'Breadboards',
    category: 'Equipment',
    matchedDbName: 'Breadboard',
    shelfIndex: 7,
    name: '830-Point Solderless Breadboard',
    whatItDoes: 'Enables rapid solderless prototyping and temporary circuit construction.',
    availableStock: 12,
    totalStock: 12,
    unit: 'pcs',
    graphic: createBreadboardSvg
  }),
  buildComp({
    key: 'pcbs',
    label: 'PCBs',
    category: 'Equipment',
    matchedDbName: 'PCBs',
    shelfIndex: 7,
    name: 'Prototyping Copper PCBs',
    whatItDoes: 'Mechanically supports and electrically connects components using conductive copper tracks.',
    availableStock: 35,
    totalStock: 35,
    unit: 'pcs',
    graphic: createPcbSvg
  }),
  buildComp({
    key: 'projectkits',
    label: 'Project Kits',
    category: 'Equipment',
    matchedDbName: 'Project Kits',
    shelfIndex: 7,
    name: 'Robotics Starter Kit Box',
    whatItDoes: 'Comprehensive bundle of essential robotics parts and modules for fast prototyping.',
    availableStock: 8,
    totalStock: 8,
    unit: 'kits',
    graphic: createProjectKitSvg
  })
];

export const getDefaultGraphicForCategory = (category = '') => {
  const cat = category.toLowerCase();
  if (cat.includes('sensor')) return createUltrasonicSvg();
  if (cat.includes('microcontroller')) return createArduinoSvg();
  if (cat.includes('motor') || cat.includes('actuator')) return createServoMotorSvg();
  if (cat.includes('cable') || cat.includes('wire')) return createWiresSvg();
  if (cat.includes('semi')) return createIcSvg();
  if (cat.includes('basic') || cat.includes('passive')) return createResistorSvg();
  return createProjectKitSvg();
};

export const DEMO_SENIORS = [
  {
    id: 'usr_3f92szsxk',
    name: 'Aryan Sharma',
    role: 'Senior Approver & Tech Lead',
    phone: '+91 98765 43210',
    email: 'aryan@robotics.club',
    department: 'Electronics & Communication, Final Year',
    room: 'Robotics Lab 304, Electronics Wing',
    status: 'Available for approval reviews'
  },
  {
    id: 'usr_m999fdko0',
    name: 'Dr. Rajesh Verma',
    role: 'Inventory Manager & Faculty Head',
    phone: '+91 98765 67890',
    email: 'manager@robotics.club',
    department: 'Robotics Lab Operations',
    room: 'Lab 304 Office, Mechatronics Dept',
    status: 'On duty (Lab checkouts open)'
  },
  {
    id: 'usr_1c1tjrdvp',
    name: 'Prof. Ananya Iyer',
    role: 'Administrator & Club Patron',
    phone: '+91 98765 99999',
    email: 'admin@robotics.club',
    department: 'Department of Mechatronics',
    room: 'Faculty Block A, Room 204',
    status: 'Club Advisor sign-offs'
  }
];

export const DEMO_PROJECTS = [
  'RoboWars 15kg Combat Bot "Titan"',
  'Autonomous Maze Solver & Line Follower',
  'Autonomous Quadcopter Drone Navigation',
  'IoT Smart Lab Telemetry & Environment Station',
  'Robotic Arm 6-DOF Inverse Kinematics'
];
