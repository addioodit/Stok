import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Line,
  Path,
  Text as SvgText,
} from 'react-native-svg';
import { theme } from '../theme';
import { formatGYD } from '../utils/format';

export interface ChartPoint {
  ts: number;
  close: number;
}

interface Props {
  data: ChartPoint[];
  width: number;
  height?: number;
  color?: string;
}

const PAD = { left: 48, right: 12, top: 12, bottom: 22 };

function formatShortDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function LineChart({
  data,
  width,
  height = 180,
  color = theme.colors.primary,
}: Props) {
  if (data.length < 2) {
    return <View style={[styles.placeholder, { width, height }]} />;
  }

  const chartW = Math.max(1, width - PAD.left - PAD.right);
  const chartH = Math.max(1, height - PAD.top - PAD.bottom);

  const minTs = data[0].ts;
  const maxTs = data[data.length - 1].ts;
  const tsRange = Math.max(1, maxTs - minTs);

  const closes = data.map((d) => d.close);
  const minC = Math.min(...closes);
  const maxC = Math.max(...closes);
  const cRange = Math.max(0.01, maxC - minC);
  const pad = cRange * 0.12;
  const yMin = minC - pad;
  const yMax = maxC + pad;
  const yRange = yMax - yMin;

  const x = (ts: number) => PAD.left + ((ts - minTs) / tsRange) * chartW;
  const y = (c: number) => PAD.top + (1 - (c - yMin) / yRange) * chartH;

  const d = data
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.ts).toFixed(2)} ${y(p.close).toFixed(2)}`)
    .join(' ');

  const areaPath =
    d +
    ` L ${x(maxTs).toFixed(2)} ${(PAD.top + chartH).toFixed(2)}` +
    ` L ${x(minTs).toFixed(2)} ${(PAD.top + chartH).toFixed(2)} Z`;

  const last = data[data.length - 1];
  const first = data[0];
  const trendUp = last.close >= first.close;
  const lineColor = trendUp ? theme.colors.positive : theme.colors.negative;

  return (
    <View>
      <Svg width={width} height={height}>
        <Line
          x1={PAD.left}
          x2={PAD.left + chartW}
          y1={PAD.top}
          y2={PAD.top}
          stroke={theme.colors.border}
          strokeDasharray="3 4"
        />
        <Line
          x1={PAD.left}
          x2={PAD.left + chartW}
          y1={PAD.top + chartH}
          y2={PAD.top + chartH}
          stroke={theme.colors.border}
        />

        <Path d={areaPath} fill={lineColor} opacity={0.08} />
        <Path d={d} stroke={lineColor} strokeWidth={2} fill="none" />

        <Circle
          cx={x(last.ts)}
          cy={y(last.close)}
          r={4}
          fill={lineColor}
        />

        <SvgText
          x={PAD.left - 6}
          y={PAD.top + 4}
          fontSize={10}
          fill={theme.colors.textSecondary}
          textAnchor="end"
        >
          {formatGYD(yMax)}
        </SvgText>
        <SvgText
          x={PAD.left - 6}
          y={PAD.top + chartH + 3}
          fontSize={10}
          fill={theme.colors.textSecondary}
          textAnchor="end"
        >
          {formatGYD(yMin)}
        </SvgText>

        <SvgText
          x={PAD.left}
          y={height - 6}
          fontSize={10}
          fill={theme.colors.textSecondary}
        >
          {formatShortDate(minTs)}
        </SvgText>
        <SvgText
          x={width - PAD.right}
          y={height - 6}
          fontSize={10}
          fill={theme.colors.textSecondary}
          textAnchor="end"
        >
          {formatShortDate(maxTs)}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
  },
});
