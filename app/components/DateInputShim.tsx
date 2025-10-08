//DateInputShim.tsx

import React, { useState } from 'react';
import { Platform, TextInput, TextInputProps } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';

/**
 * A lightweight wrapper around the native DateTimePicker that behaves like a TextInput.
 * - Displays the selected date as formatted text.
 * - When tapped, it opens the native date picker (iOS inline / Android modal).
 *
 * This makes it easy to drop into forms that expect a TextInput.
 */
type Props = {
  /** The currently selected date */
  date: Date;

  /** Callback fired when the date changes */
  onChange: (d: Date) => void;

  /** Display format (defaults to 'YYYY-MM-DD') */
  format?: string;

  /** Optional props to pass through to the TextInput */
  textInputProps?: TextInputProps;

  /** Optional minimum date constraint */
  minimumDate?: Date;

  /** Optional maximum date constraint */
  maximumDate?: Date;
};

export default function DateInputShim({
  date,
  onChange,
  format = 'YYYY-MM-DD',
  textInputProps,
  minimumDate,
  maximumDate,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);

  /**
   * Handles the change event from the native DateTimePicker.
   * - On Android, we hide the picker immediately after selection.
   * - On iOS, the inline picker stays visible.
   */
  const handleDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selected) {
      onChange(selected);
    }
  };

  return (
    <>
      {/* 
        The TextInput is read-only and formatted using dayjs.
        Tapping it opens the native date picker.
      */}
      <TextInput
        value={dayjs(date).format(format)}
        editable={false}
        onPressIn={() => setShowPicker(true)}
        onFocus={(e) => {
          e.preventDefault?.();
          setShowPicker(true);
        }}
        {...textInputProps}
      />

      {/* 
        Conditionally render the native DateTimePicker.
        iOS uses an inline display; Android shows a modal calendar.
      */}
      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </>
  );
}
