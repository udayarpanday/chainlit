export interface IAgent {
  name: string;
  uuid: string;
  description?: string;
}

export interface IAgents {
  agents: IAgent[];
}
