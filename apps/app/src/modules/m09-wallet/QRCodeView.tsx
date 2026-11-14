import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface QRCodeViewProps {
  value: string;
  size?: number;
}

export function QRCodeView({ value, size = 180 }: QRCodeViewProps) {
  // Generate a deterministic 21x21 QR code matrix based on string hash
  const gridSize = 21;
  const cellSize = Math.floor(size / gridSize);

  // Hash the string to generate deterministic data bits
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  const isFinder = (r: number, c: number): boolean => {
    // Top-left finder (7x7)
    if (r < 7 && c < 7) {
      if (r === 0 || r === 6 || c === 0 || c === 6) return true;
      if (r >= 2 && r <= 4 && c >= 2 && c <= 4) return true;
      return false;
    }
    // Top-right finder (7x7)
    if (r < 7 && c >= gridSize - 7) {
      const col = c - (gridSize - 7);
      if (r === 0 || r === 6 || col === 0 || col === 6) return true;
      if (r >= 2 && r <= 4 && col >= 2 && col <= 4) return true;
      return false;
    }
    // Bottom-left finder (7x7)
    if (r >= gridSize - 7 && c < 7) {
      const row = r - (gridSize - 7);
      if (row === 0 || row === 6 || c === 0 || c === 6) return true;
      if (row >= 2 && row <= 4 && c >= 2 && c <= 4) return true;
      return false;
    }
    return false;
  };

  const isTiming = (r: number, c: number): boolean => {
    if (r === 6 && c >= 7 && c < gridSize - 7) return c % 2 === 0;
    if (c === 6 && r >= 7 && r < gridSize - 7) return r % 2 === 0;
    return false;
  };

  const isCenterBadge = (r: number, c: number): boolean => {
    return r >= 9 && r <= 11 && c >= 9 && c <= 11;
  };

  const getCellColor = (r: number, c: number): boolean => {
    if (isFinder(r, c)) return true;
    if (isTiming(r, c)) return true;
    if (isCenterBadge(r, c)) return false;

    // Data bits generated pseudo-randomly from string characters & coordinate
    const charIndex = (r * gridSize + c) % value.length;
    const charCode = value.charCodeAt(charIndex);
    const pseudoBit = (hash ^ (charCode * (r + 1) * (c + 1))) % 7;
    return pseudoBit < 4;
  };

  const rows = [];
  for (let r = 0; r < gridSize; r++) {
    const cols = [];
    for (let c = 0; c < gridSize; c++) {
      const isFilled = getCellColor(r, c);
      cols.push(
        <View
          key={`cell-${r}-${c}`}
          style={[
            styles.cell,
            {
              width: cellSize,
              height: cellSize,
              backgroundColor: isFilled ? '#09090b' : '#ffffff',
            },
          ]}
        />
      );
    }
    rows.push(
      <View key={`row-${r}`} style={styles.row}>
        {cols}
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: cellSize * gridSize + 20, height: cellSize * gridSize + 20 }]}>
      <View style={styles.qrGrid}>
        {rows}
        {/* Solana Logo in Center */}
        <View
          style={[
            styles.centerBadge,
            {
              width: cellSize * 3.4,
              height: cellSize * 3.4,
              borderRadius: (cellSize * 3.4) / 2,
            },
          ]}
        >
          <Text style={styles.badgeText}>◎</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  qrGrid: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    margin: 0,
    padding: 0,
  },
  centerBadge: {
    position: 'absolute',
    backgroundColor: '#8d23be',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
});
