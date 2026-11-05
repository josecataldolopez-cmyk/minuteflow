import {
  Attendee,
  MeetingMinute,
  ScheduleItem,
  DirectoryItem,
  ActionItem,
  UserProfile,
  Organization
} from '../types';

export const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-redq',
    name: 'REDQ Consultores y Tecnología',
    code: 'REDQ-CORP',
    taxId: '76.890.123-K',
    domain: 'redq.cl',
    driveAccount: 'jose.cataldo@redq.cl',
    driveWebhookUrl: '',
    logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&auto=format&fit=crop&q=80',
    plan: 'Enterprise Multi-Tenant',
    createdAt: '2026-01-15',
    primaryColor: '#4f46e5',
    slogan: 'Innovación y Gobernanza Tecnológica',
    headerText: 'REDQ Consultores & Tecnología SpA — Dirección Ejecutiva y Auditoría'
  },
  {
    id: 'org-colegio',
    name: 'Colegio San Ignacio El Bosque',
    code: 'CSANIGNACIO',
    taxId: '81.456.789-2',
    domain: 'sanignacio.cl',
    driveAccount: 'rectoria@sanignacio.cl',
    driveWebhookUrl: '',
    logoUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=100&auto=format&fit=crop&q=80',
    plan: 'Plan Educacional Plus',
    createdAt: '2026-02-01',
    primaryColor: '#059669',
    slogan: 'Formando hombres y mujeres para los demás',
    headerText: 'Colegio San Ignacio El Bosque — Consejo de Dirección y Equipo Técnico Pedagógico'
  },
  {
    id: 'org-clinica',
    name: 'Clínica Médica Central',
    code: 'CLINICA-MC',
    taxId: '96.321.654-7',
    domain: 'clinicacentral.cl',
    driveAccount: 'direccion.medica@clinicacentral.cl',
    driveWebhookUrl: '',
    logoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=100&auto=format&fit=crop&q=80',
    plan: 'Plan Salud Pro',
    createdAt: '2026-03-10',
    primaryColor: '#0284c7',
    slogan: 'Compromiso con la salud y excelencia clínica',
    headerText: 'Clínica Médica Central — Comité de Ética Asistencial y Dirección Médica'
  }
];

export const INITIAL_USER_PROFILE: UserProfile = {
  id: 'user-primary',
  name: 'José Cataldo',
  role: 'Administrador Corporativo',
  systemRole: 'admin',
  email: 'jose.cataldo@redq.cl',
  department: 'Dirección General de Operaciones',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBV2OuN03O8TiLGOHeUBlq6SXBGf8lu4IgMQ-YEwmkRLA3qmC5MXmTjD0hdDmGNIRi5FD7n4Jr4C5hxmvn08IMoW0D5BgnfPJ8yGD3aLGOBngDzkgC9FkjKycbeGTIzQGFyxQtY6_7j_X_OzNasGTKLIi0JyIEGvmudlvb_NOD6DAfqYwpN-un5H22BsxXmiJpZvXo-kS4kUri558jTy3GzN6mE-ugOSrdOsAVDbFg03GQqz06YZ1r2_g',
  plan: 'Plan Enterprise Activo',
  organizationId: 'org-redq',
  organizationName: 'REDQ Consultores y Tecnología'
};

export const AVATAR_PRESETS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBV2OuN03O8TiLGOHeUBlq6SXBGf8lu4IgMQ-YEwmkRLA3qmC5MXmTjD0hdDmGNIRi5FD7n4Jr4C5hxmvn08IMoW0D5BgnfPJ8yGD3aLGOBngDzkgC9FkjKycbeGTIzQGFyxQtY6_7j_X_OzNasGTKLIi0JyIEGvmudlvb_NOD6DAfqYwpN-un5H22BsxXmiJpZvXo-kS4kUri558jTy3GzN6mE-ugOSrdOsAVDbFg03GQqz06YZ1r2_g',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCn1ql4CsV7FZi-0OO_3yN1TNzWndajo24pfYOwZJeHU4WUjojCXoygG8YK_2sGoGh_XVSrXP8RtbTWdUD46DTdqi3wdOvf1zjWVYFrYv9msWNGbsU-UAX57LKaSWfO-NVHQMKt9zKuRi1iO9lnBJjZBkzbOKAcktcWGVnOKziNsG7KMowptjJGIQJnOVI_biB8LAy1r2_TbXx5RnAOY3rPvFGZIPHpK1Rhjb0YNyLisXKKbBwUGGnm9A',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCNOynLpEupiAi6feNynBg8qrK3QgDA9a-jVmfCUL4rAgXPlipB523AYUchbLz8xQkcxQtGY-Jmv__VmHFqqLu0HV_GU0OMxZTm1EFMAAVh3b36xN35qx34bNKw0iZjmBQ4W8WY5Q3qZXpkyvh-ugrYA8bo4qeSxh3NZWrei1ctY4la62mvgLOtCZSXHrg0woI40jUPMgS-39ZGNra8IJCxtqHiCUuly_2Pfwm0hBuPUDGlytBnP4qPfg',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA-aqWzb_Q1ZWG8MN-7e6DFun3UhSp-CS9KpW5tlIlUUHnXk72dpITlo38YOwVFd7G_N7WLvbsCAXdUHVktX0UFFHsWvP29ilEbRvcVpfNm9utbsCSM1wza1aZ2ssd3HDLMXn1wmXBqGAzMNY6rML_0qHrBFvHZiOIKCwlP1v3qWH_6G_P80SO2ShLAgAfO40sUZ4MDqvOeTMOseZzSGsiN16JXq-XTN9iLWm_2DnSVWVF5BN1Ihrg9-A',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD4JA4sYKKTQLG_o9cxE4ea9Dka-W7Gi8689gmxYrmlRLEzebZgluoQT22cTLlNnoX-r2xaQWAO4KhhRu3fPwVxeM2lg8Hi5ciTNjKMVGUBKmSMnN1VCExJXgkAjc1_Fbt8lYtbdc9hgo2fTp5eVs-iSD-FTTcWFHsE8UDlqLeV6R2LaORXRga9vvfWqx6HysFvZ5_KBpPsQr74VlMMRutaV7gM_aL7PPg978aeUx3WAOYH1JgKWMEnkg',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCsPtyLUsq71F3RNHnXRp98pLyQCxkyddVVFi_05ORpT9UXD3Pm4vgwFEQrsZAbKTcGnjnb9n_U7nUuoMoon1BHCoM0FZADNMi_djSzJhmSi9N0N3HID1gZ6eQmjDyRP2uKcV5BaOA4cebpXvE2VhVMHQuJXg8RCLnJApRrWOpbS5Hz8iV7la4uV-h6uo9hBuWTNxzUFbR8cUHzDb8hlAnFCNi6tR0DY2XCAJy1GpKf6XyiH9M6dWUIhw'
];

export const INITIAL_ATTENDEES: Attendee[] = [
  {
    id: 'att-1',
    name: 'José Cataldo',
    role: 'Director General',
    email: 'jose.cataldo@redq.cl',
    avatarUrl: AVATAR_PRESETS[0],
    organizationId: 'org-redq'
  },
  {
    id: 'att-2',
    name: 'Miguel Torres',
    role: 'Arquitecto Cloud & Seguridad',
    email: 'miguel.t@redq.cl',
    avatarUrl: AVATAR_PRESETS[1],
    organizationId: 'org-redq'
  },
  {
    id: 'att-3',
    name: 'Elena Vance',
    role: 'Directora de Transformación Digital',
    email: 'elena.v@redq.cl',
    avatarUrl: AVATAR_PRESETS[2],
    organizationId: 'org-redq'
  },
  {
    id: 'att-4',
    name: 'David Chen',
    role: 'Director Financiero (CFO)',
    email: 'david.c@redq.cl',
    avatarUrl: AVATAR_PRESETS[3],
    organizationId: 'org-redq'
  },
  {
    id: 'att-5',
    name: 'Raquel Sterling',
    role: 'VP Gestión de Personas',
    email: 'raquel.s@redq.cl',
    avatarUrl: AVATAR_PRESETS[4],
    organizationId: 'org-redq'
  },
  {
    id: 'att-6',
    name: 'Roberto Hayes',
    role: 'Fiscal Jurídico Corporativo',
    email: 'roberto.h@redq.cl',
    avatarUrl: AVATAR_PRESETS[5],
    organizationId: 'org-redq'
  },
  // Asistentes de Colegio San Ignacio (Aislados)
  {
    id: 'att-csi-1',
    name: 'Padre Gonzalo Undurraga',
    role: 'Rector General',
    email: 'rectoria@sanignacio.cl',
    avatarUrl: AVATAR_PRESETS[3],
    organizationId: 'org-colegio'
  },
  {
    id: 'att-csi-2',
    name: 'Marcela Contreras',
    role: 'Vicerrectora Académica',
    email: 'm.contreras@sanignacio.cl',
    avatarUrl: AVATAR_PRESETS[2],
    organizationId: 'org-colegio'
  }
];

export const INITIAL_SCHEDULE: ScheduleItem[] = [
  {
    id: 'sch-1',
    time: '10:00',
    ampm: 'AM',
    title: 'Alineación Estratégica Q3 - REDQ',
    participants: 'Comité Ejecutivo REDQ',
    platform: 'Google Meet',
    link: 'https://meet.google.com/abc-defg-hij',
    date: '2026-11-05',
    organizationId: 'org-redq'
  },
  {
    id: 'sch-2',
    time: '01:30',
    ampm: 'PM',
    title: 'Sincronización de Arquitectura y Seguridad Cloud',
    participants: 'Miguel Torres, Elena Vance',
    platform: 'Sala de Conferencias 1',
    date: '2026-11-06',
    organizationId: 'org-redq'
  },
  {
    id: 'sch-csi-1',
    time: '08:30',
    ampm: 'AM',
    title: 'Consejo de Dirección Escolar 2026',
    participants: 'Rectoría y Coordinadores de Ciclo',
    platform: 'Sala de Consejo',
    date: '2026-11-06',
    organizationId: 'org-colegio'
  }
];

export const INITIAL_ACTION_ITEMS: ActionItem[] = [
  {
    id: 'act-1',
    text: 'Validar y verificar Webhook de Google Drive corporativo',
    completed: true,
    dueDate: '2026-11-05',
    dueLabel: 'Completado',
    priority: 'High',
    sourceMinuteTitle: 'Comité de Auditoría y Seguridad',
    assignedTo: INITIAL_ATTENDEES[0],
    organizationId: 'org-redq'
  },
  {
    id: 'act-2',
    text: 'Revisar contratos de proveedores para infraestructura regional',
    completed: false,
    dueDate: '2026-11-10',
    dueLabel: 'En 5 días',
    priority: 'Medium',
    sourceMinuteTitle: 'Alineación Ejecutiva Q3',
    assignedTo: INITIAL_ATTENDEES[1],
    organizationId: 'org-redq'
  },
  {
    id: 'act-3',
    text: 'Preparar modelos financieros para expansión tecnológica',
    completed: false,
    dueDate: '2026-11-15',
    dueLabel: 'Próxima semana',
    priority: 'High',
    sourceMinuteTitle: 'Revisión Estratégica Q3',
    assignedTo: INITIAL_ATTENDEES[3],
    organizationId: 'org-redq'
  },
  // Compromiso de Colegio San Ignacio
  {
    id: 'act-csi-1',
    text: 'Aprobación del calendario de exámenes de fin de año 2026',
    completed: false,
    dueDate: '2026-11-12',
    dueLabel: 'Próxima semana',
    priority: 'High',
    sourceMinuteTitle: 'Consejo de Dirección Académica',
    assignedTo: INITIAL_ATTENDEES[6],
    organizationId: 'org-colegio'
  }
];

export const INITIAL_DIRECTORIES: DirectoryItem[] = [
  // Carpetas de REDQ
  { id: 'dir-1', name: 'Reuniones de Directorio Q3', count: 4, icon: 'folder', organizationId: 'org-redq' },
  { id: 'dir-2', name: 'Comité de Ciberseguridad e Infraestructura', count: 2, icon: 'folder', organizationId: 'org-redq' },
  { id: 'dir-3', name: 'Gestión y Desarrollo de Talento', count: 3, icon: 'folder_open', organizationId: 'org-redq' },
  { id: 'dir-4', name: 'Auditoría Externa y Cumplimiento', count: 2, icon: 'folder', organizationId: 'org-redq' },
  // Carpetas de Colegio San Ignacio
  { id: 'dir-csi-1', name: 'Consejos de Dirección Académica', count: 2, icon: 'folder', organizationId: 'org-colegio' },
  { id: 'dir-csi-2', name: 'Comité de Convivencia Escolar', count: 1, icon: 'folder', organizationId: 'org-colegio' }
];

export const INITIAL_MINUTES: MeetingMinute[] = [
  // Actas de REDQ Consultores
  {
    id: 'min-1',
    title: 'Comité de Auditoría, Seguridad y Gobernanza Cloud',
    directory: 'Comité de Ciberseguridad e Infraestructura',
    date: '2026-11-04',
    formattedDate: 'Ayer',
    time: '10:00 AM',
    status: 'Aprobada',
    location: 'Sala de Directorio REDQ / Google Meet',
    objectives: 'Garantizar el aislamiento multi-tenant y la sincronización con Google Drive institucional.',
    pointsTreated: `• Implementación de políticas Row Level Security (RLS) en base de datos para aislamiento entre establecimientos.
• Verificación del Webhook exclusivo de Google Apps Script asignado a jose.cataldo@redq.cl.
• Aprobación de control de roles (Admin, Editor, Lector) con restricción para configuraciones de Drive.
• Sincronización automática de actas en la carpeta "MinuteFlow - Actas Ejecutivas".`,
    keyDecisions: [
      'Aprobado el esquema de aislamiento estricto por organization_id.',
      'Solo el Administrador del establecimiento puede ingresar la URL de Google Drive.'
    ],
    actionItems: [
      {
        id: 'act-m1-1',
        text: 'Validar y verificar Webhook de Google Drive corporativo',
        completed: true,
        assignedTo: INITIAL_ATTENDEES[0]
      },
      {
        id: 'act-m1-2',
        text: 'Desplegar versión blindada a producción en Vercel',
        completed: false,
        assignedTo: INITIAL_ATTENDEES[1]
      }
    ],
    attendees: [INITIAL_ATTENDEES[0], INITIAL_ATTENDEES[1], INITIAL_ATTENDEES[2]],
    folderPath: 'Comité de Ciberseguridad e Infraestructura / Nov',
    lastEdited: 'Ayer a las 11:45 AM',
    organizationId: 'org-redq'
  },
  {
    id: 'min-2',
    title: 'Sesión Ordinaria de Directorio Q3',
    directory: 'Reuniones de Directorio Q3',
    date: '2026-10-28',
    formattedDate: '28 de octubre, 2026',
    time: '11:30 AM',
    status: 'Aprobada',
    location: 'Sala Ejecutiva Principal',
    objectives: 'Revisar balance financiero y objetivos estratégicos de fin de año.',
    pointsTreated: `• Revisión del cumplimiento presupuestario del tercer trimestre.
• Asignación de recursos para el nuevo módulo de firma digital y distribución segura.
• El área legal revisó los términos de servicio para instituciones clientes.`,
    keyDecisions: [
      'Aprobado el presupuesto de cierre de año para plataformas corporativas.',
      'Convocatoria para la próxima sesión ordinaria fijada para el 25 de noviembre.'
    ],
    actionItems: [
      {
        id: 'act-m2-1',
        text: 'Preparar modelos financieros para revisión',
        completed: false,
        assignedTo: INITIAL_ATTENDEES[3]
      }
    ],
    attendees: [INITIAL_ATTENDEES[0], INITIAL_ATTENDEES[3], INITIAL_ATTENDEES[5]],
    folderPath: 'Reuniones de Directorio Q3 / Oct',
    lastEdited: '28 de oct a las 01:15 PM',
    organizationId: 'org-redq'
  },
  // Acta del Colegio San Ignacio (Aislada y privada para Colegio)
  {
    id: 'min-csi-1',
    title: 'Consejo de Dirección Escolar: Cierre de Semestre y Evaluaciones',
    directory: 'Consejos de Dirección Académica',
    date: '2026-11-03',
    formattedDate: '03 de noviembre, 2026',
    time: '09:00 AM',
    status: 'Aprobada',
    location: 'Sala de Rectoría San Ignacio',
    objectives: 'Planificación del proceso de admisión 2027 y fechas clave de fin de año.',
    pointsTreated: `• Revisión del proceso de postulaciones y cupos disponibles por nivel.
• Coordinación con el equipo pastoral para las ceremonias de graduación.
• Aprobación del calendario de exámenes de recuperación y entrega de actas docentes.`,
    keyDecisions: [
      'Aprobado el calendario de graduaciones para la tercera semana de diciembre.',
      'Publicación de resultados de admisión fijada para el 20 de noviembre.'
    ],
    actionItems: [
      {
        id: 'act-csi-m1',
        text: 'Aprobación del calendario de exámenes de fin de año 2026',
        completed: false,
        assignedTo: INITIAL_ATTENDEES[6]
      }
    ],
    attendees: [INITIAL_ATTENDEES[6], INITIAL_ATTENDEES[7]],
    folderPath: 'Consejos de Dirección Académica / Nov',
    lastEdited: '03 de nov a las 10:30 AM',
    organizationId: 'org-colegio'
  }
];
