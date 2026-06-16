import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { Showtime, Hall } from '@/types';
import { COLORS, HEAT_COLOR_MAP } from '@/constants/config';

interface Props {
  halls: Hall[];
  showtimes: Showtime[];
  height?: number;
}

export default function ScheduleHeatmap({ halls, showtimes, height = 280 }: Props) {
  const option = useMemo(() => {
    const yAxisData = halls.map((h) => `${h.number}号厅`);
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(9, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(24, 0, 0, 0);

    const xAxisData: string[] = [];
    for (let h = 9; h <= 24; h++) {
      xAxisData.push(`${String(h).padStart(2, '0')}:00`);
    }

    const data: any[] = [];
    halls.forEach((hall, hallIdx) => {
      const hallShows = showtimes
        .filter((s) => s.hallId === hall.id)
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      hallShows.forEach((show) => {
        const startHour = show.startTime.getHours() + show.startTime.getMinutes() / 60;
        const endHour = show.endTime.getHours() + show.endTime.getMinutes() / 60;
        const startX = Math.max(0, startHour - 9);
        const duration = endHour - startHour;
        const heatColor = HEAT_COLOR_MAP[show.heatLevel];

        data.push({
          value: [
            startX,
            hallIdx,
            duration,
            show.heatLevel,
            show.movie.title,
            show.startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            show.endTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            show.predictedOccupancy,
            show.soldSeats,
          ],
          itemStyle: {
            color: heatColor,
            borderColor: 'rgba(10,22,40,0.8)',
            borderWidth: 1,
            borderRadius: 3,
            shadowColor: heatColor,
            shadowBlur: 6,
          },
        });
      });
    });

    return {
      backgroundColor: 'transparent',
      tooltip: {
        backgroundColor: 'rgba(10, 22, 40, 0.95)',
        borderColor: COLORS.primary,
        borderWidth: 1,
        textStyle: { color: COLORS.text, fontSize: 11 },
        formatter: (p: any) => {
          const v = p.data.value;
          const heatColor = HEAT_COLOR_MAP[v[3] as 1 | 2 | 3 | 4 | 5];
          return `
            <div style="color:${heatColor};font-weight:bold;margin-bottom:4px">${v[4]}</div>
            <div style="color:${COLORS.textSecondary};font-size:10px">${v[5]} - ${v[6]}</div>
            <div style="color:${COLORS.text};font-size:10px;margin-top:4px">
              预测上座: <span style="color:${heatColor};font-weight:bold">${v[7]}%</span><br/>
              已售座位: <span style="color:${COLORS.primary};font-weight:bold">${v[8]}</span>
            </div>
          `;
        },
      },
      grid: {
        left: 60,
        right: 20,
        top: 30,
        bottom: 30,
      },
      xAxis: {
        type: 'value',
        min: 0,
        max: 15,
        interval: 1,
        axisLabel: {
          formatter: (_: any, idx: number) => xAxisData[idx] || '',
          color: COLORS.textMuted,
          fontSize: 10,
        },
        axisLine: { lineStyle: { color: COLORS.border } },
        splitLine: { lineStyle: { color: COLORS.border, opacity: 0.3 } },
      },
      yAxis: {
        type: 'category',
        data: yAxisData,
        axisLabel: { color: COLORS.textSecondary, fontSize: 10 },
        axisLine: { lineStyle: { color: COLORS.border } },
        splitLine: { lineStyle: { color: COLORS.border, opacity: 0.3 } },
      },
      visualMap: {
        show: true,
        min: 1,
        max: 5,
        calculable: false,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        itemWidth: 12,
        itemHeight: 8,
        textStyle: { color: COLORS.textMuted, fontSize: 9 },
        formatter: (value: number) => {
          const labels = ['', '低', '较低', '中', '较高', '高'];
          return labels[Math.round(value)];
        },
        inRange: {
          color: Object.values(HEAT_COLOR_MAP),
        },
      },
      series: [
        {
          type: 'custom',
          renderItem: (params: any, api: any) => {
            const categoryIndex = api.value(1);
            const start = api.coord([api.value(0), categoryIndex]);
            const end = api.coord([api.value(0) + api.value(2), categoryIndex]);
            const height = api.size([0, 1])[1] * 0.7;
            const rectShape = {
              x: start[0],
              y: start[1] - height / 2,
              width: end[0] - start[0],
              height,
            };
            return {
              type: 'rect',
              shape: rectShape,
              style: api.style(),
              styleEmphasis: {
                ...api.style(),
                shadowBlur: 15,
              },
            };
          },
          encode: {
            x: [0, 2],
            y: 1,
          },
          data,
        },
      ],
    };
  }, [halls, showtimes]);

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
