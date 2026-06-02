import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ALL_LEGAL, LegalDocId } from '../data/legal';
import { LegalView } from '../components/LegalView';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAcceptance } from '../store/useAcceptance';
import { theme } from '../theme';

const DOCS: LegalDocId[] = ['privacy', 'terms', 'disclosure'];

export function AcceptScreen() {
  const [agreed, setAgreed] = useState(false);
  const [readDocs, setReadDocs] = useState<Set<LegalDocId>>(new Set());
  const [open, setOpen] = useState<LegalDocId | null>(null);
  const accept = useAcceptance((s) => s.accept);

  const allRead = DOCS.every((d) => readDocs.has(d));
  const canContinue = agreed && allRead;

  const closeDoc = () => {
    if (open) {
      setReadDocs((prev) => {
        if (prev.has(open)) return prev;
        const next = new Set(prev);
        next.add(open);
        return next;
      });
    }
    setOpen(null);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Welcome to Stok</Text>
        <Text style={styles.subtitle}>
          A portfolio and order-prep tool for the Guyana Stock Exchange.
        </Text>
        <Text style={styles.body}>
          Before you continue, please read the three documents below. Stok does
          not execute trades — it prepares orders for a licensed GSE broker you
          choose, and tracks the positions you record.
        </Text>

        <View style={styles.docList}>
          {DOCS.map((id) => {
            const doc = ALL_LEGAL[id];
            const read = readDocs.has(id);
            return (
              <Pressable
                key={id}
                onPress={() => setOpen(id)}
                accessibilityRole="button"
                accessibilityLabel={`${doc.title}${read ? ', already read' : ''}`}
                accessibilityHint={read ? 'Tap to view again' : 'Tap to read'}
                style={({ pressed }) => [
                  styles.docRow,
                  pressed && { backgroundColor: theme.colors.surfaceAlt },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>{doc.title}</Text>
                  <Text style={styles.docHint}>
                    {read ? 'Read · tap to view again' : 'Tap to read'}
                  </Text>
                </View>
                <Text
                  style={[styles.docCheck, read && styles.docCheckOn]}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                >
                  {read ? '✓' : '›'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => setAgreed((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityLabel="I agree to the Privacy Policy, Terms of Use, and Important Disclosure"
          accessibilityState={{ checked: agreed }}
          style={styles.agreeRow}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxOn]}>
            {agreed ? <Text style={styles.checkboxMark}>✓</Text> : null}
          </View>
          <Text style={styles.agreeText}>
            I have read and agree to the Privacy Policy, Terms of Use, and
            Important Disclosure.
          </Text>
        </Pressable>

        {!allRead ? (
          <Text style={styles.hint}>
            Open each document above before continuing.
          </Text>
        ) : null}

        <View style={{ height: theme.spacing(2) }} />
        <PrimaryButton
          label="Continue"
          onPress={accept}
          disabled={!canContinue}
        />
      </ScrollView>

      <Modal
        visible={open !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDoc}
      >
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.bg }}>
          <View style={styles.modalHeader}>
            <Pressable
              onPress={closeDoc}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close document"
            >
              <Text style={styles.modalDone}>Done</Text>
            </Pressable>
          </View>
          {open ? <LegalView doc={ALL_LEGAL[open]} /> : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: {
    padding: theme.spacing(2),
    paddingBottom: theme.spacing(4),
    alignItems: 'stretch',
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 18,
    alignSelf: 'center',
    marginTop: theme.spacing(2),
  },
  title: {
    marginTop: theme.spacing(2),
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: theme.spacing(1),
    fontSize: theme.font.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  body: {
    marginTop: theme.spacing(2),
    fontSize: theme.font.body,
    color: theme.colors.text,
    lineHeight: 22,
  },
  docList: {
    marginTop: theme.spacing(3),
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing(1.75),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
  },
  docTitle: {
    fontSize: theme.font.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  docHint: {
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  docCheck: {
    fontSize: theme.font.h2,
    color: theme.colors.textSecondary,
    paddingHorizontal: theme.spacing(1),
  },
  docCheckOn: { color: theme.colors.positive },
  agreeRow: {
    marginTop: theme.spacing(3),
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.sm,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing(1.25),
    backgroundColor: theme.colors.bg,
  },
  checkboxOn: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxMark: {
    color: theme.colors.textInverse,
    fontWeight: '700',
    fontSize: 14,
  },
  agreeText: {
    flex: 1,
    fontSize: theme.font.body,
    color: theme.colors.text,
    lineHeight: 22,
  },
  hint: {
    marginTop: theme.spacing(1),
    fontSize: theme.font.tiny,
    color: theme.colors.textSecondary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: theme.spacing(1.5),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  modalDone: {
    fontSize: theme.font.body,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
