import { createContext, Script } from "vm";
import { isMainThread, parentPort, workerData } from "worker_threads";

if (!isMainThread) {
    try {
        const { index, chunk, fn } = workerData;
        const ctx = createContext();
        ctx.chunk = chunk;
        ctx.result = undefined;
        const script = new Script(`
            const fn = ${fn};
            result = chunk.filter(fn);
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
