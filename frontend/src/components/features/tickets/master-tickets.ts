import { EngineeringTicket } from "./ticket-types";
import { SPRINT_1_TICKETS } from "./sprint1-tickets";
import { SPRINT_2_3_4_TICKETS } from "./sprint-rest-tickets";

export const MASTER_TICKETS: EngineeringTicket[] = [
  ...SPRINT_1_TICKETS,
  ...SPRINT_2_3_4_TICKETS,
];
