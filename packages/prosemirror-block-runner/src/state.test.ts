import { EditorState } from "prosemirror-state";
import {
  createActiveState,
  createIdleState,
  createProcessingUnit,
  createResultDecoration,
  createRunnerOptions,
  mockDateNow,
  TestContext,
  TestMetadata,
  TestResponse,
} from "./testHelpers";
import { createInitialState, handleAction } from "./state";
import {
  ActionType,
  DecorationFactory,
  ProcessingUnit,
  ResultDecoration,
  RunnerStatus,
  UnitStatus,
} from "./types";

// Mock decoration factory for tests
const mockDecorationFactory: DecorationFactory<TestResponse, TestMetadata> = (
  response: TestResponse,
  unit: ProcessingUnit<TestMetadata>
): ResultDecoration<TestResponse>[] => {
  return [
    createResultDecoration(unit.from, unit.to, response, { unitId: unit.id }),
  ];
};

// Mock EditorState (minimal for non-INIT actions)
const mockEditorState = {} as EditorState;

describe("createInitialState", () => {
  it("returns IDLE state with given context and options", () => {
    const context: TestContext = { enabled: true };
    const options = createRunnerOptions<
      TestResponse,
      TestContext,
      TestMetadata
    >();

    const state = createInitialState<TestResponse, TestContext, TestMetadata>(
      context,
      options
    );

    expect(state.status).toBe(RunnerStatus.IDLE);
    expect(state.decorations).toEqual([]);
    expect(state.selected).toBeUndefined();
    expect(state.contextState).toBe(context);
    expect(state.options).toBe(options);
  });
});

describe("handleAction", () => {
  describe("UNIT_STARTED", () => {
    it("changes unit status to PROCESSING", () => {
      const unitId = {};
      const units = [
        createProcessingUnit({ id: unitId, status: UnitStatus.QUEUED }),
      ];
      const state = createActiveState<TestResponse, TestContext, TestMetadata>({
        unitsInProgress: units,
      });

      const newState = handleAction(
        state,
        { type: ActionType.UNIT_STARTED, unitId },
        mockDecorationFactory,
        mockEditorState
      );

      expect(newState.status).toBe(RunnerStatus.ACTIVE);
      if (newState.status === RunnerStatus.ACTIVE) {
        expect(newState.unitsInProgress[0].status).toBe(UnitStatus.PROCESSING);
      }
    });

    it("captures requestText when processing starts", () => {
      const unitId = {};
      const units = [
        createProcessingUnit({
          id: unitId,
          status: UnitStatus.QUEUED,
          text: "original text",
        }),
      ];
      const state = createActiveState<TestResponse, TestContext, TestMetadata>({
        unitsInProgress: units,
      });

      const newState = handleAction(
        state,
        { type: ActionType.UNIT_STARTED, unitId },
        mockDecorationFactory,
        mockEditorState
      );

      expect(newState.status).toBe(RunnerStatus.ACTIVE);
      if (newState.status === RunnerStatus.ACTIVE) {
        expect(newState.unitsInProgress[0].requestText).toBe("original text");
      }
    });

    it("returns unchanged state if IDLE", () => {
      const state = createIdleState<TestResponse, TestContext, TestMetadata>();
      const unitId = {};

      const newState = handleAction(
        state,
        { type: ActionType.UNIT_STARTED, unitId },
        mockDecorationFactory,
        mockEditorState
      );

      expect(newState).toBe(state);
    });
  });

  describe("UNIT_SUCCESS", () => {
    it("changes unit status to DONE and adds decorations", () => {
      const unitId = {};
      const units = [
        createProcessingUnit({
          id: unitId,
          status: UnitStatus.PROCESSING,
          from: 0,
          to: 10,
        }),
      ];
      const state = createActiveState<TestResponse, TestContext, TestMetadata>({
        unitsInProgress: units,
        decorations: [],
      });

      const response: TestResponse = { result: "success" };
      const newState = handleAction(
        state,
        { type: ActionType.UNIT_SUCCESS, unitId, response },
        mockDecorationFactory,
        mockEditorState
      );

      expect(newState.status).toBe(RunnerStatus.ACTIVE);
      if (newState.status === RunnerStatus.ACTIVE) {
        expect(newState.unitsInProgress[0].status).toBe(UnitStatus.DONE);
        expect(newState.unitsInProgress[0].response).toBe(response);
        expect(newState.decorations.length).toBe(1);
      }
    });

    it("creates decorations when text unchanged (fresh response)", () => {
      const unitId = {};
      const units = [
        createProcessingUnit({
          id: unitId,
          status: UnitStatus.PROCESSING,
          from: 0,
          to: 10,
          text: "same text",
          requestText: "same text",
        }),
      ];
      const state = createActiveState<TestResponse, TestContext, TestMetadata>({
        unitsInProgress: units,
        decorations: [],
      });

      const response: TestResponse = { result: "success" };
      const newState = handleAction(
        state,
        { type: ActionType.UNIT_SUCCESS, unitId, response },
        mockDecorationFactory,
        mockEditorState
      );

      expect(newState.status).toBe(RunnerStatus.ACTIVE);
      if (newState.status === RunnerStatus.ACTIVE) {
        expect(newState.unitsInProgress[0].status).toBe(UnitStatus.DONE);
        expect(newState.decorations.length).toBe(1);
        expect(newState.unitsInProgress[0].requestText).toBeUndefined();
      }
    });

    it("marks DIRTY and skips decorations when text changed (stale response)", () => {
      const restoreDate = mockDateNow(1000);
      try {
        const unitId = {};
        const debounceDelay = 300;
        const options = createRunnerOptions<
          TestResponse,
          TestContext,
          TestMetadata
        >({
          dirtyHandling: {
            shouldRecalculate: true,
            debounceDelay,
            skipDirtyOnSelfChange: true,
          },
        });
        const units = [
          createProcessingUnit({
            id: unitId,
            status: UnitStatus.PROCESSING,
            from: 0,
            to: 15,
            text: "modified text",
            requestText: "original text",
          }),
        ];
        const state = createActiveState<
          TestResponse,
          TestContext,
          TestMetadata
        >({
          unitsInProgress: units,
          decorations: [],
          options,
        });

        const response: TestResponse = { result: "stale result" };
        const newState = handleAction(
          state,
          { type: ActionType.UNIT_SUCCESS, unitId, response },
          mockDecorationFactory,
          mockEditorState
        );

        expect(newState.status).toBe(RunnerStatus.ACTIVE);
        if (newState.status === RunnerStatus.ACTIVE) {
          expect(newState.unitsInProgress[0].status).toBe(UnitStatus.DIRTY);
          expect(newState.decorations.length).toBe(0);
          expect(newState.unitsInProgress[0].requestText).toBeUndefined();
          expect(newState.unitsInProgress[0].waitUntil).toBe(
            1000 + debounceDelay
          );
        }
      } finally {
        restoreDate();
      }
    });

    it("returns unchanged state if IDLE", () => {
      const state = createIdleState<TestResponse, TestContext, TestMetadata>();
      const unitId = {};

      const newState = handleAction(
        state,
        { type: ActionType.UNIT_SUCCESS, unitId, response: { result: "test" } },
        mockDecorationFactory,
        mockEditorState
      );

      expect(newState).toBe(state);
    });
  });

  describe("UNIT_ERROR", () => {
    it("sets BACKOFF with waitUntil when retries < maxRetries", () => {
      const restoreDate = mockDateNow(1000);
      try {
        const unitId = {};
        const options = createRunnerOptions<
          TestResponse,
          TestContext,
          TestMetadata
        >({
          maxRetries: 3,
          backoffBase: 1000,
        });
        const units = [
          createProcessingUnit({
            id: unitId,
            status: UnitStatus.PROCESSING,
            retryCount: 0,
          }),
        ];
        const state = createActiveState<
          TestResponse,
          TestContext,
          TestMetadata
        >({
          unitsInProgress: units,
          options,
        });

        const newState = handleAction(
          state,
          {
            type: ActionType.UNIT_ERROR,
            unitId,
            error: new Error("test error"),
          },
          mockDecorationFactory,
          mockEditorState
        );

        expect(newState.status).toBe(RunnerStatus.ACTIVE);
        if (newState.status === RunnerStatus.ACTIVE) {
          expect(newState.unitsInProgress[0].status).toBe(UnitStatus.BACKOFF);
          expect(newState.unitsInProgress[0].retryCount).toBe(1);
          expect(newState.unitsInProgress[0].waitUntil).toBeGreaterThan(1000);
        }
      } finally {
        restoreDate();
      }
    });

    it("sets ERROR when retries >= maxRetries", () => {
      const unitId = {};
      const options = createRunnerOptions<
        TestResponse,
        TestContext,
        TestMetadata
      >({
        maxRetries: 3,
      });
      const units = [
        createProcessingUnit({
          id: unitId,
          status: UnitStatus.PROCESSING,
          retryCount: 2,
        }),
      ];
      const state = createActiveState<TestResponse, TestContext, TestMetadata>({
        unitsInProgress: units,
        options,
      });

      const newState = handleAction(
        state,
        { type: ActionType.UNIT_ERROR, unitId, error: new Error("test error") },
        mockDecorationFactory,
        mockEditorState
      );

      expect(newState.status).toBe(RunnerStatus.ACTIVE);
      if (newState.status === RunnerStatus.ACTIVE) {
        expect(newState.unitsInProgress[0].status).toBe(UnitStatus.ERROR);
        expect(newState.unitsInProgress[0].retryCount).toBe(3);
      }
    });

    it("marks DIRTY when text changed (stale error)", () => {
      const restoreDate = mockDateNow(1000);
      try {
        const unitId = {};
        const debounceDelay = 300;
        const options = createRunnerOptions<
          TestResponse,
          TestContext,
          TestMetadata
        >({
          maxRetries: 3,
          dirtyHandling: {
            shouldRecalculate: true,
            debounceDelay,
            skipDirtyOnSelfChange: true,
          },
        });
        const units = [
          createProcessingUnit({
            id: unitId,
            status: UnitStatus.PROCESSING,
            retryCount: 0,
            text: "modified text",
            requestText: "original text",
          }),
        ];
        const state = createActiveState<
          TestResponse,
          TestContext,
          TestMetadata
        >({
          unitsInProgress: units,
          options,
        });

        const newState = handleAction(
          state,
          {
            type: ActionType.UNIT_ERROR,
            unitId,
            error: new Error("stale error"),
          },
          mockDecorationFactory,
          mockEditorState
        );

        expect(newState.status).toBe(RunnerStatus.ACTIVE);
        if (newState.status === RunnerStatus.ACTIVE) {
          expect(newState.unitsInProgress[0].status).toBe(UnitStatus.DIRTY);
          expect(newState.unitsInProgress[0].retryCount).toBe(0); // Not incremented
          expect(newState.unitsInProgress[0].requestText).toBeUndefined();
          expect(newState.unitsInProgress[0].waitUntil).toBe(
            1000 + debounceDelay
          );
        }
      } finally {
        restoreDate();
      }
    });

    it("increments retryCount on each error", () => {
      const unitId = {};
      const options = createRunnerOptions<
        TestResponse,
        TestContext,
        TestMetadata
      >({
        maxRetries: 5,
      });
      const units = [
        createProcessingUnit({
          id: unitId,
          status: UnitStatus.PROCESSING,
          retryCount: 2,
        }),
      ];
      const state = createActiveState<TestResponse, TestContext, TestMetadata>({
        unitsInProgress: units,
        options,
      });

      const newState = handleAction(
        state,
        { type: ActionType.UNIT_ERROR, unitId, error: new Error("test error") },
        mockDecorationFactory,
        mockEditorState
      );

      if (newState.status === RunnerStatus.ACTIVE) {
        expect(newState.unitsInProgress[0].retryCount).toBe(3);
      }
    });

    it("returns unchanged state if IDLE", () => {
      const state = createIdleState<TestResponse, TestContext, TestMetadata>();
      const unitId = {};

      const newState = handleAction(
        state,
        { type: ActionType.UNIT_ERROR, unitId, error: new Error("test") },
        mockDecorationFactory,
        mockEditorState
      );

      expect(newState).toBe(state);
    });
  });

  describe("FINISH", () => {
    it("changes ACTIVE to IDLE and preserves decorations", () => {
      const decorations = [createResultDecoration(0, 5, { result: "test" })];
      const state = createActiveState<TestResponse, TestContext, TestMetadata>({
        decorations,
      });

      const newState = handleAction(
        state,
        { type: ActionType.FINISH },
        mockDecorationFactory,
        mockEditorState
      );

      expect(newState.status).toBe(RunnerStatus.IDLE);
      expect(newState.decorations).toEqual(decorations);
    });
  });

  describe("CLEAR", () => {
    it("clears decorations, selected, and sets status to IDLE", () => {
      const decorations = [createResultDecoration(0, 5, { result: "test" })];
      const selected = {};
      const state = createActiveState<TestResponse, TestContext, TestMetadata>({
        decorations,
        selected,
      });

      const newState = handleAction(
        state,
        { type: ActionType.CLEAR },
        mockDecorationFactory,
        mockEditorState
      );

      expect(newState.status).toBe(RunnerStatus.IDLE);
      expect(newState.decorations).toEqual([]);
      expect(newState.selected).toBeUndefined();
    });
  });

  describe("UPDATE_CONTEXT", () => {
    it("updates contextState", () => {
      const state = createActiveState<TestResponse, TestContext, TestMetadata>({
        contextState: { enabled: false },
      });

      const newContext: TestContext = { enabled: true };
      const newState = handleAction(
        state,
        { type: ActionType.UPDATE_CONTEXT, contextState: newContext },
        mockDecorationFactory,
        mockEditorState
      );

      expect(newState.contextState).toEqual(newContext);
    });
  });

  describe("REMOVE_DECORATION", () => {
    it("removes decoration by spec.id", () => {
      const decorationId = {};
      const otherId = {};
      const decorations = [
        createResultDecoration(
          0,
          5,
          { result: "remove" },
          { id: decorationId }
        ),
        createResultDecoration(10, 15, { result: "keep" }, { id: otherId }),
      ];
      const state = createActiveState<TestResponse, TestContext, TestMetadata>({
        decorations,
      });

      const newState = handleAction(
        state,
        { type: ActionType.REMOVE_DECORATION, id: decorationId },
        mockDecorationFactory,
        mockEditorState
      );

      expect(newState.decorations.length).toBe(1);
      expect(newState.decorations[0].spec.id).toBe(otherId);
    });
  });

  describe("SELECT_DECORATION", () => {
    it("sets selected to the given id", () => {
      const state = createActiveState<TestResponse, TestContext, TestMetadata>({
        selected: undefined,
      });
      const decorationId = {};

      const newState = handleAction(
        state,
        { type: ActionType.SELECT_DECORATION, id: decorationId },
        mockDecorationFactory,
        mockEditorState
      );

      expect(newState.selected).toBe(decorationId);
    });
  });

  describe("DESELECT_DECORATION", () => {
    it("clears selected", () => {
      const selected = {};
      const state = createActiveState<TestResponse, TestContext, TestMetadata>({
        selected,
      });

      const newState = handleAction(
        state,
        { type: ActionType.DESELECT_DECORATION },
        mockDecorationFactory,
        mockEditorState
      );

      expect(newState.selected).toBeUndefined();
    });
  });

  describe("UNIT_SUCCESS decoration replacement", () => {
    it("replaces old decorations for the same unit", () => {
      const unitId = {};
      const unit = createProcessingUnit({
        id: unitId,
        status: UnitStatus.PROCESSING,
        from: 0,
        to: 10,
        text: "new text",
        requestText: "new text",
      });
      const oldDecoration = createResultDecoration(
        0,
        5,
        { result: "old" },
        { unitId }
      );
      const state = createActiveState<TestResponse, TestContext, TestMetadata>({
        unitsInProgress: [unit],
        decorations: [oldDecoration],
      });

      const response: TestResponse = { result: "new" };
      const newState = handleAction(
        state,
        { type: ActionType.UNIT_SUCCESS, unitId, response },
        mockDecorationFactory,
        mockEditorState
      );

      expect(newState.decorations.length).toBe(1);
      expect(newState.decorations[0].spec.unitId).toBe(unitId);
      // The decoration should be from the new factory call, not the old one
      if (newState.status === RunnerStatus.ACTIVE) {
        expect(newState.unitsInProgress[0].status).toBe(UnitStatus.DONE);
      }
    });

    it("preserves decorations from other units", () => {
      const unitId1 = {};
      const unitId2 = {};
      const unit1 = createProcessingUnit({
        id: unitId1,
        status: UnitStatus.PROCESSING,
        from: 0,
        to: 10,
        text: "text1",
        requestText: "text1",
      });
      const unit2 = createProcessingUnit({
        id: unitId2,
        status: UnitStatus.DONE,
        from: 15,
        to: 25,
        text: "text2",
      });
      const otherDecoration = createResultDecoration(
        15,
        25,
        { result: "other" },
        { unitId: unitId2 }
      );
      const state = createActiveState<TestResponse, TestContext, TestMetadata>({
        unitsInProgress: [unit1, unit2],
        decorations: [otherDecoration],
      });

      const response: TestResponse = { result: "new" };
      const newState = handleAction(
        state,
        { type: ActionType.UNIT_SUCCESS, unitId: unitId1, response },
        mockDecorationFactory,
        mockEditorState
      );

      // Should have both: the preserved decoration from unit2 + new one from unit1
      expect(newState.decorations.length).toBe(2);
      expect(newState.decorations.some((d) => d.spec.unitId === unitId2)).toBe(
        true
      );
      expect(newState.decorations.some((d) => d.spec.unitId === unitId1)).toBe(
        true
      );
    });
  });

  describe("MAP_UNIT_METADATA", () => {
    it("marks affected units DIRTY and preserves decorations until re-processed", () => {
      const unitId = {};
      const unit = createProcessingUnit({
        id: unitId,
        status: UnitStatus.DONE,
        from: 0,
        to: 10,
        text: "text",
      });
      const decoration = createResultDecoration(
        0,
        5,
        { result: "old" },
        { unitId }
      );
      const state = createActiveState<TestResponse, TestContext, TestMetadata>({
        unitsInProgress: [unit],
        decorations: [decoration],
      });

      const newState = handleAction(
        state,
        {
          type: ActionType.MAP_UNIT_METADATA,
          mapFunction: (metadata: TestMetadata) => ({
            ...metadata,
            label: "updated",
          }),
        },
        mockDecorationFactory,
        mockEditorState
      );

      if (newState.status === RunnerStatus.ACTIVE) {
        expect(newState.unitsInProgress[0].status).toBe(UnitStatus.DIRTY);
      }
      // Decorations should be preserved (not removed eagerly)
      expect(newState.decorations.length).toBe(1);
    });

    it("returns unchanged state when no units affected", () => {
      const unitId = {};
      const unit = createProcessingUnit({
        id: unitId,
        status: UnitStatus.DONE,
        from: 0,
        to: 10,
        text: "text",
      });
      const state = createActiveState<TestResponse, TestContext, TestMetadata>({
        unitsInProgress: [unit],
      });

      const newState = handleAction(
        state,
        {
          type: ActionType.MAP_UNIT_METADATA,
          mapFunction: () => false,
        },
        mockDecorationFactory,
        mockEditorState
      );

      expect(newState).toBe(state);
    });
  });

  describe("unknown action", () => {
    it("returns unchanged state", () => {
      const state = createActiveState<
        TestResponse,
        TestContext,
        TestMetadata
      >();

      const newState = handleAction(
        state,
        { type: "UNKNOWN_ACTION" as ActionType } as never,
        mockDecorationFactory,
        mockEditorState
      );

      expect(newState).toBe(state);
    });
  });
});
