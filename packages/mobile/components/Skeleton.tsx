import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, type StyleProp, type ViewStyle, type DimensionValue } from 'react-native'

type SkeletonProps = {
  width?: DimensionValue
  height?: number
  radius?: number
  style?: StyleProp<ViewStyle>
}

function usePulse() {
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [opacity])

  return opacity
}

export function Skeleton({ width = '100%', height = 16, radius = 8, style }: SkeletonProps) {
  const opacity = usePulse()
  return (
    <Animated.View
      style={[styles.base, { width, height, borderRadius: radius, opacity }, style]}
    />
  )
}

export function SkeletonCircle({ size = 48 }: { size?: number }) {
  const opacity = usePulse()
  return (
    <Animated.View
      style={[styles.base, { width: size, height: size, borderRadius: size / 2, opacity }]}
    />
  )
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#e5e7eb',
  },
})
