"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const vm_1 = require("vm");
function handleError(index, message) {
    worker_threads_1.parentPort?.postMessage({
        index,
        error: message,
    });
}
if (!worker_threads_1.isMainThread) {
    const { index, code, operation, chunk, initial } = worker_threads_1.workerData;
    switch (operation) {
        case "map":
            {
                try {
                    const ctx = (0, vm_1.createContext)();
                    ctx.data = chunk;
                    ctx.result = undefined;
                    const script = new vm_1.Script(`
                            const fn = ${code};
                            result = data.map(fn);
                        `);
                    script.runInContext(ctx);
                    worker_threads_1.parentPort?.postMessage({
                        index,
                        operation,
                        result: ctx.result,
                    });
                }
                catch (e) {
                    handleError(index, e instanceof Error ? e.message : String(e));
                }
            }
            break;
        case "filter":
            {
                try {
                    const context = (0, vm_1.createContext)({
                        console,
                        Math,
                        Array,
                        JSON,
                    });
                    context.data = chunk;
                    context.result = undefined;
                    const script = new vm_1.Script(`
                        const fn = ${code};
                        result = data.filter(fn);
                    `);
                    script.runInContext(context);
                    const { result } = context;
                    worker_threads_1.parentPort?.postMessage({
                        index,
                        operation,
                        result,
                    });
                }
                catch (e) {
                    handleError(index, e instanceof Error ? e.message : String(e));
                }
            }
            break;
        case "reduce":
            {
                try {
                    const context = (0, vm_1.createContext)({
                        console,
                        Math,
                        Array,
                        JSON,
                    });
                    context.data = chunk;
                    context.result = undefined;
                    context.initial = initial;
                    const script = new vm_1.Script(`
                            const fn = ${code};
                            result = data.reduce(fn, initial);
                        `);
                    script.runInContext(context);
                    console.log("context:", context);
                    const { result } = context;
                    worker_threads_1.parentPort?.postMessage({
                        index,
                        operation,
                        result,
                    });
                }
                catch (e) {
                    handleError(index, e instanceof Error ? e.message : String(e));
                }
            }
            break;
        default:
            handleError(index, "Invalid operation");
            break;
    }
}
//# sourceMappingURL=worker.js.map