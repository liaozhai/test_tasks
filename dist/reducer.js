"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vm_1 = require("vm");
const worker_threads_1 = require("worker_threads");
if (!worker_threads_1.isMainThread) {
    const { index, chunk, fn, options } = worker_threads_1.workerData;
    const { initial } = options;
    try {
        const ctx = (0, vm_1.createContext)();
        ctx.chunk = chunk;
        ctx.result = undefined;
        ctx.initial = initial;
        const script = new vm_1.Script(`
            const fn = ${fn};
            result = chunk.reduce(fn, initial);
        `);
        script.runInContext(ctx);
        worker_threads_1.parentPort.postMessage({ index, result: ctx.result });
    }
    catch (e) {
        worker_threads_1.parentPort.postMessage({
            index,
            error: e instanceof Error ? e.message : String(e),
        });
    }
}
//# sourceMappingURL=reducer.js.map