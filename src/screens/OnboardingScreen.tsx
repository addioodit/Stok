import React, { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboarding } from '../store/useOnboarding';
import { theme } from '../theme';

interface Slide {
  badge: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    badge: '1',
    title: 'Stok prepares orders — your broker executes them',
    body:
      "The Guyana Stock Exchange has no public retail trading API, so Stok can't buy or sell on your behalf. The order ticket composes an email or phone call to one of the GSE's licensed brokers. They place the trade, then you come back and record the fill.",
  },
  {
    badge: '2',
    title: 'Track what you actually hold',
    body:
      "Once your broker confirms a fill, tap Record fill on the order ticket. Stok adds it to your portfolio with a weighted average cost, logs it in Activity, and starts tracking the symbol's history.",
  },
  {
    badge: '3',
    title: 'Stay close to the market',
    body:
      'Market pulls the latest GASCI session report. Watchlist follows the symbols you flag. Dividends shows what you can expect from upcoming declarations. News aggregates Guyana and Caribbean headlines so context is one tap away.',
  },
];

export function OnboardingScreen() {
  const markSeen = useOnboarding((s) => s.markSeen);
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const onNext = () => {
    if (index < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
    } else {
      markSeen();
    }
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.topBar}>
        {!isLast ? (
          <Pressable
            onPress={markSeen}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Skip introduction"
          >
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
      >
        {SLIDES.map((s) => (
          <View key={s.badge} style={[styles.slide, { width }]}>
            <View style={styles.badge}>
              <Text style={styles.badgeNumber}>{s.badge}</Text>
            </View>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
        <PrimaryButton
          label={isLast ? 'Get started' : 'Next'}
          onPress={onNext}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.spacing(2),
    paddingTop: theme.spacing(1),
    minHeight: 32,
  },
  skip: {
    fontSize: theme.font.small,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    padding: theme.spacing(0.5),
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing(3),
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(3),
  },
  badgeNumber: {
    color: theme.colors.textInverse,
    fontSize: 36,
    fontWeight: '700',
  },
  title: {
    fontSize: theme.font.h1,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 30,
  },
  body: {
    marginTop: theme.spacing(2),
    fontSize: theme.font.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: theme.spacing(3),
    paddingBottom: theme.spacing(3),
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing(2),
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: theme.colors.primary,
  },
});
