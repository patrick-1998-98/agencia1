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
    tag: 'Agency',
    title: 'Lead qualification',
    summary: 'Ask about project type, budget, timeline and goals before the first call.',
    component: 'LeadQualificationForm',
    placement: '/contact, the Start a project tab',
    trigger: 'A visitor submits the enquiry form',
    settings: ['Questions', 'Qualified when', 'Unqualified leads'],
    stack: ['Supabase', 'Resend'],
  },
  {
    slug: 'instant-enquiry-replies',
    category: 'agency',
    tag: 'Agency',
    title: 'Instant enquiry replies',
    summary: 'Send a confirmation and next steps the moment someone submits the form.',
    component: 'EnquiryReply',
    placement: '/contact, shown once the Send a brief form is sent',
    trigger: 'Any enquiry form is submitted',
    settings: ['Reply email', 'Send from', 'Include'],
    stack: ['Resend'],
  },
  {
    slug: 'lead-routing',
    category: 'agency',
    tag: 'Agency',
    title: 'Lead routing',
    summary:
      'Send qualified enquiries to your inbox, CRM, project board or booking tool automatically.',
    component: 'ServicePicker',
    placement: '/contact, the Talk to a specialist tab',
    trigger: 'A lead is marked as qualified',
    settings: ['Send to', 'Rules', 'Notify'],
    stack: ['Supabase', 'Resend'],
  },
  {
    slug: 'client-onboarding',
    category: 'agency',
    tag: 'Agency',
    title: 'Client onboarding',
    summary:
      'Share a welcome email, project questionnaire and booking link as soon as a client signs.',
    component: 'OnboardingQuestionnaire',
    placement: '/onboarding, the private page linked from the welcome email',
    trigger: 'A client is marked as signed',
    settings: ['Welcome email', 'Questionnaire', 'Kickoff call'],
    stack: ['Supabase', 'Resend', 'Cal.com'],
  },
  {
    slug: 'follow-up-reminders',
    category: 'agency',
    tag: 'Agency',
    title: 'Follow-up reminders',
    summary:
      'Create reminders for proposals, feedback requests, project milestones and post-launch check-ins.',
    component: 'FeedbackRequest',
    placement: '/feedback, the private page your follow-up emails link to',
    trigger: 'A proposal, milestone or launch date passes',
    settings: ['Proposal follow-up', 'Feedback request', 'Check-in'],
    stack: ['Supabase', 'Resend'],
  },
];

export const team: TeamMember[] = [
  { name: 'Brand lead', role: 'identity systems' },
  { name: 'Web lead', role: 'marketing sites' },
  { name: 'Product lead', role: 'product design and front-end' },
  { name: 'Studio lead', role: 'new projects' },
];

export const ticketColumns: BoardColumn<TicketStatus>[] = [
  { id: 'new', label: 'New', dot: 'foreground', icon: 'inbox' },
  { id: 'in_progress', label: 'In progress', dot: 'amber', icon: 'hourglass-half' },
  { id: 'waiting', label: 'Waiting', dot: 'muted', icon: 'clock' },
  { id: 'done', label: 'Done', dot: 'emerald', icon: 'check-circle' },
];

export const setupColumns: BoardColumn<SetupStage>[] = [
  { id: 'backlog', label: 'Backlog', dot: 'neutral', icon: 'inbox' },
  { id: 'setup', label: 'Setting up', dot: 'foreground', icon: 'wrench' },
  { id: 'testing', label: 'Testing', dot: 'amber', icon: 'flask' },
  { id: 'live', label: 'Live', dot: 'emerald', icon: 'play-circle' },
  { id: 'paused', label: 'Paused', dot: 'rose', icon: 'pause-circle' },
];

export const toolLogos: Record<ToolName, string> = {
  'Cal.com': '/automations/icons/cal-com.svg',
  Resend: '/automations/icons/resend.svg',
  Supabase: '/automations/icons/supabase.svg',
};

/** Ticket-key prefix per category for the setup cards (AG-1, AG-2…). */
export const categoryCodes: Record<Automation['category'], string> = { agency: 'AG' };
