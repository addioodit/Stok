import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { hueFromString } from '../utils/username';

interface Props {
  name: string;
  size?: number;
}

export function Avatar({ name, size = 44 }: Props) {
  const seed = name.trim() || '?';
  const hue = hueFromString(seed);
  const letter = seed.charAt(0).toUpperCase();
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `hsl(${hue}, 52%, 42%)`,
        },
      ]}
    >
      <Text style={[styles.letter, { fontSize: size * 0.42 }]}>{letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
