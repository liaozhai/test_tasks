"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpatialArray = exports.ParallelArray = void 0;
const worker_threads_1 = require("worker_threads");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const crypto_1 = __importDefault(require("crypto"));
class ParallelArray {
    array;
    poolSize;
    constructor(array, poolSize = os_1.default.cpus().length) {
        this.array = array;
        this.poolSize = poolSize;
    }
    run(workerFile, fn, options) {
        return new Promise((resolve, reject) => {
            if (this.array.length === 0) {
                resolve([]);
            }
            const chunkSize = Math.ceil(this.array.length / this.poolSize);
            const chunks = [];
            for (let i = 0; i < this.array.length; i += chunkSize) {
                chunks.push(this.array.slice(i, i + chunkSize));
            }
            const results = new Array(chunks.length);
            let completed = 0;
            chunks.forEach((chunk, idx) => {
                const w = new worker_threads_1.Worker(path_1.default.join(__dirname, workerFile), {
                    workerData: {
                        fn,
                        chunk,
                        index: idx,
                        options,
                    },
                });
                w.once("message", ({ index, result }) => {
                    results[index] = result;
                    completed++;
                    if (completed === chunks.length) {
                        resolve(results.flat());
                    }
                });
                w.once("error", reject);
                w.once("exit", (code) => {
                    if (code !== 0) {
                        reject(new Error(`Stopped with exit code ${code}`));
                    }
                });
            });
        });
    }
    mapAsync(mapper) {
        return this.run("mapper.js", mapper.toString());
    }
    filterAsync(predicate) {
        return this.run("filter.js", predicate.toString());
    }
    reduceAsync(reducer, initial) {
        return new Promise(async (resolve, reject) => {
            try {
                const results = await this.run("reducer.js", reducer.toString(), { initial });
                resolve(results.reduce(reducer, initial));
            }
            catch (e) {
                reject(e);
            }
        });
    }
}
exports.ParallelArray = ParallelArray;
function sha256(x, y) {
    const buf = Buffer.alloc(16);
    buf.writeBigUInt64BE(BigInt(x), 0);
    buf.writeBigUInt64BE(BigInt(y), 8);
    const h = crypto_1.default.createHash("sha256");
    h.update(buf);
    return h.digest("hex");
}
function cell(size, x, y) {
    const xmin = -180;
    const ymin = -90;
    return [Math.floor((x - xmin) / size), Math.floor((y - ymin) / size)];
}
class SpatialArray extends ParallelArray {
    cellSize;
    index = {};
    constructor(array, cellSize = 10, poolSize = os_1.default.cpus().length) {
        super(array, poolSize);
        this.cellSize = cellSize;
    }
    async createIndex() {
        const fn = `function (a, p, i) {
            const { geometry: { coordinates } } = p;
            const [lon, lat] = coordinates;
            const cell = ${cell.toString()};
            const [x, y] = cell(${this.cellSize}, lon, lat);
            const h = sha256(x, y);
            if (!a[h]) {
                a[h] = [];
            }
            a[h].push(i);
            return a;
        }`;
        const [result] = await this.run("indexer.js", fn, { initial: {} });
        this.index = Object.keys(result).reduce((a, k) => {
            a[k] = result[k];
            return a;
        }, {});
    }
    query(bbox) {
        const [minLon, minLat, maxLon, maxLat] = bbox;
        const [llx, lly] = cell(this.cellSize, minLon, minLat);
        const [urx, ury] = cell(this.cellSize, maxLon, maxLat);
        const result = [];
        for (let x = llx; x <= urx; x += this.cellSize) {
            for (let y = lly; y <= ury; y += this.cellSize) {
                const h = sha256(x, y);
                const pp = this.index[h];
                if (Array.isArray(pp)) {
                    result.push(pp
                        .map((i) => this.array[i])
                        .filter((p) => {
                        const { geometry: { coordinates }, } = p;
                        const [lon, lat] = coordinates;
                        return (minLon <= lon &&
                            lon <= maxLon &&
                            minLat <= lat &&
                            lat <= maxLat);
                    }));
                }
            }
        }
        return result.flat();
    }
}
exports.SpatialArray = SpatialArray;
//# sourceMappingURL=parallel.js.map