"use client";

import { useState } from "react";

import type { Copy } from "@/lib/copy";
import { convertAmount, CURRENCIES, formatMoney, formatUnit, loadRates } from "@/lib/exchange";
import {
  ageFromBirthday,
  averageOf,
  chequeWords,
  convertUnit,
  discountPrice,
  emiAmount,
  factorsOf,
  fractionWork,
  gstAmount,
  hcfLcm,
  motion,
  percentOf,
  percentRatio,
  powersOf,
  profitLoss,
  ratioWork,
  romanNumber,
  shapeMeasure,
  simpleInterest,
  splitBill,
  timesTable,
} from "@/lib/school-maths";

const KINDS = [
  "rupees",
  "interest",
  "profit",
  "average",
  "gst",
  "emi",
  "currency",
  "percent",
  "age",
  "split",
  "units",
  "hcf",
  "factors",
  "powers",
  "roman",
  "fraction",
  "ratio",
  "discount",
  "area",
  "speed",
  "table",
] as const;

type Kind = (typeof KINDS)[number];

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-[#c9ddd8]">{label}</span>
      <input
        value={value}
        inputMode="decimal"
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-full border border-white/20 bg-[#08343c] px-3 py-2 text-sm text-[#f7f3ea] outline-none"
      />
    </label>
  );
}

export function Calculator({ copy, bare = false }: { copy: Copy; bare?: boolean }) {
  const [kind, setKind] = useState<Kind>("rupees");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [c, setC] = useState("");
  const [d, setD] = useState("");
  const [op, setOp] = useState("+");
  const [shape, setShape] = useState("rectangle");
  const [find, setFind] = useState("speed");
  const [inclusive, setInclusive] = useState(false);
  const [from, setFrom] = useState("INR");
  const [to, setTo] = useState("USD");
  const [extra, setExtra] = useState("of");
  const [way, setWay] = useState("forward");
  const [working, setWorking] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  const [ratesDown, setRatesDown] = useState(false);

  const labels: Record<Kind, string> = {
    rupees: copy.calcRupees,
    interest: copy.calcInterest,
    profit: copy.calcProfit,
    average: copy.calcAverage,
    gst: copy.calcGst,
    emi: copy.calcEmi,
    currency: copy.calcCurrency,
    percent: copy.calcPercent,
    age: copy.calcAge,
    split: copy.calcSplit,
    units: copy.calcUnits,
    hcf: copy.calcHcf,
    factors: copy.calcFactors,
    powers: copy.calcPowers,
    roman: copy.calcRoman,
    fraction: copy.calcFraction,
    ratio: copy.calcRatio,
    discount: copy.calcDiscount,
    area: copy.calcArea,
    speed: copy.calcSpeed,
    table: copy.calcTable,
  };

  async function show() {
    setFailed(false);
    setRatesDown(false);
    let next: string[] | null = null;
    if (kind === "rupees") {
      const words = chequeWords(a);
      next = words ? [words.english, words.hindi] : null;
    } else if (kind === "interest") {
      const result = simpleInterest(a, b, c);
      next = result ? [`${copy.resultInterest}: ${result.interest}`, `${copy.resultAmount}: ${result.amount}`] : null;
    } else if (kind === "profit") {
      const result = profitLoss(a, b);
      next = result
        ? [`${result.kind === "profit" ? copy.resultProfit : copy.resultLoss}: ${result.amount}`, `${result.percent}%`]
        : null;
    } else if (kind === "average") {
      const result = averageOf(a);
      next = result ? [`${copy.calcAverage}: ${result.average}`, `${copy.resultTotal}: ${result.total}`] : null;
    } else if (kind === "gst") {
      const result = gstAmount(a, b, inclusive);
      next = result ? [`${copy.resultBase}: ${result.base}`, `GST: ${result.gst}`, `${copy.resultTotal}: ${result.total}`] : null;
    } else if (kind === "emi") {
      const result = emiAmount(a, b, c);
      next = result
        ? [`${copy.resultMonthly}: ${result.monthly}`, `${copy.resultInterest}: ${result.interest}`, `${copy.resultTotal}: ${result.total}`]
        : null;
    } else if (kind === "currency") {
      setWorking(true);
      const table = await loadRates();
      setWorking(false);
      const result = table ? convertAmount(a, from, to, table.rates) : null;
      if (!table) {
        setLines([]);
        setRatesDown(true);
        return;
      }
      next = result
        ? [`${formatMoney(Number(a), from)} = ${formatMoney(result.value, to)}`, `1 ${from} = ${formatUnit(result.unit)} ${to}`, copy.calcRateDate.replace("{date}", table.date)]
        : null;
    } else if (kind === "percent") {
      const result = extra === "ratio" ? percentRatio(a, b) : percentOf(a, b);
      next = result == null ? null : extra === "ratio" ? [`${result}%`] : [`${result}`];
    } else if (kind === "age") {
      const result = ageFromBirthday(a);
      next = result ? [`${result.years} ${copy.resultYears}`, `${result.months} ${copy.resultMonths}`] : null;
    } else if (kind === "split") {
      const result = splitBill(a, b, c);
      next = result ? [`${copy.resultEach}: ${result.each}`, `${copy.resultTotal}: ${result.total}`] : null;
    } else if (kind === "units") {
      const result = convertUnit(extra, way, a);
      const pair =
        extra === "mass" ? ["g", "kg"] : extra === "volume" ? ["mL", "L"] : extra === "temp" ? ["°C", "°F"] : ["cm", "m"];
      const [left, right] = way === "back" ? [pair[1], pair[0]] : pair;
      next = result == null ? null : [`${a} ${left} = ${result} ${right}`];
    } else if (kind === "factors") {
      const result = factorsOf(a);
      next = result ? [`${copy.resultFactors}: ${result.join(", ")}`] : null;
    } else if (kind === "powers") {
      const result = powersOf(a);
      next = result ? [`${copy.resultSquare}: ${result.square}`, `${copy.resultCube}: ${result.cube}`] : null;
    } else if (kind === "roman") {
      const result = romanNumber(a);
      next = result ? [`${copy.resultRoman}: ${result}`] : null;
    } else if (kind === "hcf") {
      const result = hcfLcm(a, b);
      next = result ? [`HCF ${result.hcf}`, `LCM ${result.lcm}`] : null;
    } else if (kind === "fraction") {
      const result = fractionWork(a, b, op, c, d);
      next = result ? [result] : null;
    } else if (kind === "ratio") {
      const result = ratioWork(a, b, c);
      next = result
        ? [`${result.left} : ${result.right}`, result.first ? `${result.first} : ${result.second}` : ""].filter(Boolean)
        : null;
    } else if (kind === "discount") {
      const result = discountPrice(a, b);
      next = result ? [`${copy.resultOff}: ${result.off}`, `${copy.resultSale}: ${result.sale}`] : null;
    } else if (kind === "area") {
      const result = shapeMeasure(shape, a, b);
      next = result
        ? [`${copy.resultArea}: ${result.area}`, result.perimeter ? `${copy.resultPerimeter}: ${result.perimeter}` : ""].filter(Boolean)
        : null;
    } else if (kind === "speed") {
      const result = motion(find, a, b);
      next = result ? [`${result.value} ${result.unit}`] : null;
    } else {
      next = timesTable(a);
    }
    if (!next) {
      setLines([]);
      setFailed(true);
      return;
    }
    setLines(next);
  }

  return (
    <div className={bare ? "px-4 pb-2" : "border-t border-white/10 px-4 py-3"}>
      {bare ? null : (
        <>
          <p className="pb-1 text-xs font-semibold tracking-[0.18em] text-[#f2c98a]">{copy.calc}</p>
          <p className="pb-3 text-xs leading-5 text-[#c9ddd8]">{copy.calcNote}</p>
        </>
      )}
      <label className="mb-3 block">
        <span className="sr-only">{copy.calc}</span>
        <select
          value={kind}
          onChange={(event) => {
            const next = event.target.value as Kind;
            setKind(next);
            setExtra(next === "units" ? "length" : "of");
            setWay("forward");
            setLines([]);
            setFailed(false);
            setRatesDown(false);
          }}
          className="w-full rounded-full border border-white/15 bg-[#08343c] px-3 py-2 text-sm text-[#f7f3ea] outline-none"
        >
          {KINDS.map((item) => (
            <option key={item} value={item}>
              {labels[item]}
            </option>
          ))}
        </select>
      </label>
      <div className="space-y-2">
        {kind === "rupees" ? <Field label={copy.calcAmount} value={a} onChange={setA} /> : null}
        {kind === "interest" || kind === "emi" ? (
          <>
            <Field label={copy.calcPrincipal} value={a} onChange={setA} />
            <Field label={copy.calcRate} value={b} onChange={setB} />
            <Field label={kind === "emi" ? copy.calcMonths : copy.calcYears} value={c} onChange={setC} />
          </>
        ) : null}
        {kind === "profit" ? (
          <>
            <Field label={copy.calcCost} value={a} onChange={setA} />
            <Field label={copy.calcSelling} value={b} onChange={setB} />
          </>
        ) : null}
        {kind === "average" ? <Field label={copy.calcNumbers} value={a} onChange={setA} /> : null}
        {kind === "gst" ? (
          <>
            <Field label={copy.calcAmount} value={a} onChange={setA} />
            <Field label={copy.calcRate} value={b} onChange={setB} />
            <label className="flex items-center gap-2 text-xs text-[#f7f3ea]">
              <input type="checkbox" checked={inclusive} onChange={(event) => setInclusive(event.target.checked)} />
              {copy.calcInclusive}
            </label>
          </>
        ) : null}
        {kind === "hcf" || kind === "ratio" ? (
          <>
            <Field label={copy.calcFirst} value={a} onChange={setA} />
            <Field label={copy.calcSecond} value={b} onChange={setB} />
            {kind === "ratio" ? <Field label={copy.calcShare} value={c} onChange={setC} /> : null}
          </>
        ) : null}
        {kind === "fraction" ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Field label={copy.calcNumerator} value={a} onChange={setA} />
              <Field label={copy.calcDenominator} value={b} onChange={setB} />
            </div>
            <select
              value={op}
              onChange={(event) => setOp(event.target.value)}
              className="w-full rounded-full border border-white/15 bg-[#08343c] px-3 py-2 text-sm text-[#f7f3ea] outline-none"
            >
              <option value="+">{copy.calcAdd}</option>
              <option value="-">{copy.calcSubtract}</option>
              <option value="*">{copy.calcMultiply}</option>
              <option value="/">{copy.calcDivide}</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <Field label={copy.calcNumerator} value={c} onChange={setC} />
              <Field label={copy.calcDenominator} value={d} onChange={setD} />
            </div>
          </>
        ) : null}
        {kind === "discount" ? (
          <>
            <Field label={copy.calcMarked} value={a} onChange={setA} />
            <Field label={copy.calcOff} value={b} onChange={setB} />
          </>
        ) : null}
        {kind === "area" ? (
          <>
            <select
              value={shape}
              onChange={(event) => setShape(event.target.value)}
              className="w-full rounded-full border border-white/15 bg-[#08343c] px-3 py-2 text-sm text-[#f7f3ea] outline-none"
            >
              <option value="rectangle">{copy.calcRectangle}</option>
              <option value="square">{copy.calcSquare}</option>
              <option value="circle">{copy.calcCircle}</option>
              <option value="triangle">{copy.calcTriangle}</option>
            </select>
            <Field
              label={shape === "circle" ? copy.calcRadius : shape === "square" ? copy.calcSide : shape === "triangle" ? copy.calcBase : copy.calcLength}
              value={a}
              onChange={setA}
            />
            {shape === "rectangle" || shape === "triangle" ? (
              <Field label={shape === "triangle" ? copy.calcHeight : copy.calcWidth} value={b} onChange={setB} />
            ) : null}
          </>
        ) : null}
        {kind === "speed" ? (
          <>
            <select
              value={find}
              onChange={(event) => setFind(event.target.value)}
              className="w-full rounded-full border border-white/15 bg-[#08343c] px-3 py-2 text-sm text-[#f7f3ea] outline-none"
            >
              <option value="speed">{copy.calcFindSpeed}</option>
              <option value="distance">{copy.calcFindDistance}</option>
              <option value="time">{copy.calcFindTime}</option>
            </select>
            <Field label={find === "distance" ? copy.calcSpeedValue : copy.calcDistance} value={a} onChange={setA} />
            <Field label={find === "time" ? copy.calcSpeedValue : copy.calcTime} value={b} onChange={setB} />
          </>
        ) : null}
        {kind === "currency" ? (
          <>
            <Field label={copy.calcAmount} value={a} onChange={setA} />
            <label className="block">
              <span className="mb-1 block text-xs text-[#c9ddd8]">{copy.calcFrom}</span>
              <select
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="w-full rounded-full border border-white/15 bg-[#08343c] px-3 py-2 text-sm text-[#f7f3ea] outline-none"
              >
                {CURRENCIES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {code} · {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-[#c9ddd8]">{copy.calcTo}</span>
              <select
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="w-full rounded-full border border-white/15 bg-[#08343c] px-3 py-2 text-sm text-[#f7f3ea] outline-none"
              >
                {CURRENCIES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {code} · {name}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}
        {kind === "percent" ? (
          <>
            <select
              value={extra}
              onChange={(event) => setExtra(event.target.value)}
              className="w-full rounded-full border border-white/15 bg-[#08343c] px-3 py-2 text-sm text-[#f7f3ea] outline-none"
            >
              <option value="of">{copy.calcPercentOf}</option>
              <option value="ratio">{copy.calcWhatPercent}</option>
            </select>
            <Field label={extra === "ratio" ? copy.calcPart : copy.calcRate} value={a} onChange={setA} />
            <Field label={extra === "ratio" ? copy.calcWhole : copy.calcAmount} value={b} onChange={setB} />
          </>
        ) : null}
        {kind === "age" ? (
          <label className="block">
            <span className="mb-1 block text-xs text-[#c9ddd8]">{copy.calcBirthday}</span>
            <input
              type="date"
              value={a}
              onChange={(event) => setA(event.target.value)}
              className="w-full rounded-full border border-white/20 bg-[#08343c] px-3 py-2 text-sm text-[#f7f3ea] outline-none scheme-dark"
            />
          </label>
        ) : null}
        {kind === "split" ? (
          <>
            <Field label={copy.calcAmount} value={a} onChange={setA} />
            <Field label={copy.calcPeople} value={b} onChange={setB} />
            <Field label={copy.calcTip} value={c} onChange={setC} />
          </>
        ) : null}
        {kind === "units" ? (
          <>
            <select
              value={extra}
              onChange={(event) => setExtra(event.target.value)}
              className="w-full rounded-full border border-white/15 bg-[#08343c] px-3 py-2 text-sm text-[#f7f3ea] outline-none"
            >
              <option value="length">{copy.calcUnitLength}</option>
              <option value="mass">{copy.calcUnitMass}</option>
              <option value="volume">{copy.calcUnitVolume}</option>
              <option value="temp">{copy.calcUnitTemp}</option>
            </select>
            <select
              value={way}
              onChange={(event) => setWay(event.target.value)}
              className="w-full rounded-full border border-white/15 bg-[#08343c] px-3 py-2 text-sm text-[#f7f3ea] outline-none"
            >
              <option value="forward">
                {extra === "mass" ? "g → kg" : extra === "volume" ? "mL → L" : extra === "temp" ? "°C → °F" : "cm → m"}
              </option>
              <option value="back">
                {extra === "mass" ? "kg → g" : extra === "volume" ? "L → mL" : extra === "temp" ? "°F → °C" : "m → cm"}
              </option>
            </select>
            <Field label={copy.calcAmount} value={a} onChange={setA} />
          </>
        ) : null}
        {kind === "factors" || kind === "powers" || kind === "roman" ? <Field label={copy.calcFirst} value={a} onChange={setA} /> : null}
        {kind === "table" ? <Field label={copy.calcTableOf} value={a} onChange={setA} /> : null}
      </div>
      <button
        type="button"
        onClick={() => void show()}
        disabled={working}
        className="mt-3 w-full rounded-full border border-[#f2c98a]/50 px-3 py-2 text-sm text-[#f7f3ea] hover:bg-white/10 disabled:opacity-60"
      >
        {copy.calcShow}
      </button>
      {ratesDown ? <p className="pt-2 text-xs leading-5 text-[#f2c98a]">{copy.calcRates}</p> : null}
      {failed ? <p className="pt-2 text-xs leading-5 text-[#f2c98a]">{copy.calcCheck}</p> : null}
      {lines.length > 0 ? (
        <div className="pt-2 text-sm leading-6 text-[#f7f3ea]">
          {lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
