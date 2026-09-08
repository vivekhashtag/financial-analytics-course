'use client';

import { useId, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  CHART,
  ChartError,
  ChartFrame,
  ChartSkeleton,
  Readout,
  Segmented,
  Slider,
  fmt,
  tooltipStyle,
  useChartData,
  usePrefersReducedMotion,
} from './chartKit';

interface Level {
  price: number;
  qty: number;
}
interface Payload {
  source: string;
  bids: Level[];
  asks: Level[];
}

/**
 * M11 · Order book — the 11A toy book, eaten by your own market order.
 *
 * A market buy walks *up* the asks (best/lowest first); a market sell walks
 * *down* the bids. The average fill is the size-weighted price of every level
 * consumed, which is why size and price are the same question.
 *
 * Impact is measured against the mid, so it is symmetric and comparable
 * between the two sides — the definition 11A uses.
 */
export default function M11OrderBook() {
  const { data, error } = useChartData<Payload>('m11-orderbook.json');
  const reduced = usePrefersReducedMotion();
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [size, setSize] = useState(0);
  const sizeId = useId();

  const book = useMemo(() => {
    if (!data) return null;

    const asks = [...data.asks].sort((a, b) => a.price - b.price);
    const bids = [...data.bids].sort((a, b) => b.price - a.price);
    const queue = side === 'buy' ? asks : bids;

    const bestAsk = asks[0].price;
    const bestBid = bids[0].price;
    const mid = (bestAsk + bestBid) / 2;
    const spread = bestAsk - bestBid;
    const depth = queue.reduce((s, l) => s + l.qty, 0);

    // Walk the queue.
    let remaining = size;
    let cost = 0;
    let filled = 0;
    const consumed = queue.map((l) => {
      const take = Math.max(0, Math.min(l.qty, remaining));
      remaining -= take;
      cost += take * l.price;
      filled += take;
      return { ...l, taken: take, left: l.qty - take };
    });

    const avgFill = filled > 0 ? cost / filled : side === 'buy' ? bestAsk : bestBid;
    const touch = side === 'buy' ? bestAsk : bestBid;
    const slippageBps = filled > 0 ? ((avgFill - touch) / touch) * 10_000 * (side === 'buy' ? 1 : -1) : 0;
    const impactBps = filled > 0 ? Math.abs((avgFill - mid) / mid) * 10_000 : 0;
    const levelsHit = consumed.filter((l) => l.taken > 0).length;

    // Rows for the chart, ordered by price so the ladder reads naturally.
    const rows = [...(side === 'buy' ? consumed : [...consumed].reverse())].map((l) => ({
      price: l.price.toFixed(2),
      taken: l.taken,
      left: l.left,
    }));

    return {
      rows,
      bestAsk,
      bestBid,
      mid,
      spread,
      depth,
      avgFill,
      touch,
      slippageBps,
      impactBps,
      levelsHit,
      filled,
      unfilled: Math.max(0, size - filled),
    };
  }, [data, side, size]);

  if (error) return <ChartError what="the order book" detail={error} />;
  if (!data || !book) return <ChartSkeleton height={280} />;

  const sideColour = side === 'buy' ? CHART.semantic.danger : CHART.semantic.success;

  return (
    <ChartFrame
      title="Your size moves your price"
      caption="drag the size — the first 350 shares fill at the touch, and every share after that costs more."
      source={data.source}
      accent={CHART.part.D}
      height={280}
      controls={
        <>
          <Segmented
            label="Order"
            value={side}
            accent={CHART.part.D}
            onChange={(v) => setSide(v)}
            options={[
              { value: 'buy', label: 'Market buy' },
              { value: 'sell', label: 'Market sell' },
            ]}
          />
          <Slider
            id={sizeId}
            label="Order size"
            value={size}
            min={0}
            max={book.depth}
            step={50}
            accent={sideColour}
            onChange={setSize}
            format={(v) => `${fmt.num(v)} sh`}
          />
        </>
      }
      readout={
        <>
          <Readout
            items={[
              {
                label: 'Average fill',
                value: fmt.inr(book.avgFill, 3),
                hint: `touch was ${fmt.inr(book.touch, 2)}`,
                tone: size > 0 ? sideColour : undefined,
              },
              {
                label: 'Slippage vs touch',
                value: `${book.slippageBps >= 0 ? '' : '−'}${Math.abs(book.slippageBps).toFixed(1)} bps`,
                hint: `${book.levelsHit} level${book.levelsHit === 1 ? '' : 's'} consumed`,
              },
              {
                label: 'Spread',
                value: `${fmt.inr(book.spread, 2)}`,
                hint: `mid ${fmt.inr(book.mid, 3)} · depth ${fmt.num(book.depth)} sh`,
              },
            ]}
          />
          <p className="mt-3 text-sm text-muted">
            {size === 0 ? (
              <>
                At zero size the price is the touch — {fmt.inr(book.touch, 2)}. There is no single
                &quot;price&quot;: there are two, and a queue behind each.
              </>
            ) : book.unfilled > 0 ? (
              <>
                <strong style={{ color: CHART.semantic.danger }}>
                  {fmt.num(book.unfilled)} shares unfilled
                </strong>{' '}
                — you have exhausted the visible book. In stress the queue you planned to trade
                against is not the queue you get.
              </>
            ) : (
              <>
                Impact against the mid: <strong className="text-ink">{book.impactBps.toFixed(1)} bps</strong>.
                Cross {book.levelsHit} levels and that cost is paid on every share, not just the
                last one.
              </>
            )}
          </p>
        </>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={book.rows} margin={{ top: 6, right: 12, left: 4, bottom: 4 }} barGap={0}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="price" tick={CHART.tick} stroke={CHART.grid} interval={0} />
          <YAxis tick={CHART.tick} stroke={CHART.grid} width={52} tickFormatter={(v: number) => fmt.num(v)} />
          <Tooltip
            {...tooltipStyle()}
            formatter={(v: number, name: string) => [`${fmt.num(v)} sh`, name]}
            labelFormatter={(p) => `₹${p}`}
          />
          <Bar name="Consumed" dataKey="taken" stackId="l" radius={[0, 0, 0, 0]} isAnimationActive={!reduced} animationDuration={250}>
            {book.rows.map((r) => (
              <Cell key={`t-${r.price}`} fill={sideColour} fillOpacity={0.85} />
            ))}
          </Bar>
          <Bar name="Resting" dataKey="left" stackId="l" radius={[3, 3, 0, 0]} isAnimationActive={!reduced} animationDuration={250}>
            {book.rows.map((r) => (
              <Cell
                key={`l-${r.price}`}
                fill={side === 'buy' ? CHART.semantic.danger : CHART.semantic.success}
                fillOpacity={0.22}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
