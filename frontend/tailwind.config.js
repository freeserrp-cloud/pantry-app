module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        iosBg: "#f5f5f7",
        iosCard: "#ffffff",
        iosBlue: "#007aff",
        iosText: "#1d1d1f",
        iosSubtle: "#86868b"
      },
      boxShadow: {
        ios: "0 10px 30px rgba(0,0,0,0.08)",
        soft: "0 4px 12px rgba(0,0,0,0.06)"
      },
      borderRadius: {
        xl: "20px",
        xxl: "28px"
      }
    },
  },
  plugins: [],
};
