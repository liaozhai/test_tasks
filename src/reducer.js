import { createContext, Script } from "vm";
import { isMainThread, parentPort, workerData } from "worker_threads";

if (!isMainThread) {
    const { index, chunk, fn, options } = workerData;
    const { initial } = options;
    try {
        const ctx = createContext();
        ctx.chunk = chunk;
        ctx.result = undefined;
        ctx.initial = initial;
        const script = new Script(`
            const fn = ${fn};
            result = chunk.reduce(fn, initial);
        `);
        script.runInContext(ctx);
        parentPort.postMessage({ index, result: ctx.result });
    } catch (e) {
        parentPort.postMessage({
            index,
            error: e instanceof Error ? e.message : String(e),
        });
    }
}
