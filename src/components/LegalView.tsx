import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LegalDocument } from '../data/legal';
import { theme } from '../theme';

interface Props {
  doc: LegalDocument;
}

export function LegalView({ doc }: Props) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>{doc.title}</Text>
      <Text style={styles.effective}>Effective {doc.effectiveDate}</Text>
      <Text style={styles.intro}>{doc.intro}</Text>
      {doc.sections.map((s, i) => (
        <View key={i} style={styles.section}>
          {s.title ? <Text style={styles.sectionTitle}>{s.title}</Text> : null}
          <Text style={styles.body}>{s.text}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: {
    padding: theme.spacing(2),
    paddingBottom: theme.spacing(4),
  },
  title: {
    fontSize: theme.font.h1,
    fontWeight: '700',
    color: theme.colors.text,
  },
  effective: {
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
    marginTop: 4,
    marginBottom: theme.spacing(2),
  },
  intro: {
    fontSize: theme.font.body,
    color: theme.colors.text,
    lineHeight: 24,
    marginBottom: theme.spacing(2),
  },
  section: {
    marginTop: theme.spacing(2),
  },
  sectionTitle: {
    fontSize: theme.font.body,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing(0.75),
  },
  body: {
    fontSize: theme.font.body,
    color: theme.colors.text,
    lineHeight: 24,
  },
});
