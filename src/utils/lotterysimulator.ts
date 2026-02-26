import * as utils from ".";
import { factorial } from ".";

export const getNp1 = (total_balls: number, balls_selected: number, matches: number) => {
  if (balls_selected < matches || total_balls <= balls_selected) {
    return -1;
  }

  const misses = balls_selected - matches;
  const balls_not_selected = total_balls - balls_selected;
  const ttpos = factorial(total_balls) / factorial(balls_not_selected) / factorial(balls_selected);

  const combinations =
    (factorial(balls_selected) / factorial(misses) / factorial(matches)) *
    (factorial(balls_not_selected) / factorial(balls_not_selected - misses) / factorial(misses));

  const odds = ttpos / combinations;
  return odds;
};

//
//
//

const SIMULATION_ITERATIONS = 100000;
const TICKET_COST = 100;
const JACKPOT = 100000;

console.log("-- GENERATING LOTTERY ODDS --");
const lotteries: { poolSize: number; odds: { [key: string]: number } }[] = [];
for (let poolSize = 30; poolSize < 70; poolSize += 10) {
  console.log(`POOL OF [${poolSize}]`);
  const lottoOdds: { [key: string]: number } = {};
  for (let matches = 0; matches <= 7; matches++) {
    const odds = getNp1(poolSize, 7, matches);
    lottoOdds[matches.toString()] = 1 / odds;
    console.log(
      `${matches} matches - 1 in ${Math.round(odds)} chance (${((1 / odds) * 100).toFixed(5)}%)`,
    );
  }
  lotteries.push({ poolSize: poolSize, odds: lottoOdds });
  console.log();
}

console.log("-- SIMULATING EACH LOTTERY --");
for (const lottery of lotteries) {
  let output = [];
  for (let prizeScale = 15; (prizeScale -= 0.001); prizeScale > 1) {
    output.push(`POOL SIZE: [${lottery.poolSize}]`);

    const prizes = [];
    for (let i = 0; i < 8; i++) {
      prizes[i] = Math.round(Math.pow(i / 7, prizeScale) * JACKPOT);
    }
    output.push(`PRIZE SCALE: ${prizeScale}`);
    output.push(`PRIZES: ${prizes}`);

    let totalPoints = 0;
    const totalCost = TICKET_COST * SIMULATION_ITERATIONS;
    for (let i = 0; i < SIMULATION_ITERATIONS; i++) {
      const wonPoints = prizes[+utils.getRandomWeightedValue(lottery.odds)];
      totalPoints += wonPoints;
    }
    totalPoints -= totalCost;
    output.push(`Winnings: ${totalPoints}`);

    if (totalPoints > -10000) {
      break;
    } else {
      output = [];
    }
  }
  console.log(output.join("\n"));
  console.log("\n-----------\n");
}

console.log("-- SIMULATING STUFF --");
const SPECIAL_SIMULATION_ITERATIONS = 1000000;
const lottery1 = lotteries.find((x) => x.poolSize === 40)!;
const lottery2 = lotteries.find((x) => x.poolSize === 50)!;

const prizePool1 = [0, 25, 150, 500, 1000, 5000, 30000, 100000];
const prizePool2 = [0, 10, 150, 1000, 5000, 12000, 50000, 1000000];

let earnings1 = 0;
let earnings2 = 0;
for (let i = 0; i < SPECIAL_SIMULATION_ITERATIONS; i++) {
  earnings1 -= 100;
  earnings2 -= 100;

  earnings1 += prizePool1[+utils.getRandomWeightedValue(lottery1.odds)];
  earnings2 += prizePool2[+utils.getRandomWeightedValue(lottery2.odds)];
}

console.log(`PRIZES [40]: ${prizePool1}`);
console.log(`EARNINGS [40]: ${earnings1}`);
console.log();
console.log(`PRIZES [50]: ${prizePool2}`);
console.log(`EARNINGS [50]: ${earnings2}`);
console.log();
