import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, QrCode, Key } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Import speakeasy and qrcode only when needed to avoid SSR issues
let speakeasy: any;
let QRCode: any;

const loadDependencies = async () => {
  if (typeof window !== 'undefined') {
    speakeasy = await import('speakeasy');
    QRCode = await import('qrcode');
  }
};

export default function TwoFactorSetup() {
  const { adminProfile, updateAdminProfile } = useAdminAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [step, setStep] = useState<'setup' | 'verify'>('setup');

  useEffect(() => {
    // Only auto-generate if we have a valid admin profile and 2FA is not enabled
    if (step === 'setup' && adminProfile && !adminProfile.two_factor_enabled) {
      generateSecret();
    }
  }, [step, adminProfile]);

  const generateSecret = async () => {
    if (!adminProfile) {
      toast({
        title: "Error",
        description: "Admin profile not loaded. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Load dependencies dynamically
      await loadDependencies();
      
      if (!speakeasy || !QRCode) {
        throw new Error('Failed to load 2FA libraries');
      }
      
      // Generate secret
      const newSecret = speakeasy.generateSecret({
        name: `Admin Portal (${adminProfile.user_id})`,
        issuer: 'Admin Portal',
        length: 32,
      });

      setSecret(newSecret.base32);

      // Generate QR code
      const qrUrl = await QRCode.toDataURL(newSecret.otpauth_url);
      setQrCodeUrl(qrUrl);
      
      setStep('verify');
    } catch (error) {
      console.error('Error generating 2FA secret:', error);
      toast({
        title: "Setup Error",
        description: "Failed to generate 2FA secret. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Verify the token
      const { data: verificationResult } = await supabase.functions.invoke('verify-2fa', {
        body: {
          secret,
          token: verificationCode
        }
      });

      if (!verificationResult?.valid) {
        toast({
          title: "Invalid Code",
          description: "The verification code is incorrect. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Save to database
      await updateAdminProfile({
        two_factor_enabled: true,
        two_factor_secret: secret
      });

      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been successfully enabled for your account.",
      });

      setStep('setup');
      setVerificationCode("");
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      toast({
        title: "Setup Error",
        description: "Failed to enable 2FA. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    setLoading(true);

    try {
      await updateAdminProfile({
        two_factor_enabled: false,
        two_factor_secret: null
      });

      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled for your account.",
      });
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast({
        title: "Error",
        description: "Failed to disable 2FA. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (adminProfile?.two_factor_enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            2FA is currently enabled for your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your account is protected with two-factor authentication.
            </AlertDescription>
          </Alert>
          
          <Button 
            variant="destructive" 
            onClick={disable2FA}
            disabled={loading}
          >
            {loading ? "Disabling..." : "Disable 2FA"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your admin account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'setup' ? (
          <>
            <Alert>
              <AlertDescription>
                Set up 2FA using an authenticator app like Google Authenticator, Authy, or 1Password.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={generateSecret} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Setting up..." : "Set Up 2FA"}
            </Button>
          </>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
                <QrCode className="h-5 w-5" />
                Scan QR Code
              </h3>
              {qrCodeUrl && (
                <img 
                  src={qrCodeUrl} 
                  alt="2FA QR Code" 
                  className="mx-auto border rounded-lg p-2 bg-white"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Manual Entry Key
              </Label>
              <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                {secret}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification">Verification Code</Label>
              <Input
                id="verification"
                type="text"
                placeholder="Enter 6-digit code from your app"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={verifyAndEnable2FA}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1"
              >
                {loading ? "Verifying..." : "Verify & Enable"}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setStep('setup');
                  setVerificationCode("");
                }}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}