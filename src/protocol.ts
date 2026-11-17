export type RunRequest = {
    type: "run";
    id: number;
    source: string;
    input: string;
};

export type WorkerMessage =
    | { type: "ready" }
    | { type: "failed"; message: string }
    | { type: "result"; id: number; ok: boolean; output: string };
