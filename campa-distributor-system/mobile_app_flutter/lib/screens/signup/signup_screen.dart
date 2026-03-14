import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../providers/auth_provider.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String _selectedRole = 'sales_rep';
  bool _isLoading = false;
  bool _obscurePassword = true;

  final Map<String, String> _roles = {
    'sales_rep': 'Sales Representative',
    'driver': 'Driver',
    'collection_agent': 'Collection Agent',
  };

  Future<void> _handleSignup() async {
    if (_nameController.text.isEmpty || _emailController.text.isEmpty || _passwordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all fields'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final result = await authProvider.register(
        _nameController.text,
        _emailController.text,
        _passwordController.text,
        _selectedRole,
      );

      if (result['success']) {
        if (mounted) Navigator.of(context).pop(); // Back to main wrapper -> Dashboard
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result['message'] ?? 'Signup failed'), backgroundColor: Colors.red),
          );
        }
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Stack(
        children: [
          // Background Decoration (Blurred Circles)
          Positioned(
            top: -100,
            right: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withOpacity(0.2), // emerald-600/20
                shape: BoxShape.circle,
              ),
              child: BackdropFilter(filter: ImageFilter.blur(sigmaX: 100, sigmaY: 100), child: Container(color: Colors.transparent)),
            ),
          ),
          Positioned(
            bottom: -50,
            left: -50,
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                color: const Color(0xFF2563EB).withOpacity(0.2), // blue-600/20
                shape: BoxShape.circle,
              ),
              child: BackdropFilter(filter: ImageFilter.blur(sigmaX: 80, sigmaY: 80), child: Container(color: Colors.transparent)),
            ),
          ),

          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(32),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                    child: Container(
                      padding: const EdgeInsets.all(32),
                      decoration: BoxDecoration(
                        color: Theme.of(context).cardTheme.color?.withOpacity(0.8),
                        borderRadius: BorderRadius.circular(32),
                        border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.1)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text(
                            'Create Account',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Join the team today',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 14),
                          ),
                          const SizedBox(height: 32),
                          
                          _buildFieldLabel('Full Name'),
                          _buildTextField(_nameController, LucideIcons.user, 'John Doe'),
                          const SizedBox(height: 16),

                          _buildFieldLabel('Email Address'),
                          _buildTextField(_emailController, LucideIcons.mail, 'you@example.com'),
                          const SizedBox(height: 16),

                          _buildFieldLabel('Role'),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            decoration: BoxDecoration(
                              color: Theme.of(context).scaffoldBackgroundColor,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.1)),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: _selectedRole,
                                dropdownColor: Theme.of(context).cardTheme.color,
                                icon: Icon(LucideIcons.chevronDown, color: Theme.of(context).textTheme.bodyMedium?.color, size: 16),
                                isExpanded: true,
                                style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color, fontWeight: FontWeight.w600),
                                items: _roles.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value))).toList(),
                                onChanged: (val) => setState(() => _selectedRole = val!),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),

                          _buildFieldLabel('Password'),
                          _buildTextField(
                            _passwordController, 
                            LucideIcons.lock, 
                            '••••••••', 
                            isPassword: true, 
                            obscure: _obscurePassword,
                            toggleObscure: () => setState(() => _obscurePassword = !_obscurePassword),
                          ),
                          const SizedBox(height: 32),

                          _isLoading
                            ? const Center(child: CircularProgressIndicator(color: Color(0xFF2563EB)))
                            : ElevatedButton(
                                onPressed: _handleSignup,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF2563EB),
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 20),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                  elevation: 0,
                                ),
                                child: const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text('Create Account', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
                                    SizedBox(width: 8),
                                    Icon(LucideIcons.arrowRight, size: 18),
                                  ],
                                ),
                              ),
                          const SizedBox(height: 24),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Text("Already have an account? ", style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13)),
                              GestureDetector(
                                onTap: () => Navigator.pop(context),
                                child: const Text("Sign In", style: TextStyle(color: Color(0xFF3B82F6), fontWeight: FontWeight.w900, fontSize: 13)),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFieldLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(label, style: TextStyle(color: Theme.of(context).textTheme.bodySmall?.color, fontSize: 13, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildTextField(TextEditingController controller, IconData icon, String hint, {bool isPassword = false, bool obscure = false, VoidCallback? toggleObscure}) {
    return TextField(
      controller: controller,
      obscureText: obscure,
      style: const TextStyle(fontWeight: FontWeight.w600),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: Theme.of(context).hintColor),
        prefixIcon: Icon(icon, color: Theme.of(context).hintColor, size: 20),
        suffixIcon: isPassword ? IconButton(icon: Icon(obscure ? LucideIcons.eye : LucideIcons.eyeOff, color: Theme.of(context).hintColor, size: 20), onPressed: toggleObscure) : null,
        filled: true,
        fillColor: Theme.of(context).scaffoldBackgroundColor,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Theme.of(context).colorScheme.primary, width: 1.5)),
      ),
    );
  }
}
