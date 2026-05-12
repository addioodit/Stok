import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

interface Option<T extends string> {
  label: string;
  value: T;
}

interface Props<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: Props<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.opt, selected && styles.selected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    padding: 4,
  },
  opt: {
    flex: 1,
    paddingVertical: theme.spacing(1),
    borderRadius: theme.radius.sm,
    alignItems: 'center',
  },
  selected: {
    backgroundColor: theme.colors.bg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontSize: theme.font.small,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  labelSelected: { color: theme.colors.text },
});
