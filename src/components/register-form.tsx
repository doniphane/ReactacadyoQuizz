import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserCreateRequest } from "@/types/User";

// Interface pour définir les props du composant RegisterForm
interface RegisterFormProps {
  onSubmit: (userData: UserCreateRequest) => void;
  isLoading?: boolean;
  className?: string;
}

// Interface pour gérer l'état du formulaire
interface FormState {
  email: string;
  password: string;
}

// Interface pour gérer les erreurs de validation côté client
interface FormErrors {
  email?: string;
  password?: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ 
  onSubmit, 
  isLoading = false, 
  className = "" 
}) => {
  // État pour stocker les valeurs du formulaire
  const [formData, setFormData] = useState<FormState>({
    email: '',
    password: ''
  });

  // État pour stocker les erreurs de validation
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Fonction pour valider le formulaire côté client
   * Vérifie les champs requis
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validation de l'email
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "L'email n'est pas valide";
    }

    // Validation du mot de passe
    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 6) {
      newErrors.password = "Le mot de passe doit faire au moins 6 caractères";
    }

    setErrors(newErrors);

    // Retourne true si aucune erreur n'est trouvée
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Fonction pour gérer les changements dans les champs du formulaire
   */
  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Effacer l'erreur du champ quand l'utilisateur commence à taper
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  /**
   * Fonction pour gérer la soumission du formulaire
   */
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation du formulaire avant soumission
    if (!validateForm()) {
      return;
    }

    // Préparation des données pour l'API (seulement email et password)
    const userData: UserCreateRequest = {
      email: formData.email.trim(),
      password: formData.password
    };

    // Appel de la fonction de soumission passée en props
    onSubmit(userData);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Créer un compte</CardTitle>
        <CardDescription>
          Rejoignez Acadyo Quiz pour commencer à créer et participer à des quiz
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Champ Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="votre.email@exemple.com"
              disabled={isLoading}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Champ Mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className={errors.password ? "border-red-500" : ""}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          {/* Bouton de soumission */}
          <Button 
            type="submit" 
            className="w-full bg-amber-500 hover:bg-amber-600"
            disabled={isLoading}
          >
            {isLoading ? "Création en cours..." : "Créer mon compte"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export { RegisterForm }; 