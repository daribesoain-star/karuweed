import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const sizeStyles = {
  small: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  medium: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8 },
  large: { paddingHorizontal: 24, paddingVertical: 16, borderRadius: 8 },
};

const textSizes = {
  small: 14,
  medium: 16,
  large: 18,
};

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  disabled = false,
  loading = false,
  size = 'medium',
  style,
  textStyle,
}) => {
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;
  const textColor = isPrimary ? '#0A0A0A' : '#22C55E';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isPrimary ? '#22C55E' : 'transparent',
          borderWidth: isPrimary ? 0 : 2,
          borderColor: isPrimary ? undefined : '#22C55E',
          opacity: isDisabled ? 0.5 : 1,
          ...sizeStyles[size],
        },
        style,
      ]}
    >
      {loading && (
        <ActivityIndicator size="small" color={textColor} style={{ marginRight: 8 }} />
      )}
      <Text
        style={[
          {
            color: textColor,
            fontWeight: '600',
            fontSize: textSizes[size],
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};
