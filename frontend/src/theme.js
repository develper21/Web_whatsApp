const colors = {
  // Primary blues for professional look
  primary: {
    50: "#e3f2fd",
    100: "#bbdefb",
    200: "#90caf9",
    300: "#64b5f6",
    400: "#42a5f5",
    500: "#2196f3",
    600: "#1e88e5",
    700: "#1976d2",
    800: "#1565c0",
    900: "#0d47a1",
  },
  // Secondary accent colors
  secondary: {
    50: "#fff8e1",
    100: "#ffecb3",
    200: "#ffe082",
    300: "#ffd54f",
    400: "#ffca28",
    500: "#ffc107",
    600: "#ffb300",
    700: "#ffa000",
    800: "#ff8f00",
    900: "#ff6f00",
  },
  // Status colors
  success: "#4caf50",
  warning: "#ff9800",
  error: "#f44336",
  info: "#2196f3",
  // Neutrals for backgrounds and text
  dark: {
    900: "#0a0a0a",
    800: "#1a1a1a",
    700: "#2a2a2a",
    600: "#3a3a3a",
  },
  light: {
    900: "#ffffff",
    800: "#f5f5f5",
    700: "#e0e0e0",
    600: "#bdbdbd",
  }
};

const fonts = {
  heading: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
  body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
  mono: "'Roboto Mono', monospace",
};

const styles = {
  global: {
    body: {
      bg: "#f8fafc",
      color: "#0f172a",
      fontFamily: fonts.body,
    },
  },
};

export const theme = {
  config: {
    initialColorMode: "light",
  },
  colors,
  fonts,
  styles,
  components: {
    Button: {
      baseStyle: {
        rounded: "lg",
        fontWeight: "500",
      },
      defaultProps: {
        colorScheme: "primary",
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: "lg",
        }
      }
    },
    Card: {
      baseStyle: {
        rounded: "xl",
        shadow: "sm",
      }
    }
  },
};