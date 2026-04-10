import React from 'react';
import { TextInput, View, Text, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: any;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  placeholderTextColor,
  ...props
}) => {
  return (
    <View style={containerStyle}>
      {label && (
        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
          {label}
        </Text>
      )}
      <TextInput
        {...props}
        placeholderTextColor={placeholderTextColor || '#A0A0A0'}
        style={[
          {
            backgroundColor: '#1A1A2E',
            borderWidth: 1,
            borderColor: error ? '#C47A2C' : '#3A3A4E',
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            color: '#FFFFFF',
            fontSize: 16,
          },
          style,
        ]}
      />
      {error && (
        <Text style={{ color: '#C47A2C', fontSize: 12, marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
};
