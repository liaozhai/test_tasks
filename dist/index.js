"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parallel_1 = require("./parallel");
function createGeoArray(n) {
    const g = [];
    for (let i = 0; i < n; i++) {
        const x = Math.floor(Math.random() * 180);
        const y = Math.floor(Math.random() * 90);
        g.push({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [x, y],
            },
        });
    }
    return g;
}
async function main() {
    try {
        // const a = Array.from({ length: 10240 }, (_, i) => i);
        // let pa = new ParallelArray(a, poolSize);
        // let start: number, elapsed: number;
        // start = Date.now();
        // console.log("array length:", a.length, ", pool size:", poolSize);
        // const mr = await pa.mapAsync((n) => n * n);
        // elapsed = (Date.now() - start) / 1000;
        // console.log("mapped:", mr);
        // console.log("elapsed after mapping:", elapsed);
        // start = Date.now();
        // const fr = await pa.filterAsync((v) => v % 2 === 0);
        // elapsed = (Date.now() - start) / 1000;
        // console.log("filtered:", fr);
        // console.log("elapsed after filtering:", elapsed);
        // start = Date.now();
        // const rr = await pa.reduceAsync((a, v) => a + v, 0);
        // elapsed = (Date.now() - start) / 1000;
        // console.log("reduced:", rr);
        // console.log("elapsed after reduction:", elapsed);
        let start, elapsed;
        const n = 1e7;
        console.log(`creating ${n} samples...`);
        start = Date.now();
        const ga = createGeoArray(n);
        elapsed = (Date.now() - start) / 1000;
        console.log(`samples generated: ${elapsed} s`);
        const gridCellSize = 1;
        const poolSize = 4;
        const sa = new parallel_1.SpatialArray(ga, gridCellSize, poolSize);
        console.log(`created spatial array, grid cell size: ${gridCellSize}, worker pool size: ${poolSize}`);
        console.log("indexing...");
        start = Date.now();
        await sa.createIndex();
        elapsed = (Date.now() - start) / 1000;
        console.log(`index created: ${elapsed} s`);
        const bbox = [20, 50, 130, 60];
        console.log(`querying: [${bbox}]`);
        start = Date.now();
        const features = sa.query(bbox);
        elapsed = (Date.now() - start) / 1000;
        console.log(`query completed: ${elapsed} s, ${features.length} features`);
    }
    catch (e) {
        console.log(e);
    }
}
main();
//# sourceMappingURL=index.js.map