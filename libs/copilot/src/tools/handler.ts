import { ChainlitAPI } from "@chainlit/react-client";
import { registry } from "./registry";
import { toast } from "sonner";
import { ToolRegisterObj } from "@/evoya/types";

async function toolHandler(name: string, args: any, callback: (data: any) => void) {
  try {
    const result = await registry.execute(name, args);
    callback({ status: "ok", result });
  } catch (e) {
    callback({ status: "error", error: e.message });
  }
}

async function registerFrontendToolHandler(apiClient: ChainlitAPI, tools: ToolRegisterObj[] = []) {
  // @ts-expect-error is not a valid prop
  const globalTools = window.evoya_tools ?? [];
  const allTools: ToolRegisterObj[] = [...tools, ...globalTools];
  allTools.forEach((tool) => {
    registry.register(
      {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      },
      tool.handler
    );
  });
  
  window.addEventListener("chainlit-call-fn", (e) => {
    const { name, args, callback } = e.detail;
    toolHandler(name, args, callback);
  });
}

export default registerFrontendToolHandler;