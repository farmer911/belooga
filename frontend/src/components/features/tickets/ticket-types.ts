export type TicketStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type PodAssignee = "@be-senior" | "@fe-lead" | "@qc-lead" | "@des-lead" | "@ops-lead";
export type PriorityLevel = "P0" | "P1" | "P2";

export interface EngineeringTicket {
  id: string;
  title: string;
  description: string;
  assignee: PodAssignee;
  sprint: number;
  priority: PriorityLevel;
  points: number;
  status: TicketStatus;
  acceptanceCriteria: string[];
  liveUrl?: string;
  evidenceCommand?: string;
}
