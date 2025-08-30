import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Icons } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

export const RegisterForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    fullName: '',
    age: '',
    acceptTerms: false,
    parentalConsent: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { signUp, signInWithGoogle, loading, error } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Chyba",
        description: "Hesla se neshodují",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Chyba",
        description: "Heslo musí mít alespoň 6 znaků",
        variant: "destructive",
      });
      return;
    }

    if (!formData.acceptTerms) {
      toast({
        title: "Chyba",
        description: "Musíte souhlasit s podmínkami použití",
        variant: "destructive",
      });
      return;
    }

    const age = parseInt(formData.age);
    if (age < 13 && !formData.parentalConsent) {
      toast({
        title: "Chyba",
        description: "Pro uživatele mladší 13 let je vyžadován souhlas rodičů",
        variant: "destructive",
      });
      return;
    }
    
    const result = await signUp(
      formData.email,
      formData.password,
      formData.username,
      formData.fullName,
      age
    );
    
    if (result.success) {
      toast({
        title: "Registrace úspěšná!",
        description: "Zkontrolujte svůj email pro potvrzení účtu.",
      });
      navigate('/app/dashboard');
    } else {
      toast({
        title: "Chyba registrace",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleGoogleSignUp = async () => {
    const result = await signInWithGoogle();
    
    if (result.success) {
      toast({
        title: "Registrace úspěšná",
        description: "Účet byl vytvořen přes Google.",
      });
    } else {
      toast({
        title: "Chyba registrace",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isUnder13 = parseInt(formData.age) < 13;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 p-4">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Registrace</CardTitle>
          <CardDescription className="text-center">
            Vytvořte si nový účet
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Celé jméno</Label>
                <Input
                  id="fullName"
                  placeholder="Jan Novák"
                  value={formData.fullName}
                  onChange={(e) => updateFormData('fullName', e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="age">Věk</Label>
                <Input
                  id="age"
                  type="number"
                  min="6"
                  max="100"
                  placeholder="18"
                  value={formData.age}
                  onChange={(e) => updateFormData('age', e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Uživatelské jméno</Label>
              <Input
                id="username"
                placeholder="uzivatel123"
                value={formData.username}
                onChange={(e) => updateFormData('username', e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vas@email.cz"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Heslo</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <Icons.EyeOff className="h-4 w-4" /> : <Icons.Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Potvrdit heslo</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? <Icons.EyeOff className="h-4 w-4" /> : <Icons.Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => updateFormData('acceptTerms', checked)}
                />
                <Label htmlFor="acceptTerms" className="text-sm">
                  Souhlasím s{' '}
                  <Link to="/privacy-policy" className="text-primary hover:underline">
                    podmínkami použití
                  </Link>
                </Label>
              </div>
              
              {isUnder13 && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="parentalConsent"
                    checked={formData.parentalConsent}
                    onCheckedChange={(checked) => updateFormData('parentalConsent', checked)}
                  />
                  <Label htmlFor="parentalConsent" className="text-sm">
                    Mám souhlas rodičů (vyžadováno pro uživatele mladší 13 let)
                  </Label>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" /> : null}
              Zaregistrovat se
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">nebo</span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignUp}
              disabled={loading}
            >
              <Icons.Google className="mr-2 h-4 w-4" />
              Registrovat se přes Google
            </Button>
            
            <p className="text-center text-sm text-muted-foreground">
              Již máte účet?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Přihlaste se
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};