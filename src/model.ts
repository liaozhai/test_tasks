export type Operation = "map" | "filter" | "reduce";

export type Task = {
    index: number;
    code: string;
    operation: Operation;
    chunk: any[];
    initial: any;
};

export type Result =
    | { index: number; success: true; result: any[] }
    | { index: number; success: true; result: any }
    | { index: number; success: false; error: string };
