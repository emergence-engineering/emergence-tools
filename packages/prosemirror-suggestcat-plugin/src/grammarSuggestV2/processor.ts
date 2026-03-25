import { EditorView } from "prosemirror-view";
import { PluginKey } from "prosemirror-state";
import { getDiff, isIdentity } from "@emergence-engineering/fast-diff-merge";
import {
  ProcessingUnit,
  RunnerState,
  UnitProcessorResult,
} from "@emergence-engineering/prosemirror-block-runner";
import { grammarRequest } from "../api";
import { AiPromptsWithParam } from "../types";
import {
  GrammarContextState,
  GrammarFixResult,
  GrammarSuggestion,
  GrammarUnitMetadata,
} from "./types";
import { ModelStateManager } from "./modelState";

// Parse suggestions from diff between original and fixed text
function parseSuggestions(
  originalText: string,
  fixedText: string,
): GrammarSuggestion[] {
  return getDiff(originalText, fixedText)
    .filter((diff) => !isIdentity(diff))
    .filter((diff) => diff.original !== `${diff.replacement}\n`)
    .map((diff) => ({
      from: diff.from,
      to: diff.replacement.endsWith("\n") ? diff.to - 1 : diff.to,
      original: diff.original,
      replacement: diff.replacement.endsWith("\n")
        ? diff.replacement.slice(0, -1)
        : diff.replacement,
    }));
}

export interface GrammarProcessorOptions {
  apiKey: string;
  apiEndpoint?: string;
  model?: string;
  modelStateManager?: ModelStateManager;
  pluginKey?: PluginKey<
    RunnerState<GrammarFixResult, GrammarContextState, GrammarUnitMetadata>
  >;
}

// Create processor with API options
export const createGrammarProcessor = (
  options: GrammarProcessorOptions | string,
) => {
  // Support both old (string) and new (object) API
  const { apiKey, apiEndpoint, model, modelStateManager, pluginKey } =
    typeof options === "string"
      ? {
          apiKey: options,
          apiEndpoint: undefined,
          model: undefined,
          modelStateManager: undefined,
          pluginKey: undefined,
        }
      : options;

  return async (
    view: EditorView,
    unit: ProcessingUnit<GrammarUnitMetadata>,
  ): Promise<UnitProcessorResult<GrammarFixResult>> => {
    try {
      // Get current model (may be fallback if primary has failed)
      const currentModel = modelStateManager?.getCurrentModel() ?? model;

      // Read systemPrompt from plugin context state if available
      const systemPrompt = pluginKey
        ? pluginKey.getState(view.state)?.contextState.systemPrompt
        : undefined;

      // Call the grammar API using centralized request
      const result = await grammarRequest({
        apiKey,
        text: unit.text,
        endpoint: apiEndpoint,
        model: currentModel,
        ...(systemPrompt && {
          task: AiPromptsWithParam.Custom,
          params: { systemPrompt },
        }),
      });

      // Handle model state based on result
      if (result.error) {
        modelStateManager?.handleFailure();
        return {
          error: new Error("Grammar API error"),
        };
      }

      modelStateManager?.handleSuccess();

      if (!result.fixed) {
        // No fixes needed
        return {
          data: {
            fixed: false,
            originalText: unit.text,
            fixedText: unit.text,
            suggestions: [],
          },
        };
      }

      // Parse the suggestions from the diff
      const suggestions = parseSuggestions(unit.text, result.result);

      return {
        data: {
          fixed: suggestions.length > 0,
          originalText: unit.text,
          fixedText: result.result,
          suggestions,
        },
      };
    } catch (error) {
      modelStateManager?.handleFailure();
      return {
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  };
};
