export interface ICommand {
  id: string;
  icon: string;
  description: string;
  button?: boolean;
  persistent?: boolean;
  selected?: boolean;
  prompt_content?: string;
  content?: string;
  for?: string;
  args?: Record<string, any>;
}
