import { Mastra } from "@mastra/core/mastra";
import { scoutAgent } from "./agents/scout-agent";
import { orchestratorAgent } from "./agents/orchestrator-agent";
import { analystAgent } from "./agents/analyst-agent";
import { profilerAgent } from "./agents/profiler-agent";
import { prospectingWorkflow } from "./workflows/prospecting";

export const mastra = new Mastra({
  agents: {
    scoutAgent,
    orchestratorAgent,
    analystAgent,
    profilerAgent,
  },
  workflows: {
    prospectingWorkflow,
  },
  telemetry: {
    enabled: false,
  },
});

export { scoutCreatorsTool } from "./tools/scout-creators";
export { startNicheWorkflowTool } from "./tools/start-workflow";
export { scoutAgent, orchestratorAgent, analystAgent, profilerAgent };
export { prospectingWorkflow };
