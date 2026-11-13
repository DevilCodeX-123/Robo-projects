import bcrypt from 'bcryptjs';
import { isMongoConnected, localStore, saveLocalStore, connectDB } from '../config/db.js';
import UserModel from '../models/User.js';
import ComponentModel from '../models/Component.js';
import RequestModel from '../models/Request.js';
import InventoryTransactionModel from '../models/InventoryTransaction.js';
import ProjectModel from '../models/Project.js';
import MaintenanceTicketModel from '../models/MaintenanceTicket.js';
import NotificationModel from '../models/Notification.js';
import AuditLogModel from '../models/AuditLog.js';

// Realistic component illustrations (high fidelity vector SVGs converted to data URIs)
const createComponentSvg = (name, primaryColor, accentColor, iconSvg) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
    <defs>
      <linearGradient id="bg_${name.replace(/\W/g, '')}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#f8fafc"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.08"/>
      </filter>
    </defs>
    <rect width="400" height="300" fill="url(#bg_${name.replace(/\W/g, '')})"/>
    <rect x="20" y="20" width="360" height="260" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
    <g filter="url(#shadow)" transform="translate(100, 50)">
      <rect width="200" height="150" rx="12" fill="${primaryColor}"/>
      <rect x="15" y="15" width="170" height="120" rx="8" fill="${accentColor}" opacity="0.85"/>
      ${iconSvg}
    </g>
    <text x="200" y="245" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#334155" text-anchor="middle">${name}</text>
    <text x="200" y="265" font-family="system-ui, sans-serif" font-size="11" fill="#64748b" text-anchor="middle">Lab Tested &bull; Genuine Component</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const arduinoSvg = createComponentSvg(
  'Arduino Uno',
  '#00878F',
  '#006468',
  `<rect x="30" y="30" width="30" height="40" rx="3" fill="#cbd5e1"/>
   <rect x="35" y="35" width="20" height="30" rx="2" fill="#94a3b8"/>
   <circle cx="150" cy="50" r="14" fill="#0f172a"/>
   <rect x="70" y="70" width="80" height="25" rx="3" fill="#0f172a"/>
   <text x="110" y="87" fill="#ffffff" font-size="10" font-family="monospace" text-anchor="middle">ATMEGA328P</text>
   <line x1="30" y1="120" x2="170" y2="120" stroke="#fbbf24" stroke-width="4" stroke-dasharray="6,4"/>`
);

const ultrasonicSvg = createComponentSvg(
  'Ultrasonic Sensor',
  '#1e40af',
  '#1d4ed8',
  `<circle cx="65" cy="75" r="32" fill="#cbd5e1" stroke="#475569" stroke-width="3"/>
   <circle cx="65" cy="75" r="22" fill="#1e293b"/>
   <circle cx="65" cy="75" r="12" fill="#94a3b8"/>
   <circle cx="135" cy="75" r="32" fill="#cbd5e1" stroke="#475569" stroke-width="3"/>
   <circle cx="135" cy="75" r="22" fill="#1e293b"/>
   <circle cx="135" cy="75" r="12" fill="#94a3b8"/>
   <rect x="85" y="115" width="30" height="20" fill="#94a3b8" rx="2"/>`
);

const dht11Svg = createComponentSvg(
  'DHT11 Sensor',
  '#0284c7',
  '#0369a1',
  `<rect x="50" y="30" width="100" height="90" rx="8" fill="#38bdf8"/>
   <circle cx="75" cy="55" r="4" fill="#0369a1"/>
   <circle cx="100" cy="55" r="4" fill="#0369a1"/>
   <circle cx="125" cy="55" r="4" fill="#0369a1"/>
   <circle cx="75" cy="75" r="4" fill="#0369a1"/>
   <circle cx="100" cy="75" r="4" fill="#0369a1"/>
   <circle cx="125" cy="75" r="4" fill="#0369a1"/>
   <rect x="80" y="115" width="40" height="25" fill="#e2e8f0"/>`
);

const servoMotorSvg = createComponentSvg(
  'Servo Motor SG90',
  '#2563eb',
  '#1d4ed8',
  `<rect x="60" y="45" width="80" height="75" rx="6" fill="#3b82f6"/>
   <circle cx="85" cy="40" r="18" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/>
   <rect x="80" y="20" width="45" height="12" rx="4" fill="#ffffff" stroke="#94a3b8"/>
   <line x1="140" y1="100" x2="175" y2="100" stroke="#ef4444" stroke-width="4"/>
   <line x1="140" y1="106" x2="175" y2="106" stroke="#92400e" stroke-width="4"/>
   <line x1="140" y1="112" x2="175" y2="112" stroke="#f59e0b" stroke-width="4"/>`
);

const breadboardSvg = createComponentSvg(
  'Breadboard 830 Point',
  '#f8fafc',
  '#f1f5f9',
  `<rect x="25" y="30" width="150" height="90" rx="4" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
   <line x1="35" y1="45" x2="165" y2="45" stroke="#ef4444" stroke-width="2"/>
   <line x1="35" y1="52" x2="165" y2="52" stroke="#3b82f6" stroke-width="2"/>
   <circle cx="50" cy="75" r="2" fill="#64748b"/>
   <circle cx="70" cy="75" r="2" fill="#64748b"/>
   <circle cx="90" cy="75" r="2" fill="#64748b"/>
   <circle cx="110" cy="75" r="2" fill="#64748b"/>
   <circle cx="130" cy="75" r="2" fill="#64748b"/>
   <circle cx="150" cy="75" r="2" fill="#64748b"/>
   <line x1="35" y1="100" x2="165" y2="100" stroke="#3b82f6" stroke-width="2"/>
   <line x1="35" y1="107" x2="165" y2="107" stroke="#ef4444" stroke-width="2"/>`
);

const jumperWiresSvg = createComponentSvg(
  'Jumper Wires Pack',
  '#0f172a',
  '#1e293b',
  `<path d="M 40 100 C 60 20, 100 20, 120 100" stroke="#ef4444" stroke-width="5" fill="none"/>
   <path d="M 50 100 C 70 30, 110 30, 130 100" stroke="#3b82f6" stroke-width="5" fill="none"/>
   <path d="M 60 100 C 80 40, 120 40, 140 100" stroke="#eab308" stroke-width="5" fill="none"/>
   <path d="M 70 100 C 90 50, 130 50, 150 100" stroke="#10b981" stroke-width="5" fill="none"/>`
);

const resistorSvg = createComponentSvg(
  'Resistors (1kΩ)',
  '#d97706',
  '#b45309',
  `<line x1="20" y1="75" x2="180" y2="75" stroke="#94a3b8" stroke-width="3"/>
   <rect x="60" y="60" width="80" height="30" rx="10" fill="#fed7aa"/>
   <line x1="75" y1="60" x2="75" y2="90" stroke="#92400e" stroke-width="5"/>
   <line x1="90" y1="60" x2="90" y2="90" stroke="#000000" stroke-width="5"/>
   <line x1="105" y1="60" x2="105" y2="90" stroke="#dc2626" stroke-width="5"/>
   <line x1="125" y1="60" x2="125" y2="90" stroke="#d97706" stroke-width="5"/>`
);

const ledRedSvg = createComponentSvg(
  'LED (Red)',
  '#ef4444',
  '#b91c1c',
  `<ellipse cx="100" cy="65" rx="30" ry="35" fill="#f87171" stroke="#dc2626" stroke-width="2"/>
   <rect x="75" y="85" width="50" height="15" rx="4" fill="#dc2626"/>
   <line x1="90" y1="100" x2="90" y2="140" stroke="#94a3b8" stroke-width="3"/>
   <line x1="110" y1="100" x2="110" y2="130" stroke="#94a3b8" stroke-width="3"/>`
);

const esp32Svg = createComponentSvg(
  'ESP32 Dev Module',
  '#1e293b',
  '#0f172a',
  `<rect x="40" y="30" width="120" height="90" rx="6" fill="#0f172a"/>
   <rect x="60" y="45" width="50" height="40" rx="2" fill="#94a3b8"/>
   <path d="M 125 45 L 145 45 L 145 65 L 125 65 Z" fill="#e2e8f0"/>
   <line x1="45" y1="115" x2="155" y2="115" stroke="#fbbf24" stroke-width="3" stroke-dasharray="4,3"/>`
);

const l298nSvg = createComponentSvg(
  'L298N Motor Driver',
  '#dc2626',
  '#991b1b',
  `<rect x="40" y="30" width="120" height="90" rx="6" fill="#b91c1c"/>
   <rect x="70" y="35" width="60" height="45" rx="3" fill="#1e293b"/>
   <rect x="45" y="85" width="25" height="25" fill="#16a34a"/>
   <rect x="130" y="85" width="25" height="25" fill="#16a34a"/>`
);

export const seedDatabase = async () => {
  console.log('🌱 Starting comprehensive database seeding...');
  await connectDB();

  // 1. Clear existing seed data if in MongoDB or local
  if (isMongoConnected) {
    await UserModel.deleteMany({});
    await ComponentModel.deleteMany({});
    await RequestModel.deleteMany({});
    await InventoryTransactionModel.deleteMany({});
    await ProjectModel.deleteMany({});
    await MaintenanceTicketModel.deleteMany({});
    await NotificationModel.deleteMany({});
    await AuditLogModel.deleteMany({});
  } else {
    localStore.users = [];
    localStore.components = [];
    localStore.requests = [];
    localStore.transactions = [];
    localStore.projects = [];
    localStore.maintenance = [];
    localStore.notifications = [];
    localStore.auditLogs = [];
  }

  // 2. Hash default password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 3. Seed Users
  const userSeedData = [
    {
      fullName: 'Aarav Sharma',
      email: 'student@robotics.club',
      passwordHash,
      membershipId: 'ROBO-2026-042',
      department: 'Robotics & Automation',
      academicYear: '3rd Year',
      teamName: 'Combat Robotics Alpha',
      role: 'MEMBER',
      status: 'ACTIVE',
      contactNumber: '+91 98765 12345'
    },
    {
      fullName: 'Aryan Sharma',
      email: 'aryan@robotics.club',
      passwordHash,
      membershipId: 'ROBO-2025-011',
      department: 'Electronics & Communication',
      academicYear: 'Final Year',
      teamName: 'Autonomous Systems',
      role: 'SENIOR',
      status: 'ACTIVE',
      contactNumber: '+91 98765 43210'
    },
    {
      fullName: 'Dr. Rajesh Verma',
      email: 'manager@robotics.club',
      passwordHash,
      membershipId: 'LAB-MGR-002',
      department: 'Robotics Lab Operations',
      academicYear: 'Staff',
      teamName: 'Inventory & Facilities',
      role: 'INVENTORY_MANAGER',
      status: 'ACTIVE',
      contactNumber: '+91 98765 67890'
    },
    {
      fullName: 'Prof. Ananya Iyer',
      email: 'admin@robotics.club',
      passwordHash,
      membershipId: 'FAC-ADV-001',
      department: 'Department of Mechatronics',
      academicYear: 'Faculty Advisor',
      teamName: 'Club Leadership',
      role: 'ADMIN',
      status: 'ACTIVE',
      contactNumber: '+91 98765 99999'
    }
  ];

  const createdUsers = [];
  for (const u of userSeedData) {
    if (isMongoConnected) {
      const user = new UserModel(u);
      createdUsers.push(await user.save());
    } else {
      const user = { _id: 'usr_' + Math.random().toString(36).substr(2, 9), ...u, createdAt: new Date().toISOString() };
      localStore.users.push(user);
      createdUsers.push(user);
    }
  }

  const [studentUser, seniorUser, managerUser, adminUser] = createdUsers;

  // 4. Seed Components (Faithful to Reference Screenshot!)
  const componentSeedData = [
    {
      componentCode: 'CMP-MCU-001',
      name: 'Arduino Uno',
      category: 'Microcontrollers',
      description: 'Standard ATmega328P microcontroller board with 14 digital I/O pins, 6 analog inputs, 16 MHz quartz crystal, USB connection, and power jack.',
      imageUrl: arduinoSvg,
      datasheetUrl: 'https://docs.arduino.cc/resources/datasheets/A000066-datasheet.pdf',
      location: { rack: 'A', shelf: 1, box: '02', coordinates: '(A,1,02)', room: 'Robotics Lab 304' },
      totalStock: 5,
      availableStock: 5,
      reservedStock: 0,
      issuedStock: 0,
      damagedStock: 0,
      minThreshold: 3,
      unit: 'pcs',
      purchasePrice: 12.50,
      supplier: 'Arduino Official',
      isConsumable: false,
      technicalSpecs: { 'Operating Voltage': '5V', 'Input Voltage': '7-12V', 'Flash Memory': '32 KB', 'SRAM': '2 KB' }
    },
    {
      componentCode: 'CMP-SEN-001',
      name: 'Ultrasonic Sensor',
      category: 'Sensors',
      description: 'HC-SR04 ultrasonic distance sensor module providing 2cm to 400cm non-contact measurement with 3mm ranging accuracy.',
      imageUrl: ultrasonicSvg,
      datasheetUrl: 'https://cdn.sparkfun.com/datasheets/Sensors/Proximity/HCSR04.pdf',
      location: { rack: 'B', shelf: 2, box: '03', coordinates: '(B,2,03)', room: 'Robotics Lab 304' },
      totalStock: 10,
      availableStock: 10,
      reservedStock: 0,
      issuedStock: 0,
      damagedStock: 0,
      minThreshold: 4,
      unit: 'pcs',
      purchasePrice: 2.75,
      supplier: 'SparkFun',
      isConsumable: false,
      technicalSpecs: { 'Range': '2cm - 400cm', 'Trigger Input': '10uS TTL pulse', 'Echo Output': 'TTL level' }
    },
    {
      componentCode: 'CMP-SEN-002',
      name: 'DHT11 Sensor',
      category: 'Sensors',
      description: 'Digital humidity and temperature sensor with calibrated digital signal output for weather stations and environmental monitoring.',
      imageUrl: dht11Svg,
      datasheetUrl: 'https://www.mouser.com/datasheet/2/758/DHT11-Technical-Data-Sheet-Translated-Version-1143054.pdf',
      location: { rack: 'B', shelf: 1, box: '01', coordinates: '(B,1,01)', room: 'Robotics Lab 304' },
      totalStock: 8,
      availableStock: 8,
      reservedStock: 0,
      issuedStock: 0,
      damagedStock: 0,
      minThreshold: 3,
      unit: 'pcs',
      purchasePrice: 2.10,
      supplier: 'Aosong Electronics',
      isConsumable: false,
      technicalSpecs: { 'Humidity Range': '20-90% RH', 'Temp Range': '0-50°C', 'Sampling Period': '1 sec' }
    },
    {
      componentCode: 'CMP-ACT-001',
      name: 'Servo Motor',
      category: 'Actuators',
      description: 'TowerPro SG90 9g micro servo motor with high output torque (1.8 kg/cm at 4.8V) for robotic arms, steering mechanisms, and grippers.',
      imageUrl: servoMotorSvg,
      datasheetUrl: 'https://components101.com/motors/servo-motor-basics-pinout-datasheet',
      location: { rack: 'C', shelf: 1, box: '04', coordinates: '(C,1,04)', room: 'Robotics Lab 304' },
      totalStock: 6,
      availableStock: 6,
      reservedStock: 0,
      issuedStock: 0,
      damagedStock: 0,
      minThreshold: 2,
      unit: 'pcs',
      purchasePrice: 3.50,
      supplier: 'TowerPro',
      isConsumable: false,
      technicalSpecs: { 'Operating Speed': '0.1s/60 degree', 'Operating Voltage': '4.8V - 6V', 'Weight': '9g' }
    },
    {
      componentCode: 'CMP-PRT-001',
      name: 'Breadboard',
      category: 'Passive',
      description: 'Standard solderless 830-tie-point prototype breadboard with 2 distribution strips and double-sided foam tape on back.',
      imageUrl: breadboardSvg,
      datasheetUrl: 'https://en.wikipedia.org/wiki/Breadboard',
      location: { rack: 'A', shelf: 3, box: '01', coordinates: '(A,3,01)', room: 'Robotics Lab 304' },
      totalStock: 12,
      availableStock: 12,
      reservedStock: 0,
      issuedStock: 0,
      damagedStock: 0,
      minThreshold: 5,
      unit: 'pcs',
      purchasePrice: 4.20,
      supplier: 'ElecRobo',
      isConsumable: false,
      technicalSpecs: { 'Points': '830 Tie Points', 'Pitch': '2.54mm', 'Voltage Rating': '300V / 3A' }
    },
    {
      componentCode: 'CMP-WIR-001',
      name: 'Jumper Wires',
      category: 'Wires & Others',
      description: '40-piece ribbon pack of 20cm male-to-male and male-to-female flexible multicolored DuPont jumper cables.',
      imageUrl: jumperWiresSvg,
      datasheetUrl: 'https://en.wikipedia.org/wiki/Jump_wire',
      location: { rack: 'C', shelf: 2, box: '02', coordinates: '(C,2,02)', room: 'Robotics Lab 304' },
      totalStock: 20,
      availableStock: 20,
      reservedStock: 0,
      issuedStock: 0,
      damagedStock: 0,
      minThreshold: 8,
      unit: 'packs',
      purchasePrice: 1.80,
      supplier: 'DuPont Parts',
      isConsumable: true,
      technicalSpecs: { 'Length': '20cm', 'Wire Gauge': '28 AWG', 'Pin Spacing': '2.54mm' }
    },
    {
      componentCode: 'CMP-PAS-001',
      name: 'Resistors (1kΩ)',
      category: 'Passive',
      description: '1k Ohm 1/4W 1% metal film resistors for pull-up circuits, current limiting, voltage dividers and circuit testing.',
      imageUrl: resistorSvg,
      datasheetUrl: 'https://en.wikipedia.org/wiki/Resistor',
      location: { rack: 'A', shelf: 2, box: '03', coordinates: '(A,2,03)', room: 'Robotics Lab 304' },
      totalStock: 50,
      availableStock: 50,
      reservedStock: 0,
      issuedStock: 0,
      damagedStock: 0,
      minThreshold: 20,
      unit: 'pcs',
      purchasePrice: 0.05,
      supplier: 'Yageo',
      isConsumable: true,
      technicalSpecs: { 'Resistance': '1000 Ohms', 'Tolerance': '&plusmn;1%', 'Power Rating': '0.25W' }
    },
    {
      componentCode: 'CMP-PAS-002',
      name: 'LED (Red)',
      category: 'Passive',
      description: '5mm diffused round red light emitting diodes (620-625nm) with 2.0V forward voltage and 20mA forward current.',
      imageUrl: ledRedSvg,
      datasheetUrl: 'https://en.wikipedia.org/wiki/Light-emitting_diode',
      location: { rack: 'B', shelf: 3, box: '02', coordinates: '(B,3,02)', room: 'Robotics Lab 304' },
      totalStock: 30,
      availableStock: 30,
      reservedStock: 0,
      issuedStock: 0,
      damagedStock: 0,
      minThreshold: 15,
      unit: 'pcs',
      purchasePrice: 0.10,
      supplier: 'Kingbright',
      isConsumable: true,
      technicalSpecs: { 'Forward Voltage': '2.0V - 2.2V', 'Wavelength': '625nm', 'Lens': 'Diffused Red 5mm' }
    },
    {
      componentCode: 'CMP-MCU-002',
      name: 'ESP32 NodeMCU',
      category: 'Microcontrollers',
      description: 'Dual-core 240MHz Wi-Fi and Bluetooth BLE microcontroller board with 30 GPIOs, ADC, DAC, SPI, and I2C interfaces.',
      imageUrl: esp32Svg,
      datasheetUrl: 'https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf',
      location: { rack: 'A', shelf: 1, box: '04', coordinates: '(A,1,04)', room: 'Robotics Lab 304' },
      totalStock: 7,
      availableStock: 7,
      reservedStock: 0,
      issuedStock: 0,
      damagedStock: 0,
      minThreshold: 3,
      unit: 'pcs',
      purchasePrice: 6.90,
      supplier: 'Espressif',
      isConsumable: false,
      technicalSpecs: { 'CPU': 'Xtensa Dual-Core 32-bit LX6', 'Wireless': '802.11 b/g/n & BT 4.2 BLE' }
    },
    {
      componentCode: 'CMP-ACT-002',
      name: 'L298N Motor Driver',
      category: 'Actuators',
      description: 'High power dual H-bridge motor driver module capable of driving two DC motors or one 4-wire two-phase stepper motor up to 2A per channel.',
      imageUrl: l298nSvg,
      datasheetUrl: 'https://www.sparkfun.com/datasheets/Robotics/L298_H_Bridge.pdf',
      location: { rack: 'C', shelf: 1, box: '02', coordinates: '(C,1,02)', room: 'Robotics Lab 304' },
      totalStock: 9,
      availableStock: 9,
      reservedStock: 0,
      issuedStock: 0,
      damagedStock: 0,
      minThreshold: 3,
      unit: 'pcs',
      purchasePrice: 4.80,
      supplier: 'STMicroelectronics',
      isConsumable: false,
      technicalSpecs: { 'Drive Voltage': '5V - 35V', 'Peak Current': '2A per bridge', 'Max Power': '25W' }
    }
  ];

  const createdComponents = [];
  for (const c of componentSeedData) {
    if (isMongoConnected) {
      const comp = new ComponentModel(c);
      createdComponents.push(await comp.save());
    } else {
      const comp = { _id: 'cmp_' + Math.random().toString(36).substr(2, 9), ...c, createdAt: new Date().toISOString() };
      localStore.components.push(comp);
      createdComponents.push(comp);
    }
  }

  // 5. Seed Initial Projects
  const projectSeedData = [
    {
      title: 'RoboWars 15kg Combat Bot "Titan"',
      description: 'Pneumatic flipper combat robot equipped with dual brushless drive motors and steel wedge armour for annual national robowar championship.',
      lead: studentUser._id || studentUser.id,
      leadName: studentUser.fullName,
      teamMembers: [studentUser.fullName, seniorUser.fullName, 'Rohan Sharma', 'Pooja Iyer'],
      category: 'Combat Robotics',
      status: 'IN_PROGRESS',
      allocatedComponents: [
        { component: createdComponents[0]._id || createdComponents[0].id, componentName: 'Arduino Uno', quantity: 1 },
        { component: createdComponents[3]._id || createdComponents[3].id, componentName: 'Servo Motor', quantity: 2 }
      ],
      startDate: new Date(Date.now() - 15 * 86400000).toISOString(),
      targetCompletionDate: new Date(Date.now() + 45 * 86400000).toISOString(),
      completionChecklist: [
        { task: 'Chassis laser cutting and welding', completed: true },
        { task: 'Drive ESC wiring and calibration', completed: true },
        { task: 'Weapon pneumatic actuator testing', completed: false },
        { task: 'Fail-safe radio link verification', completed: false }
      ]
    },
    {
      title: 'Autonomous Maze Solver & Line Follower',
      description: 'High-speed differential drive robot featuring PID algorithm, ultrasonic sensors, and IR array for RoboCup Maze Challenge.',
      lead: seniorUser._id || seniorUser.id,
      leadName: seniorUser.fullName,
      teamMembers: [seniorUser.fullName, 'Devansh Gupta', 'Tanvi Mehta'],
      category: 'Autonomous Mobile Robotics',
      status: 'PLANNING',
      allocatedComponents: [
        { component: createdComponents[1]._id || createdComponents[1].id, componentName: 'Ultrasonic Sensor', quantity: 3 }
      ],
      startDate: new Date(Date.now() - 5 * 86400000).toISOString(),
      targetCompletionDate: new Date(Date.now() + 60 * 86400000).toISOString(),
      completionChecklist: [
        { task: 'Sensor array PCB layout', completed: true },
        { task: 'Microcontroller selection', completed: true },
        { task: 'Motor speed tuning', completed: false }
      ]
    }
  ];

  for (const p of projectSeedData) {
    if (isMongoConnected) {
      const proj = new ProjectModel(p);
      await proj.save();
    } else {
      localStore.projects.push({ _id: 'prj_' + Math.random().toString(36).substr(2, 9), ...p, createdAt: new Date().toISOString() });
    }
  }

  // 6. Seed Sample Initial Requests
  const requestSeedData = [
    {
      requestCode: 'REQ-2026-001',
      user: studentUser._id || studentUser.id,
      userName: studentUser.fullName,
      userEmail: studentUser.email,
      projectName: 'RoboWars 15kg Combat Bot "Titan"',
      projectPurpose: 'Testing PWM weapon servo linkages and ultrasonic collision avoidance prototype for Titan.',
      seniorContact: seniorUser.contactNumber,
      seniorApprover: seniorUser._id || seniorUser.id,
      seniorApproverName: seniorUser.fullName,
      items: [
        {
          component: createdComponents[0]._id || createdComponents[0].id,
          componentName: 'Arduino Uno',
          componentCode: 'CMP-MCU-001',
          requestedQuantity: 1,
          approvedQuantity: 1,
          issuedQuantity: 1,
          returnedQuantity: 0,
          itemStatus: 'ISSUED'
        },
        {
          component: createdComponents[1]._id || createdComponents[1].id,
          componentName: 'Ultrasonic Sensor',
          componentCode: 'CMP-SEN-001',
          requestedQuantity: 2,
          approvedQuantity: 2,
          issuedQuantity: 2,
          returnedQuantity: 0,
          itemStatus: 'ISSUED'
        }
      ],
      status: 'ISSUED',
      expectedPickupDate: new Date(Date.now() - 4 * 86400000).toISOString(),
      expectedReturnDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      actualPickupDate: new Date(Date.now() - 4 * 86400000).toISOString(),
      notes: 'Approved for Titan prototype testing in Arena 2.',
      approvalHistory: [
        {
          approver: seniorUser._id || seniorUser.id,
          approverName: seniorUser.fullName,
          action: 'APPROVED',
          comments: 'Approved. Please handle ultrasonic transducers with care.',
          timestamp: new Date(Date.now() - 4 * 86400000).toISOString()
        }
      ]
    },
    {
      requestCode: 'REQ-2026-002',
      user: studentUser._id || studentUser.id,
      userName: studentUser.fullName,
      userEmail: studentUser.email,
      projectName: 'Autonomous Maze Solver & Line Follower',
      projectPurpose: 'Motor drive testing for line follower prototype.',
      seniorContact: seniorUser.contactNumber,
      seniorApprover: seniorUser._id || seniorUser.id,
      seniorApproverName: seniorUser.fullName,
      items: [
        {
          component: createdComponents[3]._id || createdComponents[3].id,
          componentName: 'Servo Motor',
          componentCode: 'CMP-ACT-001',
          requestedQuantity: 2,
          approvedQuantity: 0,
          issuedQuantity: 0,
          returnedQuantity: 0,
          itemStatus: 'PENDING'
        },
        {
          component: createdComponents[4]._id || createdComponents[4].id,
          componentName: 'Breadboard',
          componentCode: 'CMP-PRT-001',
          requestedQuantity: 1,
          approvedQuantity: 0,
          issuedQuantity: 0,
          returnedQuantity: 0,
          itemStatus: 'PENDING'
        }
      ],
      status: 'SUBMITTED',
      expectedPickupDate: new Date(Date.now() + 86400000).toISOString(),
      expectedReturnDate: new Date(Date.now() + 8 * 86400000).toISOString(),
      notes: 'Need this to assemble motor driver test bench.'
    }
  ];

  for (const r of requestSeedData) {
    if (isMongoConnected) {
      const req = new RequestModel(r);
      await req.save();
    } else {
      localStore.requests.push({ _id: 'req_' + Math.random().toString(36).substr(2, 9), ...r, createdAt: new Date().toISOString() });
    }
  }

  // 7. Seed Initial Notifications
  const notifSeedData = [
    {
      user: studentUser._id || studentUser.id,
      title: 'Components Ready for Pickup',
      message: 'Your request REQ-2026-001 has been issued by Lab Manager. Return date: in 3 days.',
      link: '/my-requests',
      type: 'SUCCESS'
    },
    {
      user: seniorUser._id || seniorUser.id,
      userRole: 'SENIOR',
      title: 'New Request Awaiting Review',
      message: 'Aarav Sharma submitted REQ-2026-002 for Maze Solver project.',
      link: '/approvals',
      type: 'INFO'
    }
  ];

  for (const n of notifSeedData) {
    if (isMongoConnected) {
      const notif = new NotificationModel(n);
      await notif.save();
    } else {
      localStore.notifications.push({ _id: 'notif_' + Math.random().toString(36).substr(2, 9), ...n, isRead: false, createdAt: new Date().toISOString() });
    }
  }

  // 8. Save local store if running locally
  if (!isMongoConnected) {
    saveLocalStore();
  }

  console.log('✅ Database seeded successfully with 4 demo accounts, 10 components, 2 projects, and initial requests!');
};

// Run directly if invoked from command line
if (process.argv[1] && process.argv[1].endsWith('seedData.js')) {
  seedDatabase().then(() => process.exit(0)).catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}
