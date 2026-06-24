import { createContext, Script } from "vm";
import { isMainThread, parentPort, workerData } from "worker_threads";
import crypto from "crypto";

function sha256(x, y) {
    const buf = Buffer.alloc(16);
    buf.writeBigUInt64BE(BigInt(x), 0);
    buf.writeBigUInt64BE(BigInt(y), 8);
    const h = crypto.createHash("sha256");
    h.update(buf);
    return h.digest("hex");
}

if (!isMainThread) {
    const { index, chunk, fn, options } = workerData;
    const { initial } = options;
    try {
        const ctx = createContext({ sha256 });
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
