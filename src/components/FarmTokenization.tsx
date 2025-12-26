import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MessageCircle, 
  Building2, 
  Zap, 
  Shield, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Clock
} from "lucide-react";

const benefits = [
  {
    icon: <Building2 className="h-6 w-6" />,
    title: "Tokenização de RWAnimals",
    description: "Transforme seus animais reais em NFTs únicos, seguindo o sucesso das Pudgy Chickens"
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Processo Rápido",
    description: "Tokenização em poucos dias com suporte técnico especializado"
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Protocolo Seguro",
    description: "Blockchain seguro com certificação de autenticidade dos RWAnimals"
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Suporte Especializado",
    description: "Equipe técnica dedicada para acompanhar todo o processo"
  }
];

const contactMethods = [
  {
    icon: <Phone className="h-5 w-5" />,
    method: "WhatsApp",
    value: "+55 (27) 99904-6066",
    action: "https://wa.me/5527999046066"
  },
  {
    icon: <Mail className="h-5 w-5" />,
    method: "Email",
    value: "afonsodalvia@gmail.com",
    action: "mailto:afonsodalvia@gmail.com"
  },
  {
    icon: <MessageCircle className="h-5 w-5" />,
    method: "Chat Online",
    value: "Disponível 24/7",
    action: "#"
  }
];

export const FarmTokenization = () => {
  const handleContact = (method: string, action: string) => {
    if (method === "WhatsApp") {
      window.open(action, '_blank');
    } else if (method === "Email") {
      window.location.href = action;
    } else {
      // Chat online - implementar modal ou redirecionar
      alert("Chat online será implementado em breve!");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full p-3 flex items-center justify-center">
            <img 
              src="/farm-logo.svg" 
              alt="Farm Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold">Consultoria RWAnimals</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Tem algum galinheiro ou RWAnimals para tokenizar? Nossa equipe especializada pode te ajudar 
          a transformar seus animais reais em NFTs valiosos, seguindo o sucesso das <strong>Pudgy Chickens</strong>!
        </p>
      </div>

      {/* Main CTA Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/10 border-primary/20">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <div className="text-6xl">🐔</div>
              <h3 className="text-2xl font-bold">
                Tem algum galinheiro ou RWAnimals para tokenizar?
              </h3>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Podemos te ajudar a transformar seus animais reais em coleções NFT únicas e valiosas, 
                seguindo o modelo de sucesso das <strong>Pudgy Chickens</strong>. Nossa equipe especializada 
                está pronta para te acompanhar em todo o processo de tokenização.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {contactMethods.map((contact) => (
                <Button
                  key={contact.method}
                  onClick={() => handleContact(contact.method, contact.action)}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                >
                  {contact.icon}
                  <div className="text-left">
                    <div className="font-medium">{contact.method}</div>
                    <div className="text-xs text-muted-foreground">{contact.value}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ))}
            </div>

            <div className="pt-4">
              <Button
                size="lg"
                className="bg-gradient-hero text-primary-foreground hover:opacity-90 px-8 py-4 text-lg"
                onClick={() => handleContact("WhatsApp", "https://wa.me/5527999046066")}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Entre em Contato Agora
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {benefits.map((benefit, index) => (
          <Card key={index} className="bg-gradient-card hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                  {benefit.icon}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2">{benefit.title}</h4>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Process Steps */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="text-center">Como Funciona o Processo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <div>
                <h4 className="font-bold mb-2">Contato Inicial</h4>
                <p className="text-sm text-muted-foreground">
                  Entre em contato conosco e conte sobre seus RWAnimals
                </p>
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              <div>
                <h4 className="font-bold mb-2">Avaliação dos RWAnimals</h4>
                <p className="text-sm text-muted-foreground">
                  Nossa equipe avalia seus animais e planeja a melhor estratégia de tokenização
                </p>
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <div>
                <h4 className="font-bold mb-2">Tokenização dos RWAnimals</h4>
                <p className="text-sm text-muted-foreground">
                  Seus animais são transformados em NFTs únicos na blockchain, como as Pudgy Chickens
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Gratuito para consulta:</strong> A primeira consulta é sempre gratuita. 
            Entendemos suas necessidades antes de qualquer compromisso.
          </AlertDescription>
        </Alert>

        <Alert className="bg-blue-50 border-blue-200">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Resposta rápida:</strong> Nossa equipe responde em até 24 horas 
            durante dias úteis.
          </AlertDescription>
        </Alert>
      </div>

      {/* Contact Info */}
      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h4 className="font-bold text-lg">Informações de Contato</h4>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Espírito Santo, Brasil
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Seg-Sex: 9h às 18h
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                afonsodalvia@gmail.com
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
