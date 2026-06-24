import { ParallelArray, Point, SpatialArray } from "./parallel";

function createGeoArray(n: number) {
    const g = <Point[]>[];
    for (let i = 0; i < n; i++) {
        const x = Math.floor(Math.random() * 180);
        const y = Math.floor(Math.random() * 90);
        g.push([x, y]);
    }
    return g;
}

async function main() {
    try {
        // const a = Array.from({ length: 10240 }, (_, i) => i);
        const poolSize = 16;
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
        const ga = createGeoArray(10000);
        const sa = new SpatialArray(ga, 1, poolSize);
        await sa.createIndex();
        const pp = sa.query({ xmin: 20, ymin: 50, xmax: 130, ymax: 60 });
        console.log("query:", pp);
    } catch (e) {
        console.log(e);
    }
}

main();
