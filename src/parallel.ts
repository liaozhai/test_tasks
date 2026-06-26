import { Worker } from "worker_threads";
import path from "path";
import os from "os";
import crypto from "crypto";
import { Feature, Point, BBox } from "geojson";

export class ParallelArray {
    constructor(
        protected readonly array: any[],
        private readonly poolSize: number = os.cpus().length
    ) {}

    protected run(
        workerFile: string,
        fn: string,
        options?: any
    ): Promise<any[]> {
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
                const w = new Worker(path.join(__dirname, workerFile), {
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

    mapAsync(mapper: (v: any, i?: number) => any): Promise<any[]> {
        return this.run("mapper.js", mapper.toString());
    }

    filterAsync(predicate: (v: any, i: number) => boolean): Promise<any[]> {
        return this.run("filter.js", predicate.toString());
    }

    reduceAsync(
        reducer: (a: any, v: any, i?: number) => any,
        initial: any
    ): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const results = await this.run(
                    "reducer.js",
                    reducer.toString(),
                    { initial }
                );
                resolve(results.reduce(reducer, initial));
            } catch (e) {
                reject(e);
            }
        });
    }
}

function sha256(x: number, y: number) {
    const buf = Buffer.alloc(16);
    buf.writeBigUInt64BE(BigInt(x), 0);
    buf.writeBigUInt64BE(BigInt(y), 8);
    const h = crypto.createHash("sha256");
    h.update(buf);
    return h.digest("hex");
}

function cell(size: number, x: number, y: number) {
    const xmin = -180;
    const ymin = -90;
    return [Math.floor((x - xmin) / size), Math.floor((y - ymin) / size)];
}

type SpatialIndex = Record<string, number[]>;

export class SpatialArray extends ParallelArray {
    private index: SpatialIndex = {};
    constructor(
        array: Feature<Point>[],
        private readonly cellSize = 1,
        poolSize: number = os.cpus().length
    ) {
        super(array, poolSize);
    }
    get count() {
        return this.array.length;
    }
    async createIndex(): Promise<void> {
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
        this.index = Object.keys(result).reduce(
            (a, k) => {
                a[k] = result[k];
                return a;
            },
            <SpatialIndex>{}
        );
    }

    query(bbox: BBox): Feature<Point>[] {
        const [minLon, minLat, maxLon, maxLat] = bbox;
        const [llx, lly] = cell(this.cellSize, minLon, minLat);
        const [urx, ury] = cell(this.cellSize, maxLon, maxLat);
        const result = <Feature<Point>[][]>[];
        for (let x = llx; x <= urx; x += this.cellSize) {
            for (let y = lly; y <= ury; y += this.cellSize) {
                const h = sha256(x, y);
                const pp = this.index[h];
                if (Array.isArray(pp)) {
                    result.push(
                        pp
                            .map((i) => <Feature<Point>>this.array[i])
                            .filter((p) => {
                                const {
                                    geometry: { coordinates },
                                } = p;
                                const [lon, lat] = coordinates;
                                return (
                                    minLon <= lon &&
                                    lon <= maxLon &&
                                    minLat <= lat &&
                                    lat <= maxLat
                                );
                            })
                    );
                }
            }
        }
        return result.flat();
    }
}
