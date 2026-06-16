import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { BoxOfficeDataPoint } from '@/types';
import { COLORS } from '@/constants/config';

interface Props {
  data: BoxOfficeDataPoint[];
  hallId?: string;
  height?: number;
}

export default function BoxOfficeChart({ data, hallId, height = 200 }: Props) {
  const filteredData = useMemo(() => {
    const filtered = hallId ? data.filter((d) => d.hallId === hallId) : data.filter((d) => !d.hallId);
    return filtered.sort((a, b) => a.timestamp - b.timestamp);
  }, [data, hallId]);

  const option = useMemo(() => {
    const times = filteredData.map((d) =>
      new Date(d.timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
    const boxOffice = filteredData.map((d) => d.boxOffice);
    const footfall = filteredData.map((d) => d.footfall);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(10, 22, 40, 0.95)',
        borderColor: COLORS.primary,
        borderWidth: 1,
        textStyle: { color: COLORS.text, fontSize: 11 },
        axisPointer: {
          type: 'cross',
          lineStyle: { color: COLORS.primary, opacity: 0.5 },
        },
        formatter: (params: any) => {
          const time = params[0]?.axisValue || '';
          let html = `<div class="mb-1 font-bold text-[11px]" style="color:${COLORS.primary}">${time}</div>`;
          params.forEach((p: any) => {
            const color = p.color;
            const name = p.seriesName;
            const value = p.seriesName === '票房' ? `¥${p.value.toLocaleString()}` : `${p.value}人`;
            html += `<div class="flex items-center gap-2 text-[10px]">
              <span style="background:${color};width:8px;height:8px;border-radius:50%;display:inline-block"></span>
              <span style="color:${COLORS.textSecondary}">${name}:</span>
              <span style="color:${color};font-weight:bold">${value}</span>
            </div>`;
          });
          return html;
        },
      },
      grid: {
        left: 50,
        right: 50,
        top: 20,
        bottom: 30,
      },
      legend: {
        data: ['票房', '客流'],
        top: 0,
        right: 0,
        textStyle: { color: COLORS.textSecondary, fontSize: 10 },
        itemWidth: 12,
        itemHeight: 8,
      },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: COLORS.border } },
        axisLabel: {
          color: COLORS.textMuted,
          fontSize: 9,
          interval: Math.floor(filteredData.length / 8),
          rotate: 30,
        },
        splitLine: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: '票房(¥)',
          nameTextStyle: { color: COLORS.gold, fontSize: 10, padding: [0, 0, 0, 20] },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            color: COLORS.gold,
            fontSize: 9,
            formatter: (v: number) => (v >= 1000 ? `${v / 1000}k` : v),
          },
          splitLine: { lineStyle: { color: COLORS.border, type: 'dashed', opacity: 0.5 } },
        },
        {
          type: 'value',
          name: '客流(人)',
          nameTextStyle: { color: COLORS.success, fontSize: 10, padding: [0, 20, 0, 0] },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: COLORS.success, fontSize: 9 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '票房',
          type: 'line',
          yAxisIndex: 0,
          data: boxOffice,
          smooth: 0.4,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: COLORS.gold, width: 2.5, shadowColor: COLORS.gold, shadowBlur: 8 },
          itemStyle: {
            color: COLORS.gold,
            borderColor: '#fff',
            borderWidth: 1,
            shadowColor: COLORS.gold,
            shadowBlur: 6,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: `${COLORS.gold}44` },
                { offset: 1, color: `${COLORS.gold}00` },
              ],
            },
          },
        },
        {
          name: '客流',
          type: 'line',
          yAxisIndex: 1,
          data: footfall,
          smooth: 0.4,
          symbol: 'diamond',
          symbolSize: 6,
          lineStyle: { color: COLORS.success, width: 2.5, shadowColor: COLORS.success, shadowBlur: 8 },
          itemStyle: {
            color: COLORS.success,
            borderColor: '#fff',
            borderWidth: 1,
            shadowColor: COLORS.success,
            shadowBlur: 6,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: `${COLORS.success}33` },
                { offset: 1, color: `${COLORS.success}00` },
              ],
            },
          },
        },
      ],
    };
  }, [filteredData]);

  return (
    <div className="w-full">
      <ReactECharts
        option={option}
        style={{ height: `${height}px`, width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
}
