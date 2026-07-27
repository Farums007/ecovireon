"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MetricCard, MetricSeries } from "@/lib/queries/dashboard";

function formatKey(key: string) {
  return key.replace(/_/g, " ");
}

export function MetricsDashboard({
  cards,
  series,
}: {
  cards: MetricCard[];
  series: MetricSeries[];
}) {
  if (cards.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No numeric metrics recorded yet. Add metrics like{" "}
        <code>canopy_cover_percent: 45</code> to field observations to see
        trends here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.key} className="border-border/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {formatKey(card.key)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{card.latestValue}</p>
              <p className="text-xs text-muted-foreground">
                as of {new Date(card.latestDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {series
          .filter((s) => s.points.length > 1)
          .map((s) => (
            <Card key={s.key}>
              <CardHeader>
                <CardTitle className="text-sm capitalize">
                  {formatKey(s.key)}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={s.points}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value: string) =>
                        new Date(value).toLocaleDateString()
                      }
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} width={40} />
                    <Tooltip
                      labelFormatter={(value) =>
                        new Date(String(value)).toLocaleString()
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#16a02d"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
