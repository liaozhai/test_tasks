"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vm_1 = require("vm");
const worker_threads_1 = require("worker_threads");
const crypto_1 = __importDefault(require("crypto"));
function sha256(x, y) {
    const buf = Buffer.alloc(16);
    buf.writeBigUInt64BE(BigInt(x), 0);
    buf.writeBigUInt64BE(BigInt(y), 8);
    const h = crypto_1.default.createHash("sha256");
    h.update(buf);
    return h.digest("hex");
}
if (!worker_threads_1.isMainThread) {
    const { index, chunk, fn, options } = worker_threads_1.workerData;
    const { initial } = options;
    try {
        const ctx = (0, vm_1.createContext)({ sha256 });
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
//# sourceMappingURL=indexer.js.map