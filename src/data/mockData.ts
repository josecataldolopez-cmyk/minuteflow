import { Attendee, MeetingMinute, ScheduleItem, DirectoryItem, ActionItem, UserProfile } from '../types';

export const INITIAL_USER_PROFILE: UserProfile = {
  id: 'user-primary',
  name: 'Sarah Jenkins',
  role: 'Vicepresidenta Ejecutiva',
  email: 'sarah.j@minuteflow.com',
  department: 'Dirección General de Operaciones',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBV2OuN03O8TiLGOHeUBlq6SXBGf8lu4IgMQ-YEwmkRLA3qmC5MXmTjD0hdDmGNIRi5FD7n4Jr4C5hxmvn08IMoW0D5BgnfPJ8yGD3aLGOBngDzkgC9FkjKycbeGTIzQGFyxQtY6_7j_X_OzNasGTKLIi0JyIEGvmudlvb_NOD6DAfqYwpN-un5H22BsxXmiJpZvXo-kS4kUri558jTy3GzN6mE-ugOSrdOsAVDbFg03GQqz06YZ1r2_g',
  plan: 'Plan Enterprise Activo'
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
    name: 'Sarah Jenkins',
    role: 'Vicepresidenta Ejecutiva',
    email: 'sarah.j@minuteflow.com',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBV2OuN03O8TiLGOHeUBlq6SXBGf8lu4IgMQ-YEwmkRLA3qmC5MXmTjD0hdDmGNIRi5FD7n4Jr4C5hxmvn08IMoW0D5BgnfPJ8yGD3aLGOBngDzkgC9FkjKycbeGTIzQGFyxQtY6_7j_X_OzNasGTKLIi0JyIEGvmudlvb_NOD6DAfqYwpN-un5H22BsxXmiJpZvXo-kS4kUri558jTy3GzN6mE-ugOSrdOsAVDbFg03GQqz06YZ1r2_g'
  },
  {
    id: 'att-2',
    name: 'Miguel Torres',
    role: 'Arquitecto Líder',
    email: 'miguel.t@minuteflow.com',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCn1ql4CsV7FZi-0OO_3yN1TNzWndajo24pfYOwZJeHU4WUjojCXoygG8YK_2sGoGh_XVSrXP8RtbTWdUD46DTdqi3wdOvf1zjWVYFrYv9msWNGbsU-UAX57LKaSWfO-NVHQMKt9zKuRi1iO9lnBJjZBkzbOKAcktcWGVnOKziNsG7KMowptjJGIQJnOVI_biB8LAy1r2_TbXx5RnAOY3rPvFGZIPHpK1Rhjb0YNyLisXKKbBwUGGnm9A'
  },
  {
    id: 'att-3',
    name: 'Elena Vance',
    role: 'Directora Creativa',
    email: 'elena.v@minuteflow.com',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNOynLpEupiAi6feNynBg8qrK3QgDA9a-jVmfCUL4rAgXPlipB523AYUchbLz8xQkcxQtGY-Jmv__VmHFqqLu0HV_GU0OMxZTm1EFMAAVh3b36xN35qx34bNKw0iZjmBQ4W8WY5Q3qZXpkyvh-ugrYA8bo4qeSxh3NZWrei1ctY4la62mvgLOtCZSXHrg0woI40jUPMgS-39ZGNra8IJCxtqHiCUuly_2Pfwm0hBuPUDGlytBnP4qPfg'
  },
  {
    id: 'att-4',
    name: 'David Chen',
    role: 'Director Financiero (CFO)',
    email: 'david.c@minuteflow.com',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-aqWzb_Q1ZWG8MN-7e6DFun3UhSp-CS9KpW5tlIlUUHnXk72dpITlo38YOwVFd7G_N7WLvbsCAXdUHVktX0UFFHsWvP29ilEbRvcVpfNm9utbsCSM1wza1aZ2ssd3HDLMXn1wmXBqGAzMNY6rML_0qHrBFvHZiOIKCwlP1v3qWH_6G_P80SO2ShLAgAfO40sUZ4MDqvOeTMOseZzSGsiN16JXq-XTN9iLWm_2DnSVWVF5BN1Ihrg9-A'
  },
  {
    id: 'att-5',
    name: 'Raquel Sterling',
    role: 'VP Recursos Humanos',
    email: 'raquel.s@minuteflow.com',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD4JA4sYKKTQLG_o9cxE4ea9Dka-W7Gi8689gmxYrmlRLEzebZgluoQT22cTLlNnoX-r2xaQWAO4KhhRu3fPwVxeM2lg8Hi5ciTNjKMVGUBKmSMnN1VCExJXgkAjc1_Fbt8lYtbdc9hgo2fTp5eVs-iSD-FTTcWFHsE8UDlqLeV6R2LaORXRga9vvfWqx6HysFvZ5_KBpPsQr74VlMMRutaV7gM_aL7PPg978aeUx3WAOYH1JgKWMEnkg'
  },
  {
    id: 'att-6',
    name: 'Roberto Hayes',
    role: 'Director Jurídico',
    email: 'roberto.h@minuteflow.com',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsPtyLUsq71F3RNHnXRp98pLyQCxkyddVVFi_05ORpT9UXD3Pm4vgwFEQrsZAbKTcGnjnb9n_U7nUuoMoon1BHCoM0FZADNMi_djSzJhmSi9N0N3HID1gZ6eQmjDyRP2uKcV5BaOA4cebpXvE2VhVMHQuJXg8RCLnJApRrWOpbS5Hz8iV7la4uV-h6uo9hBuWTNxzUFbR8cUHzDb8hlAnFCNi6tR0DY2XCAJy1GpKf6XyiH9M6dWUIhw'
  }
];

export const INITIAL_SCHEDULE: ScheduleItem[] = [
  {
    id: 'sch-1',
    time: '10:00',
    ampm: 'AM',
    title: 'Alineación Estratégica Q3',
    participants: 'Equipo Ejecutivo + 3',
    platform: 'Zoom',
    link: 'https://zoom.us/j/982374623',
    date: '2026-08-31'
  },
  {
    id: 'sch-2',
    time: '01:30',
    ampm: 'PM',
    title: 'Sincronización de Producto: Flow V2',
    participants: 'Líderes de Diseño e Ingeniería',
    platform: 'Sala A',
    date: '2026-08-31'
  },
  {
    id: 'sch-3',
    time: '04:15',
    ampm: 'PM',
    title: 'Reunión General de la Empresa y Preguntas',
    participants: 'Toda la Empresa (142 miembros)',
    platform: 'Auditorio Principal',
    date: '2026-08-31'
  },
  {
    id: 'sch-4',
    time: '09:30',
    ampm: 'AM',
    title: 'Comité de Auditoría y Riesgos Q3',
    participants: 'David Chen, Roberto Hayes + 2',
    platform: 'Google Meet',
    date: '2026-09-04'
  },
  {
    id: 'sch-5',
    time: '02:00',
    ampm: 'PM',
    title: 'Revisión de Arquitectura Cloud & SSO',
    participants: 'Miguel Torres, Elena Vance',
    platform: 'Sala de Innovación',
    date: '2026-09-10'
  }
];

export const INITIAL_ACTION_ITEMS: ActionItem[] = [
  {
    id: 'act-1',
    text: 'Finalizar propuesta de presupuesto Q3',
    completed: false,
    dueDate: '2026-08-31',
    dueLabel: 'Vence hoy',
    priority: 'High',
    sourceMinuteTitle: 'Revisión Estratégica Q3',
    assignedTo: INITIAL_ATTENDEES[0]
  },
  {
    id: 'act-2',
    text: 'Revisar contratos de proveedores para expansión TI',
    completed: false,
    dueDate: '2026-09-02',
    dueLabel: 'En 2 días',
    priority: 'Medium',
    sourceMinuteTitle: 'Alineación Ejecutiva Q3',
    assignedTo: INITIAL_ATTENDEES[0]
  },
  {
    id: 'act-3',
    text: 'Preparar modelos financieros para fusión con AlphaCorp',
    completed: false,
    dueDate: '2026-09-05',
    dueLabel: 'Próxima semana',
    priority: 'High',
    sourceMinuteTitle: 'Revisión Estratégica Q3',
    assignedTo: INITIAL_ATTENDEES[3]
  },
  {
    id: 'act-4',
    text: 'Redactar acuerdo de confidencialidad (NDA) para negociaciones con AlphaCorp',
    completed: true,
    dueDate: '2026-08-28',
    dueLabel: 'Completado',
    priority: 'High',
    sourceMinuteTitle: 'Reunión de Directorio',
    assignedTo: INITIAL_ATTENDEES[5]
  },
  {
    id: 'act-5',
    text: 'Distribuir la guía de marca actualizada a las agencias aliadas',
    completed: true,
    dueDate: '2026-08-29',
    dueLabel: 'Completado',
    priority: 'Medium',
    sourceMinuteTitle: 'Sincronización Semanal de Marketing',
    assignedTo: INITIAL_ATTENDEES[2]
  },
  {
    id: 'act-6',
    text: 'Completar revisión de guiones gráficos de video para campaña',
    completed: false,
    dueDate: '2026-09-08',
    dueLabel: '8 de Septiembre',
    priority: 'Low',
    sourceMinuteTitle: 'Sincronización Semanal de Marketing',
    assignedTo: INITIAL_ATTENDEES[0]
  },
  {
    id: 'act-7',
    text: 'Solicitar credenciales OAuth y lista blanca de IPs a TechCorp',
    completed: false,
    dueDate: '2026-09-12',
    dueLabel: '12 de Septiembre',
    priority: 'High',
    sourceMinuteTitle: 'Incorporación de Cliente: TechCorp',
    assignedTo: INITIAL_ATTENDEES[1]
  },
  {
    id: 'act-8',
    text: 'Obtener la firma del comité en los planes de incentivos ejecutivos',
    completed: false,
    dueDate: '2026-09-15',
    dueLabel: '15 de Septiembre',
    priority: 'High',
    sourceMinuteTitle: 'Revisión Salarial y Compensaciones',
    assignedTo: INITIAL_ATTENDEES[4]
  },
  {
    id: 'act-9',
    text: 'Publicar el cuadro de mando actualizado con los OKRs trimestrales',
    completed: true,
    dueDate: '2026-08-25',
    dueLabel: 'Completado',
    priority: 'Low',
    sourceMinuteTitle: 'Alineación Ejecutiva Q3',
    assignedTo: INITIAL_ATTENDEES[0]
  },
  {
    id: 'act-10',
    text: 'Presentar documentación trimestral de gobernanza ante el comité regulador',
    completed: false,
    dueDate: '2026-09-22',
    dueLabel: '22 de Septiembre',
    priority: 'Medium',
    sourceMinuteTitle: 'Reunión de Directorio',
    assignedTo: INITIAL_ATTENDEES[5]
  }
];

export const INITIAL_DIRECTORIES: DirectoryItem[] = [
  { id: 'dir-1', name: 'Reuniones de Directorio Q3', count: 12, icon: 'folder' },
  { id: 'dir-2', name: 'Fusiones Cliente Alpha', count: 8, icon: 'folder' },
  { id: 'dir-3', name: 'Recursos Humanos', count: 24, icon: 'folder_open' },
  { id: 'dir-4', name: 'Revisiones Anuales 2023', count: 5, icon: 'folder' }
];

export const INITIAL_MINUTES: MeetingMinute[] = [
  {
    id: 'min-1',
    title: 'Sincronización Semanal de Marketing',
    directory: 'Fusiones Cliente Alpha',
    date: '2026-08-29',
    formattedDate: 'Ayer',
    time: '11:00 AM',
    status: 'Aprobada',
    location: 'Sala de Conferencias B / Google Meet',
    objectives: 'Definir la paleta de colores de marca y el cronograma de campaña para Otoño 2026.',
    pointsTreated: `• Revisión de resultados de encuestas de mercado en regiones prioritarias.
• Aprobación de la paleta de colores definitiva y jerarquía tipográfica para la campaña de Otoño 2026.
• El departamento creativo entregará los reels prototipo de video el próximo jueves.
• Calendario de redes sociales sincronizado en LinkedIn, X e Instagram.`,
    keyDecisions: [
      'Aprobada la paleta de colores de otoño y las revisiones del manual de marca.',
      'Asignación de $45,000 para campañas publicitarias segmentadas en redes.'
    ],
    actionItems: [
      {
        id: 'act-m1-1',
        text: 'Distribuir la guía de marca actualizada a las agencias aliadas',
        completed: true,
        assignedTo: INITIAL_ATTENDEES[2]
      },
      {
        id: 'act-m1-2',
        text: 'Completar la revisión de guiones gráficos de video',
        completed: false,
        assignedTo: INITIAL_ATTENDEES[0]
      }
    ],
    attendees: [INITIAL_ATTENDEES[2], INITIAL_ATTENDEES[3]],
    folderPath: 'Fusiones Cliente Alpha / Marca',
    lastEdited: 'Ayer a las 5:20 PM'
  },
  {
    id: 'min-2',
    title: 'Incorporación de Cliente: TechCorp',
    directory: 'Fusiones Cliente Alpha',
    date: '2026-08-24',
    formattedDate: 'Lun, 14',
    time: '02:00 PM',
    status: 'Borrador',
    location: 'Zoom Enterprise',
    objectives: 'Levantamiento inicial de requerimientos y definición de arquitectura para integración API.',
    pointsTreated: `• Presentación de arquitectura técnica para autenticación SSO y SAML.
• En espera de confirmación de claves API y límites de peticiones por el equipo de seguridad de TechCorp.
• Lanzamiento piloto por etapas programado para la Fase 1 a finales de septiembre.`,
    keyDecisions: [
      'Acuerdo de arquitectura dual REST y Webhooks.',
      'Fecha objetivo de salida a producción fijada para el Sprint 2 del Q4.'
    ],
    actionItems: [
      {
        id: 'act-m2-1',
        text: 'Solicitar credenciales OAuth y lista blanca de IPs a TechCorp',
        completed: false,
        assignedTo: INITIAL_ATTENDEES[1]
      }
    ],
    attendees: [INITIAL_ATTENDEES[0], INITIAL_ATTENDEES[1]],
    folderPath: 'Fusiones Cliente Alpha / TechCorp',
    lastEdited: 'Lun, 24 de ago a las 3:15 PM'
  },
  {
    id: 'min-3',
    title: 'Reunión de Directorio: Revisión Q2',
    directory: 'Reuniones de Directorio Q3',
    date: '2026-08-20',
    formattedDate: 'Semana pasada',
    time: '09:00 AM',
    status: 'Aprobada',
    location: 'Sala de Juntas Ejecutiva',
    objectives: 'Revisar estados financieros auditados del Q2 y aprobar hoja de ruta de expansión corporativa.',
    pointsTreated: `• Presentación de auditoría financiera: crecimiento interanual del 24% en ARR con márgenes EBITDA saludables.
• Objetivos estratégicos para Q3 definidos con foco central en la expansión regional APAC.
• Aprobado plan de contratación para 15 puestos clave en ingeniería y liderazgo ejecutivo.`,
    keyDecisions: [
      'Estados financieros aprobados formalmente sin modificaciones.',
      'Autorizado el contrato de arrendamiento corporativo para la sede en Singapur.'
    ],
    actionItems: [
      {
        id: 'act-m3-1',
        text: 'Presentar documentación trimestral de gobernanza ante el comité regulador',
        completed: true,
        assignedTo: INITIAL_ATTENDEES[5]
      }
    ],
    attendees: [INITIAL_ATTENDEES[0], INITIAL_ATTENDEES[3], INITIAL_ATTENDEES[4]],
    folderPath: 'Reuniones de Directorio Q3 / Gobernanza',
    lastEdited: '20 de ago a las 11:45 AM'
  },
  {
    id: 'min-4',
    title: 'Alineación Ejecutiva Q3',
    directory: 'Reuniones de Directorio Q3',
    date: '2026-08-12',
    formattedDate: '12 de oct, 2023',
    time: '10:00 AM',
    status: 'Aprobada',
    location: 'Sala de Juntas Oeste',
    objectives: 'Discusión de metas trimestrales, asignación de recursos y estrategias de expansión para el ciclo entrante.',
    pointsTreated: `• Revisión de OKRs trimestrales en ingeniería, producto y ventas.
• Finalización de reasignación presupuestaria para acelerar la integración de IA empresarial.
• Establecimiento de cadencia de sincronización ejecutiva mensual.`,
    keyDecisions: [
      'Aprobado incremento de 12 puestos a tiempo completo en ingeniería de producto.',
      'Repriorizado el rediseño de la app móvil para lanzamiento en Q4.'
    ],
    actionItems: [
      {
        id: 'act-m4-1',
        text: 'Publicar el cuadro de mando actualizado con los OKRs trimestrales',
        completed: true,
        assignedTo: INITIAL_ATTENDEES[0]
      }
    ],
    attendees: [INITIAL_ATTENDEES[0], INITIAL_ATTENDEES[1], INITIAL_ATTENDEES[4], INITIAL_ATTENDEES[5]],
    folderPath: 'Reuniones de Directorio Q3 / Oct',
    lastEdited: '12 de oct a las 4:30 PM'
  },
  {
    id: 'min-5',
    title: 'Revisión Salarial y Compensaciones de RRHH',
    directory: 'Recursos Humanos',
    date: '2026-08-10',
    formattedDate: '10 de oct, 2023',
    time: '03:00 PM',
    status: 'Pendiente de firma',
    location: 'Oficina RRHH 402',
    objectives: 'Revisión anual de bandas salariales, esquemas de bonos y distribución de capital para la alta gerencia.',
    pointsTreated: `• Análisis de informe de referencia del sector sobre compensación ejecutiva en tecnología.
• Propuesta de ajuste en periodos de consolidación de capital para talento de ingeniería de primer nivel.
• Preparación del paquete de firmas para el Comité de Remuneraciones.`,
    keyDecisions: [
      'Aprobadas nuevas bandas salariales base indexadas al percentil 75.',
      'Estandarización de umbrales métricos para KPIs de bonos.'
    ],
    actionItems: [
      {
        id: 'act-m5-1',
        text: 'Obtener la firma del comité en los planes de incentivos ejecutivos',
        completed: false,
        assignedTo: INITIAL_ATTENDEES[4]
      }
    ],
    attendees: [INITIAL_ATTENDEES[4]],
    folderPath: 'Recursos Humanos / Compensaciones',
    lastEdited: '10 de oct a las 5:00 PM'
  },
  {
    id: 'min-6',
    title: 'Hoja de Ruta del Producto V2',
    directory: 'Recursos Humanos',
    date: '2026-08-08',
    formattedDate: '08 de oct, 2023',
    time: '01:00 PM',
    status: 'Borrador',
    location: 'Laboratorio de Innovación',
    objectives: 'Definición del conjunto de funcionalidades y cronograma para el próximo gran lanzamiento de versión.',
    pointsTreated: `• Análisis de retroalimentación de usuarios sobre transcripción en tiempo real y opciones de exportación.
• Priorización de generación automática de resúmenes, distribución directa por WhatsApp y sincronización con Google Drive.
• El equipo de seguridad revisó las especificaciones de cifrado de extremo a extremo.`,
    keyDecisions: [
      'Lanzamiento de beta privada programado para el 28 de octubre.',
      'Aprobada la integración de la API Web Speech con respaldo de transcripción.'
    ],
    actionItems: [
      {
        id: 'act-m6-1',
        text: 'Finalizar especificaciones de componentes UI para MinuteFlow V2',
        completed: false,
        assignedTo: INITIAL_ATTENDEES[1]
      }
    ],
    attendees: [INITIAL_ATTENDEES[0], INITIAL_ATTENDEES[1], INITIAL_ATTENDEES[2], INITIAL_ATTENDEES[3]],
    folderPath: 'Recursos Humanos / Producto',
    lastEdited: '08 de oct a las 6:10 PM'
  },
  {
    id: 'min-7',
    title: 'Revisión Estratégica Q3',
    directory: 'Reuniones de Directorio Q3',
    date: '2026-10-24',
    formattedDate: '24 de octubre, 2023',
    time: '10:00 AM',
    status: 'Aprobada',
    location: 'Sala de Juntas Ejecutiva',
    objectives: 'Revisión estratégica ejecutiva y alineación para distribución a directivos e interesados.',
    pointsTreated: `• Aprobado presupuesto revisado de marketing para Q4 (Enfoque en canales digitales).
• Inicio del proceso de auditoría y debida diligencia de fusión con AlphaCorp.
• Definición de hitos para la modernización de infraestructura tecnológica.`,
    keyDecisions: [
      'Aprobado presupuesto revisado de marketing para Q4.',
      'Iniciada la debida diligencia para la fusión con AlphaCorp.'
    ],
    actionItems: [
      {
        id: 'act-m7-1',
        text: 'Finalizar informe presupuestario Q4',
        completed: false,
        assignedTo: INITIAL_ATTENDEES[0]
      },
      {
        id: 'act-m7-2',
        text: 'Preparar modelos financieros para revisión',
        completed: false,
        priority: 'High',
        assignedTo: INITIAL_ATTENDEES[3]
      },
      {
        id: 'act-m7-3',
        text: 'Redactar acuerdo de confidencialidad (NDA) para AlphaCorp',
        completed: true,
        priority: 'High',
        assignedTo: INITIAL_ATTENDEES[5]
      }
    ],
    attendees: [INITIAL_ATTENDEES[0], INITIAL_ATTENDEES[1]],
    nextSessionDate: '2026-11-15',
    syncCalendar: true,
    folderPath: 'Reuniones de Directorio Q3 / Oct',
    lastEdited: 'Hace un momento'
  }
];
