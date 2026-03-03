import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:async';

class SplashScreen extends StatefulWidget {
  final Widget nextScreen;
  const SplashScreen({super.key, required this.nextScreen});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  bool _isFadingOut = false;
  final String _title = "ACM AGENCIES";

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    _controller.forward();

    // Reduced delay for a snappier feel
    Timer(const Duration(milliseconds: 1200), () {
      if (mounted) {
        setState(() => _isFadingOut = true);
        Timer(const Duration(milliseconds: 300), () {
          if (mounted) {
            Navigator.of(context).pushReplacement(
              PageRouteBuilder(
                pageBuilder: (context, animation, secondaryAnimation) => widget.nextScreen,
                transitionsBuilder: (context, animation, secondaryAnimation, child) {
                  return FadeTransition(opacity: animation, child: child);
                },
                transitionDuration: const Duration(milliseconds: 300),
              ),
            );
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF020617), // slate-950
      body: AnimatedOpacity(
        opacity: _isFadingOut ? 0.0 : 1.0,
        duration: const Duration(milliseconds: 300),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // ACM AGENCIES Animated Text
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Wrap(
                  alignment: WrapAlignment.center,
                  children: List.generate(_title.length, (index) {
                    return _AnimatedLetter(
                      char: _title[index],
                      delay: Duration(milliseconds: index * 50),
                      controller: _controller,
                    );
                  }),
                ),
              ),
              const SizedBox(height: 16),
              
              // Gradient Line
              AnimatedBuilder(
                animation: _controller,
                builder: (context, child) {
                  // Replicate logic: starts at 40%, expands to 100% when fading
                  double widthFactor = _isFadingOut ? 1.0 : (0.4 + (0.6 * _controller.value));
                  return Container(
                    height: 4,
                    width: MediaQuery.of(context).size.width * 0.8 * widthFactor,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(2),
                      gradient: const LinearGradient(
                        colors: [Color(0xFF2563EB), Color(0xFF22D3EE)], // blue-600 to cyan-400
                      ),
                    ),
                  );
                },
              ),
              
              const SizedBox(height: 24),
              
              // Distributor Management Subtitle
              AnimatedBuilder(
                animation: _controller,
                builder: (context, child) {
                  return Opacity(
                    opacity: _controller.value,
                    child: Transform.translate(
                      offset: Offset(0, 10 * (1 - _controller.value)),
                      child: Text(
                        "DISTRIBUTOR MANAGEMENT",
                        style: GoogleFonts.inter(
                          color: const Color(0xFF94A3B8), // slate-400
                          fontSize: 12,
                          fontWeight: FontWeight.w300,
                          letterSpacing: 4,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AnimatedLetter extends StatelessWidget {
  final String char;
  final Duration delay;
  final AnimationController controller;

  const _AnimatedLetter({
    required this.char,
    required this.delay,
    required this.controller,
  });

  @override
  Widget build(BuildContext context) {
    // Reveal-letter animation: 0.5s duration, custom curve
    final Animation<double> animation = CurvedAnimation(
      parent: controller,
      curve: Interval(
        delay.inMilliseconds / 1000,
        (delay.inMilliseconds + 400) / 1000,
        curve: Curves.easeOutCubic,
      ),
    );

    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        return Opacity(
          opacity: animation.value,
          child: Transform.translate(
            offset: Offset(0, 20 * (1 - animation.value)),
            child: Transform.scale(
              scale: 0.8 + (0.2 * animation.value),
              child: Text(
                char == " " ? "\u00A0" : char,
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
