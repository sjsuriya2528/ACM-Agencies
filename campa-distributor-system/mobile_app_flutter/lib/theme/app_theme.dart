import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const Color primaryColor = Color(0xFF2563EB);
  static const Color secondaryColor = Color(0xFF64748B);
  static const Color backgroundColor = Color(0xFFF8FAFC);
  static const Color surfaceColor = Colors.white;
  static const Color errorColor = Color(0xFFEF4444);
  
  static ThemeData get lightTheme {
    return _buildTheme(
      brightness: Brightness.light,
      primary: primaryColor,
      secondary: secondaryColor,
      background: backgroundColor,
      surface: surfaceColor,
      error: errorColor,
      onSurface: const Color(0xFF1E293B),
      onBackground: const Color(0xFF64748B),
      fieldColor: const Color(0xFFF1F5F9),
      borderColor: const Color(0xFFF1F5F9),
    );
  }

  static ThemeData get darkTheme {
    return _buildTheme(
      brightness: Brightness.dark,
      primary: const Color(0xFF3B82F6),
      secondary: const Color(0xFF94A3B8),
      background: const Color(0xFF0F172A),
      surface: const Color(0xFF1E293B),
      error: const Color(0xFFEF4444),
      onSurface: Colors.white,
      onBackground: const Color(0xFF94A3B8),
      fieldColor: const Color(0xFF0F172A),
      borderColor: const Color(0xFF334155),
    );
  }

  static ThemeData _buildTheme({
    required Brightness brightness,
    required Color primary,
    required Color secondary,
    required Color background,
    required Color surface,
    required Color error,
    required Color onSurface,
    required Color onBackground,
    required Color fieldColor,
    required Color borderColor,
  }) {
    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primary,
        brightness: brightness,
        primary: primary,
        secondary: secondary,
        surface: surface,
        background: background,
        error: error,
      ),
      textTheme: GoogleFonts.interTextTheme().apply(
        bodyColor: onSurface,
        displayColor: onSurface,
      ).copyWith(
        bodySmall: GoogleFonts.inter(color: onBackground, fontSize: 12),
        bodyMedium: GoogleFonts.inter(color: onSurface, fontSize: 14),
        titleMedium: GoogleFonts.inter(color: onSurface, fontWeight: FontWeight.w600),
      ),
      dividerColor: borderColor,
      scaffoldBackgroundColor: background,
      appBarTheme: AppBarTheme(
        backgroundColor: surface,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.inter(
          color: onSurface,
          fontSize: 20,
          fontWeight: FontWeight.w800,
        ),
        iconTheme: IconThemeData(color: onSurface),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: BorderSide(color: borderColor, width: brightness == Brightness.dark ? 1 : 0.5),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 56),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
          elevation: 2,
          shadowColor: primary.withOpacity(0.3),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: fieldColor,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: borderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
        hintStyle: GoogleFonts.inter(
          color: onBackground,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
