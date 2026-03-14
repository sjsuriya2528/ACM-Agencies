import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../services/api_service.dart';
import '../models/user.dart';
import '../theme/app_theme.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

enum ProfileStep { info, sendOtp, verifyOtp, newPassword }

class _ProfileScreenState extends State<ProfileScreen> {
  final ApiService _apiService = ApiService();
  ProfileStep _currentStep = ProfileStep.info;
  bool _isLoading = false;
  String? _error;
  String? _message;

  final List<TextEditingController> _otpControllers = List.generate(6, (index) => TextEditingController());
  final List<FocusNode> _otpNodes = List.generate(6, (index) => FocusNode());
  
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  Future<void> _sendOtp() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      await _apiService.post('/auth/send-password-otp');
      setState(() {
        _message = 'OTP sent to your email';
        _currentStep = ProfileStep.verifyOtp;
      });
    } catch (e) {
      setState(() => _error = 'Failed to send OTP');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _verifyOtp() async {
    final otpCode = _otpControllers.map((c) => c.text).join();
    if (otpCode.length < 6) {
      setState(() => _error = 'Please enter 6-digit OTP');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      await _apiService.post('/auth/verify-password-otp', data: {'otpCode': otpCode});
      setState(() {
        _currentStep = ProfileStep.newPassword;
      });
    } catch (e) {
      setState(() => _error = 'Invalid OTP');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _updatePassword() async {
    if (_newPasswordController.text != _confirmPasswordController.text) {
      setState(() => _error = 'Passwords do not match');
      return;
    }
    if (_newPasswordController.text.length < 6) {
      setState(() => _error = 'Password must be at least 6 characters');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      await _apiService.post('/auth/update-password', data: {
        'newPassword': _newPasswordController.text,
      });
      setState(() {
        _message = 'Password updated successfully!';
        _currentStep = ProfileStep.info;
        _newPasswordController.clear();
        _confirmPasswordController.clear();
      });
    } catch (e) {
      setState(() => _error = 'Failed to update password');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    for (var controller in _otpControllers) {
      controller.dispose();
    }
    for (var node in _otpNodes) {
      node.dispose();
    }
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('My Profile'),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // User Profile Card
            _buildProfileCard(user),
            const SizedBox(height: 24),

            // Theme Setting Card
            _buildThemeCard(context),
            const SizedBox(height: 24),
            
            // Security Section Card
            _buildSecurityCard(),
          ],
        ),
      ),
    );
  }

  Widget _buildThemeCard(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    final isDark = themeProvider.isDarkMode;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.1)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(
              isDark ? LucideIcons.moon : LucideIcons.sun,
              size: 20,
              color: isDark ? const Color(0xFF3B82F6) : const Color(0xFFF59E0B),
            ),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Dark Mode', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                SizedBox(height: 4),
                Text('Adjust app appearance', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
              ],
            ),
          ),
          Switch.adaptive(
            value: isDark,
            activeColor: AppTheme.primaryColor,
            onChanged: (value) => themeProvider.toggleTheme(),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileCard(user) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.05)),
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).brightness == Brightness.dark 
                ? Colors.black.withOpacity(0.2) 
                : const Color(0xFF1E293B).withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: Theme.of(context).primaryColor.withOpacity(0.1),
              shape: BoxShape.circle,
              border: Border.all(color: Theme.of(context).primaryColor.withOpacity(0.2), width: 4),
            ),
            child: const Icon(LucideIcons.user, size: 40, color: AppTheme.primaryColor),
          ),
          const SizedBox(height: 20),
          Text(
            user?.name ?? 'Loading...',
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900),
          ),
          Text(
            user?.role?.toUpperCase() ?? '',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: Theme.of(context).primaryColor,
              letterSpacing: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSecurityCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(LucideIcons.lock, size: 20, color: Theme.of(context).textTheme.bodySmall?.color),
              const SizedBox(width: 12),
              const Text('Security Settings', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
            ],
          ),
          const SizedBox(height: 24),
          if (_message != null) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: const Color(0xFFF0FDF4), borderRadius: BorderRadius.circular(16)),
              child: Row(
                children: [
                  const Icon(LucideIcons.checkCircle, size: 18, color: Color(0xFF16A34A)),
                  const SizedBox(width: 12),
                  Expanded(child: Text(_message!, style: const TextStyle(color: Color(0xFF15803D), fontSize: 13, fontWeight: FontWeight.w600))),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
          if (_error != null) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: const Color(0xFFFEF2F2), borderRadius: BorderRadius.circular(16)),
              child: Row(
                children: [
                  const Icon(LucideIcons.alertCircle, size: 18, color: Color(0xFFDC2626)),
                  const SizedBox(width: 12),
                  Expanded(child: Text(_error!, style: const TextStyle(color: Color(0xFFB91C1C), fontSize: 13, fontWeight: FontWeight.w600))),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
          _buildStepContent(),
        ],
      ),
    );
  }

  Widget _buildStepContent() {
    switch (_currentStep) {
      case ProfileStep.info:
        return _buildInfoStep();
      case ProfileStep.sendOtp:
        return _buildSendOtpStep();
      case ProfileStep.verifyOtp:
        return _buildVerifyOtpStep();
      case ProfileStep.newPassword:
        return _buildNewPasswordStep();
    }
  }

  Widget _buildInfoStep() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Change Password', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                const SizedBox(height: 4),
                Text('Keep your account secure', style: TextStyle(fontSize: 12, color: Theme.of(context).textTheme.bodySmall?.color)),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () => setState(() => _currentStep = ProfileStep.sendOtp),
            style: ElevatedButton.styleFrom(
              minimumSize: const Size(100, 48),
              backgroundColor: Theme.of(context).brightness == Brightness.dark ? Colors.white : const Color(0xFF1E293B),
              foregroundColor: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Colors.white,
            ),
            child: const Text('Update', style: TextStyle(fontSize: 14)),
          ),
        ],
      ),
    );
  }

  Widget _buildSendOtpStep() {
    return Column(
      children: [
        const Icon(LucideIcons.shieldCheck, size: 48, color: Color(0xFFF59E0B)),
        const SizedBox(height: 16),
        const Text('Verification Required', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        const SizedBox(height: 8),
        const Text('We will send an OTP to your email for security.', textAlign: TextAlign.center, style: TextStyle(fontSize: 13)),
        const SizedBox(height: 24),
        ElevatedButton(
          onPressed: _isLoading ? null : _sendOtp,
          child: _isLoading ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2) : const Text('Send OTP via Email'),
        ),
        TextButton(
          onPressed: () => setState(() => _currentStep = ProfileStep.info),
          child: const Text('Cancel', style: TextStyle(color: Color(0xFF64748B))),
        ),
      ],
    );
  }

  Widget _buildVerifyOtpStep() {
    return Column(
      children: [
        const Text('Enter OTP', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        const SizedBox(height: 8),
        const Text('Enter the 6-digit code sent to your email', style: TextStyle(color: Color(0xFF64748B), fontSize: 13)),
        const SizedBox(height: 24),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(6, (index) {
            return SizedBox(
              width: 45,
              child: TextField(
                controller: _otpControllers[index],
                focusNode: _otpNodes[index],
                keyboardType: TextInputType.number,
                textAlign: TextAlign.center,
                maxLength: 1,
                onChanged: (value) {
                  if (value.isNotEmpty && index < 5) {
                    _otpNodes[index + 1].requestFocus();
                  } else if (value.isEmpty && index > 0) {
                    _otpNodes[index - 1].requestFocus();
                  }
                },
                decoration: InputDecoration(
                  counterText: "",
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                  fillColor: const Color(0xFFF8FAFC),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 24),
        ElevatedButton(
          onPressed: _isLoading ? null : _verifyOtp,
          child: _isLoading ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2) : const Text('Verify and Continue'),
        ),
        TextButton(
          onPressed: _sendOtp,
          child: const Text('Resend OTP', style: TextStyle(color: AppTheme.primaryColor)),
        ),
      ],
    );
  }

  Widget _buildNewPasswordStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('New Password', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Theme.of(context).textTheme.bodySmall?.color)),
        const SizedBox(height: 8),
        TextField(
          controller: _newPasswordController,
          obscureText: true,
          decoration: const InputDecoration(hintText: 'Enter new password', prefixIcon: Icon(LucideIcons.key, size: 18)),
        ),
        const SizedBox(height: 16),
        Text('Confirm Password', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Theme.of(context).textTheme.bodySmall?.color)),
        const SizedBox(height: 8),
        TextField(
          controller: _confirmPasswordController,
          obscureText: true,
          decoration: const InputDecoration(hintText: 'Repeat password', prefixIcon: Icon(LucideIcons.key, size: 18)),
        ),
        const SizedBox(height: 24),
        ElevatedButton(
          onPressed: _isLoading ? null : _updatePassword,
          child: _isLoading ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2) : const Text('Update Password'),
        ),
      ],
    );
  }
}
