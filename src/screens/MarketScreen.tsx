import React, { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COMPANIES } from '../data/companies';
import { StockRow } from '../components/StockRow';
import { theme } from '../theme';
import { TabScreenProps } from '../navigation/types';

type Props = TabScreenProps<'Market'>;

export function MarketScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMPANIES;
    return COMPANIES.filter(
      (c) =>
        c.symbol.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.sector.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Guyana Stock Exchange</Text>
        <Text style={styles.subtitle}>
          {COMPANIES.length} listed companies
        </Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search symbol, name, or sector"
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.search}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.symbol}
        renderItem={({ item }) => (
          <StockRow
            company={item}
            onPress={() =>
              navigation.navigate('StockDetail', { symbol: item.symbol })
            }
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No matches.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    paddingHorizontal: theme.spacing(2),
    paddingBottom: theme.spacing(1.5),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.font.h1,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  search: {
    marginTop: theme.spacing(1.5),
    height: 40,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing(1.5),
    fontSize: theme.font.body,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  empty: {
    textAlign: 'center',
    padding: theme.spacing(3),
    color: theme.colors.textSecondary,
  },
});
