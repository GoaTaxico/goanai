import { hindiNumber } from "@/lib/hindi-number";
import { konkaniNumber } from "@/lib/konkani-number";
import { marathiNumber } from "@/lib/marathi-number";

const ONES = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function underHundred(value: number) {
  if (value < 20) return ONES[value] ?? "";
  const tens = Math.floor(value / 10);
  const ones = value % 10;
  return ones ? `${TENS[tens]}-${ONES[ones]}` : (TENS[tens] ?? "");
}

function underThousand(value: number) {
  if (value < 100) return underHundred(value);
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  const head = `${ONES[hundreds]} hundred`;
  return rest ? `${head} ${underHundred(rest)}` : head;
}

export function englishNumber(value: number) {
  if (!Number.isInteger(value) || value < 0 || value > 9_999_999_999) return null;
  if (value === 0) return "zero";
  const parts: string[] = [];
  const crore = Math.floor(value / 10_000_000);
  let rest = value % 10_000_000;
  const lakh = Math.floor(rest / 100_000);
  rest %= 100_000;
  const thousand = Math.floor(rest / 1000);
  rest %= 1000;
  if (crore) parts.push(`${underThousand(crore)} crore`);
  if (lakh) parts.push(`${underHundred(lakh)} lakh`);
  if (thousand) parts.push(`${underHundred(thousand)} thousand`);
  if (rest) parts.push(underThousand(rest));
  return parts.join(" ");
}

export function rupeeWords(amount: number) {
  if (!Number.isFinite(amount) || amount < 0 || amount > 9_999_999_999) return null;
  const paiseTotal = Math.round(amount * 100);
  const rupees = Math.floor(paiseTotal / 100);
  const paise = paiseTotal % 100;
  const englishRupees = englishNumber(rupees);
  const hindiRupees = hindiNumber(rupees);
  const konkaniRupees = konkaniNumber(rupees);
  const marathiRupees = marathiNumber(rupees);
  if (!englishRupees || !hindiRupees || !konkaniRupees || !marathiRupees) return null;
  const englishPaise = paise ? englishNumber(paise) : "";
  const hindiPaise = paise ? hindiNumber(paise) : "";
  const konkaniPaise = paise ? konkaniNumber(paise) : "";
  const marathiPaise = paise ? marathiNumber(paise) : "";
  const english = paise
    ? `Rupees ${englishRupees} and ${englishPaise} paise only`
    : `Rupees ${englishRupees} only`;
  const hindi = paise ? `${hindiRupees} रुपये ${hindiPaise} पैसे` : `${hindiRupees} रुपये`;
  const konkani = paise ? `${konkaniRupees} रुपया आनी ${konkaniPaise} पैसे` : `${konkaniRupees} रुपया`;
  const marathi = paise ? `${marathiRupees} रुपये आणि ${marathiPaise} पैसे` : `${marathiRupees} रुपये`;
  return { rupees, paise, english, hindi, konkani, marathi };
}
