import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { FieldObservation } from "@/lib/queries/observations";
import type { Project } from "@/lib/queries/projects";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#555", marginBottom: 16 },
  sectionTitle: { fontSize: 13, marginTop: 16, marginBottom: 8 },
  row: { flexDirection: "row", borderBottom: "1 solid #ddd", paddingVertical: 4 },
  headerRow: { flexDirection: "row", borderBottom: "1 solid #333", paddingVertical: 4, fontWeight: 700 },
  cellDate: { width: "18%" },
  cellMetrics: { width: "42%" },
  cellNotes: { width: "40%" },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 },
  statCard: { border: "1 solid #ddd", borderRadius: 4, padding: 8, width: 120 },
  statLabel: { color: "#555", fontSize: 8, textTransform: "capitalize" },
  statValue: { fontSize: 14, marginTop: 2 },
});

export function ProjectReportPdf({
  project,
  title,
  periodStart,
  periodEnd,
  observations,
  metricLatest,
}: {
  project: Project;
  title: string;
  periodStart: string;
  periodEnd: string;
  observations: FieldObservation[];
  metricLatest: { key: string; value: number }[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {project.name} · {periodStart} to {periodEnd}
        </Text>

        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.statGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>observations</Text>
            <Text style={styles.statValue}>{observations.length}</Text>
          </View>
          {metricLatest.map((m) => (
            <View key={m.key} style={styles.statCard}>
              <Text style={styles.statLabel}>{m.key.replace(/_/g, " ")}</Text>
              <Text style={styles.statValue}>{m.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Field observations</Text>
        <View style={styles.headerRow}>
          <Text style={styles.cellDate}>Date</Text>
          <Text style={styles.cellMetrics}>Metrics</Text>
          <Text style={styles.cellNotes}>Notes</Text>
        </View>
        {observations.map((o) => (
          <View key={o.id} style={styles.row}>
            <Text style={styles.cellDate}>
              {new Date(o.observedAt).toLocaleDateString()}
            </Text>
            <Text style={styles.cellMetrics}>
              {Object.entries(o.metrics)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ")}
            </Text>
            <Text style={styles.cellNotes}>{o.notes}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
