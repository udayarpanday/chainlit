export interface IAgent {
  name: string;
  uuid: string;
  description?: string;
}

export interface IAgents {
  agents: IAgent[];
}

export interface ISttModel {
  model?: string | null;
  name?: string | null;
}
