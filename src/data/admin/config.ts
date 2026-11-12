/**
 * Admin demo configuration: request types ("automations"), team, board
 * columns and tool logos. Edit here to change what the /admin demo shows.
 * The seeded tickets and per-type state live in ./sample.json.
 */

export type TicketStatus = 'new' | 'in_progress' | 'waiting' | 'done';
export type SetupStage = 'backlog' | 'setup' | 'testing' | 'live' | 'paused';

export interface Automation {
  slug: string;
  category: 'agency';
  tag: string;
  title: string;
  summary: string;
  component: string;
  placement: string;
  trigger: string;
  /** Editable settings shown in the setup panel. */
  settings: string[];
  stack: ToolName[];
}

export type ToolName = 'Supabase' | 'Resend' | 'Cal.com';

export interface TeamMember {
  name: string;
  role: string;
}

export interface BoardColumn<Id extends string> {
  id: Id;
  label: string;
  /** Dot colour token, see .admin-dot--* in src/styles/admin.css */
  dot: 'foreground' | 'amber' | 'muted' | 'emerald' | 'neutral' | 'rose';
  icon: string;
}

export const automations: Automation[] = [
  {
    slug: 'lead-qualification',
    category: 'agency',
    tag: 'Agencia',
    title: 'Calificación de leads',
    summary:
      'Preguntá tipo de proyecto, presupuesto, plazos y objetivos antes de la primera llamada.',
    component: 'LeadQualificationForm',
    placement: '/contact, pestaña «Iniciar un proyecto»',
    trigger: 'Un visitante envía el formulario de consulta',
    settings: ['Preguntas', 'Calificado si', 'Leads no calificados'],
    stack: ['Supabase', 'Resend'],
  },
  {
    slug: 'instant-enquiry-replies',
    category: 'agency',
    tag: 'Agencia',
    title: 'Respuestas instantáneas',
    summary: 'Mandá una confirmación y los próximos pasos apenas alguien envía el formulario.',
    component: 'EnquiryReply',
    placement: '/contact, se muestra al enviar el formulario «Enviar un brief»',
    trigger: 'Se envía cualquier formulario de consulta',
    settings: ['Email de respuesta', 'Enviar desde', 'Incluir'],
    stack: ['Resend'],
  },
  {
    slug: 'lead-routing',
    category: 'agency',
    tag: 'Agencia',
    title: 'Derivación de leads',
    summary:
      'Derivá las consultas calificadas a tu bandeja, CRM, tablero de proyectos o agenda, en automático.',
    component: 'ServicePicker',
    placement: '/contact, pestaña «Hablar con un especialista»',
    trigger: 'Un lead se marca como calificado',
    settings: ['Enviar a', 'Reglas', 'Avisar a'],
    stack: ['Supabase', 'Resend'],
  },
  {
    slug: 'client-onboarding',
    category: 'agency',
    tag: 'Agencia',
    title: 'Onboarding de clientes',
    summary:
      'Enviá un email de bienvenida, el cuestionario del proyecto y el link para agendar apenas firma un cliente.',
    component: 'OnboardingQuestionnaire',
    placement: '/onboarding, la página privada enlazada en el email de bienvenida',
    trigger: 'Un cliente se marca como firmado',
    settings: ['Email de bienvenida', 'Cuestionario', 'Llamada inicial'],
    stack: ['Supabase', 'Resend', 'Cal.com'],
  },
  {
    slug: 'follow-up-reminders',
    category: 'agency',
    tag: 'Agencia',
    title: 'Recordatorios de seguimiento',
    summary:
      'Creá recordatorios para propuestas, pedidos de feedback, hitos del proyecto y controles post-lanzamiento.',
    component: 'FeedbackRequest',
    placement: '/feedback, la página privada a la que enlazan tus emails de seguimiento',
    trigger: 'Vence una propuesta, un hito o una fecha de lanzamiento',
    settings: ['Seguimiento de propuesta', 'Pedido de feedback', 'Control'],
    stack: ['Supabase', 'Resend'],
  },
];

export const team: TeamMember[] = [
  { name: 'Líder de marca', role: 'sistemas de identidad' },
  { name: 'Líder web', role: 'sitios de marketing' },
  { name: 'Líder de producto', role: 'diseño de producto y front-end' },
  { name: 'Líder de estudio', role: 'proyectos nuevos' },
];

export const ticketColumns: BoardColumn<TicketStatus>[] = [
  { id: 'new', label: 'Nuevos', dot: 'foreground', icon: 'inbox' },
  { id: 'in_progress', label: 'En curso', dot: 'amber', icon: 'hourglass-half' },
  { id: 'waiting', label: 'En espera', dot: 'muted', icon: 'clock' },
  { id: 'done', label: 'Listos', dot: 'emerald', icon: 'check-circle' },
];

export const setupColumns: BoardColumn<SetupStage>[] = [
  { id: 'backlog', label: 'Pendientes', dot: 'neutral', icon: 'inbox' },
  { id: 'setup', label: 'Configurando', dot: 'foreground', icon: 'wrench' },
  { id: 'testing', label: 'En prueba', dot: 'amber', icon: 'flask' },
  { id: 'live', label: 'Activos', dot: 'emerald', icon: 'play-circle' },
  { id: 'paused', label: 'Pausados', dot: 'rose', icon: 'pause-circle' },
];

export const toolLogos: Record<ToolName, string> = {
  'Cal.com': '/automations/icons/cal-com.svg',
  Resend: '/automations/icons/resend.svg',
  Supabase: '/automations/icons/supabase.svg',
};

/** Ticket-key prefix per category for the setup cards (AG-1, AG-2…). */
export const categoryCodes: Record<Automation['category'], string> = { agency: 'AG' };
