// ── toolRegistry.js ──
import {
  ToolRegistryInterface,
  ToolSpecBase,
  ToolSpec
} from "@/evoya/types";

class ToolRegistry implements ToolRegistryInterface {
  _tools;
  constructor() {
    this._tools = new Map<string, ToolSpecBase>();
  }

  /**
   * Registriert eine JS-Funktion als Tool.
   * Spec folgt dem OpenAI function calling Schema.
   */
  register(spec: ToolSpec, fn: (args: any) => any) {
    if (!spec.name || !spec.description) {
      throw new Error(`Tool spec needs 'name' and 'description'`);
    }
    this._tools.set(spec.name, {
      spec: {
        name: spec.name,
        description: spec.description,
        parameters: spec.parameters ?? { type: "object", properties: {}, required: [] },
      },
      fn,
    });
    return this; // chainable
  }

  /** Alle Specs als JSON – das geht an den Python-Backend */
  getSpecs() {
    return [...this._tools.values()].map((t) => t.spec);
  }

  /** Führt ein Tool aus (vom Agent-Call getriggert) */
  async execute(name: string, args = {}) {
    const tool = this._tools.get(name);
    if (!tool) throw new Error(`Unknown tool: ${name}`);
    return await tool.fn(args);
  }
}

export const registry = new ToolRegistry();
