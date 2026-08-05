export interface IAgent {
  name: string;
  uuid: string;
  description?: string;
}

export interface IAgents {
  name: string;
  uuid: string;
  agent_name: boolean;
  description: string;
  agents?: IAgent[];
}
