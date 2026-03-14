import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

class QuickActionCard extends StatelessWidget {
  final String title;
  final String desc;
  final IconData icon;
  final List<Color> gradient;
  final VoidCallback onTap;

  const QuickActionCard({
    super.key,
    required this.title,
    required this.desc,
    required this.icon,
    required this.gradient,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.05)),
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).brightness == Brightness.dark 
                ? Colors.black.withOpacity(0.4) 
                : const Color(0xFF1E293B).withOpacity(0.06),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(24),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: gradient[0].withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Icon(icon, color: gradient[0], size: 28),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        desc,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 13,
                          color: Theme.of(context).textTheme.bodySmall?.color,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Theme.of(context).brightness == Brightness.dark 
                        ? Colors.white.withOpacity(0.05) 
                        : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    LucideIcons.chevronRight, 
                    color: Theme.of(context).textTheme.bodySmall?.color?.withOpacity(0.5), 
                    size: 18
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
