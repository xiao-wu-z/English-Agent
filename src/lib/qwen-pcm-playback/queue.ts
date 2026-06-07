export type QwenPlaybackItem = {
  encoding: string;
  data: string;
};

export type QwenPlaybackQueueState = {
  queue: QwenPlaybackItem[];
  status: "idle" | "queued" | "playing" | "failed";
  errorMessage?: string;
};

export type QwenPlaybackQueueAction =
  | {
      type: "enqueue";
      item: QwenPlaybackItem;
    }
  | {
      type: "consume";
    }
  | {
      type: "fail";
      message: string;
    }
  | {
      type: "clear";
    };

export function reducePlaybackQueue(
  state: QwenPlaybackQueueState,
  action: QwenPlaybackQueueAction,
): QwenPlaybackQueueState {
  if (action.type === "enqueue") {
    return {
      ...state,
      status: state.status === "playing" ? "playing" : "queued",
      queue: [...state.queue, action.item],
    };
  }
  if (action.type === "consume") {
    return {
      ...state,
      status: "playing",
      queue: state.queue.slice(1),
    };
  }
  if (action.type === "fail") {
    return {
      queue: state.queue,
      status: "failed",
      errorMessage: action.message,
    };
  }
  return {
    queue: [],
    status: "idle",
  };
}
