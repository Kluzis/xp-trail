import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient text-white">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="flex items-center justify-center mb-6">
            <Icons.Zap className="h-12 w-12 mr-3" />
            <h1 className="text-5xl font-bold">XP Trail</h1>
          </div>
          <p className="text-xl mb-8 opacity-90">
            Gamifikovaná vzdělávací platforma pro interaktivní učení
          </p>
          <div className="space-x-4">
            <Button asChild size="lg" variant="secondary">
              <Link to="/register">Začít zdarma</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-primary">
              <Link to="/login">Přihlásit se</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Proč XP Trail?</h2>
            <p className="text-muted-foreground">Učte se zábavně s gamifikací</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Icons.Trophy className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">XP & Levely</h3>
              <p className="text-muted-foreground">Získávejte body a postupujte v levelech</p>
            </div>
            
            <div className="text-center">
              <Icons.Target className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Mapa dovedností</h3>
              <p className="text-muted-foreground">Hexagonální strom dovedností</p>
            </div>
            
            <div className="text-center">
              <Icons.Users className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Žebříček</h3>
              <p className="text-muted-foreground">Soutěžte s ostatními uživateli</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
