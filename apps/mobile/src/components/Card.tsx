import { View, type ViewStyle } from "react-native";
import { colors, radii, spacing } from "@/theme/tokens";

export interface CardProps {
  children: React.ReactNode;
  padding?: number;
  style?: ViewStyle;
}

export function Card({ children, padding = spacing.s5, style }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.paper,
          borderColor: colors.mist,
          borderWidth: 1,
          borderRadius: radii.r4,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
