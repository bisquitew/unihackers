import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { toQR } from 'toqr';

interface QRCodeViewProps {
  value: string;
  size?: number;
}

export function QRCodeView({ value, size = 200 }: QRCodeViewProps) {
  // Generate a true, spec-compliant QR code using toqr (Level M error correction)
  const { pathData, dim } = useMemo(() => {
    try {
      const qrText = value || 'https://explorer.solana.com';
      // Level M (0) is standard for mobile camera scanning, producing larger pixel modules
      const matrix = toQR(qrText, 0);
      const dimension = Math.round(Math.sqrt(matrix.length));
      
      let p = '';
      for (let r = 0; r < dimension; r++) {
        for (let c = 0; c < dimension; c++) {
          if (matrix[r * dimension + c] === 1) {
            p += `M${c},${r}h1v1h-1z `;
          }
        }
      }
      return { pathData: p, dim: dimension };
    } catch (e) {
      console.warn('QR code generation error:', e);
      return { pathData: '', dim: 21 };
    }
  }, [value]);

  const quietZone = 2; // Standard QR quiet zone margin
  const viewBoxSize = dim + quietZone * 2;

  return (
    <View style={[styles.container, { width: size + 24, height: size + 24 }]}>
      <Svg
        viewBox={`-${quietZone} -${quietZone} ${viewBoxSize} ${viewBoxSize}`}
        width={size}
        height={size}
      >
        {/* Crisp white background */}
        <Rect
          x={-quietZone}
          y={-quietZone}
          width={viewBoxSize}
          height={viewBoxSize}
          fill="#ffffff"
        />
        {/* Real QR Code vector modules */}
        <Path d={pathData} fill="#1A1033" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    
    
    
    
  },
});
