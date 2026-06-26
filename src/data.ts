import fs from "fs";

const NUMBER_OF_FEATURES = 1e7;

async function main() {
    console.log(`Generating ${NUMBER_OF_FEATURES} sample features`);
    const start = Date.now();
    const w = fs.createWriteStream("data.txt");
    for (let i = 0; i < NUMBER_OF_FEATURES; i++) {
        const x = Math.floor(Math.random() * 180);
        const y = Math.floor(Math.random() * 90);
        w.write(`${x};${y}`);
        w.write("\n");
    }
    console.log(`Done. Time: ${(Date.now() - start) / 1000}s.`);
    w.end();
}

main();
