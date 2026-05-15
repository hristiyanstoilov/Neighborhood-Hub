// Web stub for @react-native-community/datetimepicker
// The native picker is replaced with a plain HTML date input on web.
import React from 'react'

export const DateTimePickerAndroid = {
  open: () => {},
  dismiss: () => {},
}

export default function DateTimePicker({ value, onChange, minimumDate, maximumDate, mode = 'date' }) {
  function handleChange(e) {
    if (onChange) {
      const date = new Date(e.target.value)
      onChange({}, date)
    }
  }

  const inputType = mode === 'time' ? 'time' : 'datetime-local'
  const isoValue = value instanceof Date && !isNaN(value)
    ? (mode === 'time'
        ? value.toTimeString().slice(0, 5)
        : value.toISOString().slice(0, 16))
    : ''

  const minAttr = minimumDate instanceof Date
    ? (mode === 'time'
        ? minimumDate.toTimeString().slice(0, 5)
        : minimumDate.toISOString().slice(0, 16))
    : undefined

  const maxAttr = maximumDate instanceof Date
    ? (mode === 'time'
        ? maximumDate.toTimeString().slice(0, 5)
        : maximumDate.toISOString().slice(0, 16))
    : undefined

  return React.createElement('input', {
    type: inputType,
    value: isoValue,
    min: minAttr,
    max: maxAttr,
    onChange: handleChange,
    style: { padding: 8, borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 },
  })
}
