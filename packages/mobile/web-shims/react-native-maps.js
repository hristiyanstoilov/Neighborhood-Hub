// Web stub for react-native-maps — native maps not supported on web
import React from 'react'

export default function MapView({ style, children }) {
  return React.createElement(
    'div',
    { style: { ...style, background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
    React.createElement('span', { style: { color: '#6b7280', fontSize: 14 } }, 'Map not available on web'),
  )
}

export function Marker() { return null }
export function Callout() { return null }
export function Circle() { return null }
export function Polygon() { return null }
export function Polyline() { return null }
export const PROVIDER_GOOGLE = 'google'
export const PROVIDER_DEFAULT = null
