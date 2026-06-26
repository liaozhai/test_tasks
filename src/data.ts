import fs from "fs";

const NUMBER_OF_FEATURES = 1e7;

async function main() {
    const w = fs.createWriteStream("data.txt");
    for (let i = 0; i < NUMBER_OF_FEATURES; i++) {
        const x = Math.floor(Math.random() * 180);
        const y = Math.floor(Math.random() * 90);
        w.write(`${x};${y}`);
        w.write("\n");
    }
    w.end();
}

main();
