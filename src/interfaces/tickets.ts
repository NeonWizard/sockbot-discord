import { LotteryTicket } from "../database/models/LotteryTicket";

export interface VerboseTicket {
  // number of matched numbers on this ticket
  matches: number;

  // each individual number that makes up this ticket
  numbers: {
    number: number;
    matched: boolean;
  }[];

  // a string that represents this ticket
  stringLine: string;

  // the base ticket object
  ticket: LotteryTicket;
}
