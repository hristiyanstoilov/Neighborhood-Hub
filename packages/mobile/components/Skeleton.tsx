import { View, StyleSheet, type StyleProp, type ViewStyle, type DimensionValue } from 'react-native'

type SkeletonProps = {
  width?: DimensionValue
  height?: number
  radius?: number
  style?: StyleProp<ViewStyle>
}

export function Skeleton({ width = '100%', height = 16, radius = 8, style }: SkeletonProps) {
  return <View style={[styles.base, { width, height, borderRadius: radius }, style]} />
}

export function SkeletonCircle({ size = 48 }: { size?: number }) {
  return <View style={[styles.base, { width: size, height: size, borderRadius: size / 2 }]} />
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#e5e7eb',
    opacity: 0.9,
  },
})