import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { fetchRawAndParse, RawAndParsed } from '../data/marketReport';
import {
  diagnoseSymbols,
  summarizeTables,
  SymbolStatus,
} from '../data/marketReportParser';
import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../theme';
import { classifyFetchError } from '../utils/errorMessage';
import { formatGYD } from '../utils/format';

const RAW_PREVIEW_LIMIT = 4000;

type Filter = 'all' | 'parsed' | 'missing';

export function DebugParserScreen() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RawAndParsed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionInput, setSessionInput] = useState('');
  const [expandHtml, setExpandHtml] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const run = async (sessionNumber?: number) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetchRawAndParse(
        sessionNumber != null ? { sessionNumber } : {},
      );
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const diagnostics = useMemo(
    () => (result ? diagnoseSymbols(result.html, result.parsed) : []),
    [result],
  );
  const tableSummaries = useMemo(
    () => (result ? summarizeTables(result.html) : []),
    [result],
  );
  const counts = useMemo(() => {
    const c = { parsed: 0, found: 0, missing: 0 } as const as {
      parsed: number;
      found: number;
      missing: number;
    };
    let parsed = 0;
    let found = 0;
    let missing = 0;
    for (const d of diagnostics) {
      if (d.status === 'parsed') parsed++;
      else if (d.status === 'in-text-not-parsed') found++;
      else missing++;
    }
    return { parsed, found, missing };
  }, [diagnostics]);

  const filtered = diagnostics.filter((d) => {
    if (filter === 'all') return true;
    if (filter === 'parsed') return d.status === 'parsed';
    return d.status !== 'parsed'; // missing
  });

  const shareHtml = () => {
    if (!result) return;
    Share.share({
      title: 'GASCI raw HTML',
      message: result.html,
    });
  };

  const shareDiagnostics = () => {
    if (!result) return;
    const lines = [
      `Stok parser diagnostic`,
      `Source: ${result.sourceUrl}`,
      `Session label: ${result.parsed.sessionLabel ?? '—'}`,
      `Strategy: ${result.parsed.strategy}`,
      `Parsed ${counts.parsed} / ${diagnostics.length}, ${counts.found} in-text-not-parsed, ${counts.missing} missing`,
      '',
      'Tables:',
      ...tableSummaries.map(
        (t, i) =>
          `  [${i}] rows=${t.rowCount} security=${t.securityCol} last=${t.lastCol} prev=${t.prevCol} headers=[${t.headers.join(' | ')}]`,
      ),
      '',
      'Symbols:',
      ...diagnostics.map((d) => `  ${d.symbol}  ${d.status}${d.last ? `  last=${d.last} prev=${d.prev}` : ''}`),
    ];
    Share.share({ title: 'Stok parser diagnostic', message: lines.join('\n') });
  };

  const classified = error ? classifyFetchError(error) : null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing(2) }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Parser debug</Text>
        <Text style={styles.help}>
          Hits GASCI live, then prints what the parser extracted. Use the
          Share buttons to send the raw HTML or the diagnostic summary off the
          device so the parser can be tuned against it.
        </Text>

        <View style={styles.actions}>
          <PrimaryButton
            label={loading ? 'Fetching…' : 'Fetch latest'}
            onPress={() => run()}
            loading={loading}
            disabled={loading}
            style={{ flex: 1 }}
          />
        </View>

        <View style={styles.sessionRow}>
          <TextInput
            value={sessionInput}
            onChangeText={(v) => setSessionInput(v.replace(/[^0-9]/g, ''))}
            placeholder="Session #"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="number-pad"
            style={styles.sessionInput}
          />
          <PrimaryButton
            label="Fetch session"
            variant="secondary"
            onPress={() => {
              const n = Number(sessionInput);
              if (n > 0) void run(n);
            }}
            disabled={loading || !sessionInput}
          />
        </View>

        {classified ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>{classified.title}</Text>
            <Text style={styles.errorBody}>{classified.body}</Text>
            <Text style={styles.errorRaw} numberOfLines={4}>
              {error}
            </Text>
          </View>
        ) : null}

        {result ? (
          <>
            <Section title="Source">
              <KV label="URL" value={result.sourceUrl} mono />
              <KV
                label="Session #"
                value={
                  result.sessionNumberRequested != null
                    ? String(result.sessionNumberRequested)
                    : '—'
                }
              />
              <KV
                label="Page session label"
                value={result.parsed.sessionLabel ?? '—'}
              />
              <KV
                label="Strategy"
                value={result.parsed.strategy}
                tone={
                  result.parsed.strategy === 'tables'
                    ? 'positive'
                    : result.parsed.strategy === 'loose'
                      ? 'warn'
                      : 'negative'
                }
              />
              <KV
                label="HTML size"
                value={`${result.html.length.toLocaleString('en-US')} chars`}
              />
            </Section>

            <Section title={`Symbols  ·  ${counts.parsed} parsed / ${counts.found} in-text-not-parsed / ${counts.missing} missing`}>
              <View style={styles.filterRow}>
                {(['all', 'parsed', 'missing'] as Filter[]).map((f) => (
                  <Pressable
                    key={f}
                    onPress={() => setFilter(f)}
                    style={[
                      styles.filterPill,
                      filter === f && styles.filterPillOn,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        filter === f && styles.filterTextOn,
                      ]}
                    >
                      {f}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {filtered.map((d) => (
                <View key={d.symbol} style={styles.symRow}>
                  <Text
                    style={[
                      styles.symStatus,
                      { color: statusColor(d.status) },
                    ]}
                  >
                    {statusGlyph(d.status)}
                  </Text>
                  <Text style={styles.symSymbol}>{d.symbol}</Text>
                  <Text style={styles.symBody} numberOfLines={1}>
                    {d.status === 'parsed'
                      ? `last ${formatGYD(d.last ?? 0)} · prev ${formatGYD(d.prev ?? 0)}`
                      : d.status === 'in-text-not-parsed'
                        ? 'in page text but parser missed the row'
                        : 'not found anywhere on the page'}
                  </Text>
                </View>
              ))}
            </Section>

            <Section title={`Tables  ·  ${tableSummaries.length} found`}>
              {tableSummaries.length === 0 ? (
                <Text style={styles.empty}>No &lt;table&gt; tags in the page.</Text>
              ) : (
                tableSummaries.map((t, i) => (
                  <View key={i} style={styles.tableBlock}>
                    <Text style={styles.tableHeader}>
                      [{i}] rows={t.rowCount} · security col={t.securityCol} ·
                      {' '}last col={t.lastCol} · prev col={t.prevCol}
                    </Text>
                    <Text style={styles.tableHeaders}>
                      {t.headers.length
                        ? t.headers.map((h, j) => `${j}:${h}`).join('  ')
                        : '(no header row)'}
                    </Text>
                  </View>
                ))
              )}
            </Section>

            <Section title={`Raw HTML  ·  ${result.html.length.toLocaleString('en-US')} chars`}>
              <Text style={styles.rawHtml} selectable>
                {expandHtml
                  ? result.html
                  : result.html.slice(0, RAW_PREVIEW_LIMIT) +
                    (result.html.length > RAW_PREVIEW_LIMIT
                      ? `\n\n… ${(result.html.length - RAW_PREVIEW_LIMIT).toLocaleString('en-US')} more chars (tap Expand)`
                      : '')}
              </Text>
              {result.html.length > RAW_PREVIEW_LIMIT ? (
                <Pressable onPress={() => setExpandHtml((v) => !v)}>
                  <Text style={styles.expandLink}>
                    {expandHtml ? 'Collapse' : 'Expand full HTML'}
                  </Text>
                </Pressable>
              ) : null}
            </Section>

            <View style={styles.shareRow}>
              <PrimaryButton
                label="Share raw HTML"
                variant="secondary"
                onPress={shareHtml}
                style={{ flex: 1 }}
              />
              <View style={{ width: theme.spacing(1) }} />
              <PrimaryButton
                label="Share diagnostic"
                variant="secondary"
                onPress={shareDiagnostics}
                style={{ flex: 1 }}
              />
            </View>

            <Text style={styles.footer}>
              To replace the test fixture, share the raw HTML to yourself, paste
              into{' '}
              <Text style={{ fontFamily: 'Courier' }}>
                src/data/__fixtures__/session-sample.html
              </Text>
              , and run the parser tests.
            </Text>
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function KV({
  label,
  value,
  mono,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: 'positive' | 'warn' | 'negative';
}) {
  return (
    <View style={styles.kv}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text
        style={[
          styles.kvValue,
          mono && { fontFamily: 'Courier' },
          tone === 'positive' && { color: theme.colors.positive },
          tone === 'warn' && { color: theme.colors.warn },
          tone === 'negative' && { color: theme.colors.negative },
        ]}
        numberOfLines={3}
      >
        {value}
      </Text>
    </View>
  );
}

function statusGlyph(s: SymbolStatus): string {
  return s === 'parsed' ? '✓' : s === 'in-text-not-parsed' ? '⚠' : '✗';
}

function statusColor(s: SymbolStatus): string {
  return s === 'parsed'
    ? theme.colors.positive
    : s === 'in-text-not-parsed'
      ? theme.colors.warn
      : theme.colors.negative;
}

const styles = StyleSheet.create({
  title: {
    fontSize: theme.font.h1,
    fontWeight: '700',
    color: theme.colors.text,
  },
  help: {
    marginTop: theme.spacing(0.5),
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  actions: { marginTop: theme.spacing(2) },
  sessionRow: {
    marginTop: theme.spacing(1.5),
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionInput: {
    flex: 1,
    height: 44,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing(1.5),
    fontSize: theme.font.body,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing(1),
  },
  errorCard: {
    marginTop: theme.spacing(2),
    backgroundColor: '#FEF2F2',
    borderColor: theme.colors.negative,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing(1.5),
  },
  errorTitle: {
    fontSize: theme.font.body,
    fontWeight: '700',
    color: theme.colors.negative,
  },
  errorBody: {
    marginTop: 4,
    fontSize: theme.font.small,
    color: theme.colors.negative,
    lineHeight: 18,
  },
  errorRaw: {
    marginTop: theme.spacing(1),
    fontSize: theme.font.tiny,
    color: theme.colors.negative,
    fontFamily: 'Courier',
    opacity: 0.7,
  },
  section: {
    marginTop: theme.spacing(3),
  },
  sectionTitle: {
    fontSize: theme.font.tiny,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: theme.spacing(1),
  },
  kv: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  kvLabel: {
    width: 120,
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
  },
  kvValue: {
    flex: 1,
    fontSize: theme.font.small,
    color: theme.colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing(1),
  },
  filterPill: {
    paddingHorizontal: theme.spacing(1.25),
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing(0.75),
    backgroundColor: theme.colors.bg,
  },
  filterPillOn: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: theme.font.tiny,
    fontWeight: '600',
    color: theme.colors.text,
  },
  filterTextOn: { color: theme.colors.textInverse },
  symRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  symStatus: {
    width: 22,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
  symSymbol: {
    width: 60,
    fontSize: theme.font.small,
    fontWeight: '700',
    color: theme.colors.text,
  },
  symBody: {
    flex: 1,
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
  },
  empty: {
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
  },
  tableBlock: {
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  tableHeader: {
    fontSize: theme.font.tiny,
    fontWeight: '700',
    color: theme.colors.text,
  },
  tableHeaders: {
    marginTop: 2,
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
    fontFamily: 'Courier',
  },
  rawHtml: {
    fontSize: 11,
    fontFamily: 'Courier',
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing(1),
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  expandLink: {
    marginTop: theme.spacing(1),
    fontSize: theme.font.small,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  shareRow: {
    flexDirection: 'row',
    marginTop: theme.spacing(2),
  },
  footer: {
    marginTop: theme.spacing(2),
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
});
