"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vm_1 = require("vm");
const worker_threads_1 = require("worker_threads");
if (!worker_threads_1.isMainThread) {
    try {
        const { index, chunk, fn } = worker_threads_1.workerData;
        const ctx = (0, vm_1.createContext)();
        ctx.chunk = chunk;
        ctx.result = undefined;
        const script = new vm_1.Script(`
            const fn = ${fn};
            result = chunk.map(fn);
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
//# sourceMappingURL=mapper.js.map