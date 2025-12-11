const colors = {
  brand: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },
  charcoal: "#0f172a",
  mint: "#22d3ee",
};

const fonts = {
  heading: "'Space Grotesk', system-ui, sans-serif",
  body: "'Space Grotesk', system-ui, sans-serif",
};

const styles = {
  global: {
    body: {
      bg: "#f8fafc",
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
      },
      defaultProps: {
        colorScheme: "brand",
      },
    },
  },
};
