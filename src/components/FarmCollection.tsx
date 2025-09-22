import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Upload, MapPin, Leaf, Image, Hash, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface CollectionFormData {
  name: string;
  description: string;
  imageUrl: string;
  region: string;
  farmType: string;
  totalSupply: number;
}

const farmTypes = [
  { value: "poultry", label: "farm.type.poultry", icon: "🐔" },
  { value: "cattle", label: "farm.type.cattle", icon: "🐄" },
  { value: "agriculture", label: "farm.type.agriculture", icon: "🌾" },
  { value: "aquaculture", label: "farm.type.aquaculture", icon: "🐟" },
  { value: "mixed", label: "farm.type.mixed", icon: "🌿" },
];

const regions = [
  { value: "north", label: "farm.region.north" },
  { value: "northeast", label: "farm.region.northeast" },
  { value: "centerwest", label: "farm.region.centerwest" },
  { value: "southeast", label: "farm.region.southeast" },
  { value: "south", label: "farm.region.south" }
];

export const FarmCollection = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<CollectionFormData>({
    name: "",
    description: "",
    imageUrl: "",
    region: "",
    farmType: "",
    totalSupply: 1000
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const validateForm = () => {
    const valid = formData.name.length > 0 && 
                  formData.description.length > 0 && 
                  formData.imageUrl.length > 0 && 
                  formData.region.length > 0 && 
                  formData.farmType.length > 0;
    setIsValid(valid);
  };

  const handleInputChange = (field: keyof CollectionFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTimeout(validateForm, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    
    // Simular criação da coleção
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success(t('farm.collection.success.title'), {
      description: t('farm.collection.success.description')
    });
    
    setIsSubmitting(false);
    
    // Reset form
    setFormData({
      name: "",
      description: "",
      imageUrl: "",
      region: "",
      farmType: "",
      totalSupply: 1000
    });
    setIsValid(false);
  };

  const selectedFarmType = farmTypes.find(type => type.value === formData.farmType);

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
          <h2 className="text-3xl font-bold">{t('farm.collection.title')}</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {t('farm.collection.subtitle')}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form */}
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t('farm.collection.info.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome da Coleção */}
              <div className="space-y-2">
                <Label htmlFor="name">{t('farm.collection.name.label')}</Label>
                <Input
                  id="name"
                  placeholder={t('farm.collection.name.placeholder')}
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="bg-background/50"
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="description">{t('farm.collection.description.label')}</Label>
                <Textarea
                  id="description"
                  placeholder={t('farm.collection.description.placeholder')}
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="bg-background/50 min-h-[100px]"
                />
              </div>

              {/* Link das Imagens */}
              <div className="space-y-2">
                <Label htmlFor="imageUrl">{t('farm.collection.image.label')}</Label>
                <Input
                  id="imageUrl"
                  placeholder={t('farm.collection.image.placeholder')}
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                  className="bg-background/50"
                />
                <p className="text-xs text-muted-foreground">
                  {t('farm.collection.image.help')}
                </p>
              </div>

              {/* Região */}
              <div className="space-y-2">
                <Label htmlFor="region">{t('farm.collection.region.label')}</Label>
                <Select value={formData.region} onValueChange={(value) => handleInputChange("region", value)}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder={t('farm.collection.region.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {t(region.label)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de Farm */}
              <div className="space-y-2">
                <Label htmlFor="farmType">{t('farm.collection.type.label')}</Label>
                <Select value={formData.farmType} onValueChange={(value) => handleInputChange("farmType", value)}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder={t('farm.collection.type.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {farmTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          {t(type.label)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Total Supply */}
              <div className="space-y-2">
                <Label htmlFor="totalSupply">{t('farm.collection.supply.label')}</Label>
                <Input
                  id="totalSupply"
                  type="number"
                  min="1"
                  max="10000"
                  value={formData.totalSupply}
                  onChange={(e) => handleInputChange("totalSupply", parseInt(e.target.value) || 0)}
                  className="bg-background/50"
                />
                <p className="text-xs text-muted-foreground">
                  {t('farm.collection.supply.help')}
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t('farm.collection.submitting')}
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    {t('farm.collection.submit')}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              {t('farm.collection.preview.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Collection Preview */}
              <div className="bg-background/50 rounded-lg p-6 space-y-4">
                <div className="text-center space-y-3">
                  <div className="w-20 h-20 bg-muted rounded-full mx-auto flex items-center justify-center">
                    {formData.imageUrl ? (
                      <img 
                        src={formData.imageUrl} 
                        alt="Collection preview" 
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling!.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full rounded-full flex items-center justify-center ${formData.imageUrl ? 'hidden' : 'flex'}`}>
                      <Image className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-lg">
                      {formData.name || t('farm.collection.preview.name')}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {formData.description || t('farm.collection.preview.description')}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {formData.region && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {t(`farm.region.${formData.region}`)}
                    </Badge>
                  )}
                  {selectedFarmType && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Leaf className="h-3 w-3" />
                      {t(selectedFarmType.label)}
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    {formData.totalSupply} RWAnimals
                  </Badge>
                </div>
              </div>

              {/* Info */}
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{t('farm.collection.preview.steps.title')}</strong> {t('farm.collection.preview.steps.description')}
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
