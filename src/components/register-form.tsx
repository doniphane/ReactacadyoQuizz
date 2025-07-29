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
  plainPassword: string;
  confirmPassword: string;
  firtName: string;
  lastName: string;
}

// Interface pour gérer les erreurs de validation côté client
interface FormErrors {
  email?: string;
  plainPassword?: string;
  confirmPassword?: string;
  firtName?: string;
  lastName?: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ 
  onSubmit, 
  isLoading = false, 
  className = "" 
}) => {
  // État pour stocker les valeurs du formulaire
  const [formData, setFormData] = useState<FormState>({
    email: '',
    plainPassword: '',
    confirmPassword: '',
    firtName: '',
    lastName: ''
  });

  // État pour stocker les erreurs de validation
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Fonction pour valider le formulaire côté client
   * Vérifie les champs requis et la correspondance des mots de passe
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
    if (!formData.plainPassword) {
      newErrors.plainPassword = "Le mot de passe est requis";
    } else if (formData.plainPassword.length < 6) {
      newErrors.plainPassword = "Le mot de passe doit faire au moins 6 caractères";
    }

    // Validation de la confirmation du mot de passe
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Veuillez confirmer votre mot de passe";
    } else if (formData.plainPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    // Validation du prénom
    if (!formData.firtName.trim()) {
      newErrors.firtName = "Le prénom est requis";
    } else if (formData.firtName.trim().length < 2) {
      newErrors.firtName = "Le prénom doit faire au moins 2 caractères";
    }

    // Validation du nom
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Le nom est requis";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Le nom doit faire au moins 2 caractères";
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

    // Préparation des données pour l'API (sans confirmPassword)
    const userData: UserCreateRequest = {
      email: formData.email.trim(),
      plainPassword: formData.plainPassword,
      firtName: formData.firtName.trim(),
      lastName: formData.lastName.trim(),
      roles: ['ROLE_USER'] // Rôle par défaut pour un nouvel utilisateur
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

          {/* Champ Prénom */}
          <div className="space-y-2">
            <Label htmlFor="firtName">Prénom</Label>
            <Input
              id="firtName"
              type="text"
              value={formData.firtName}
              onChange={(e) => handleInputChange('firtName', e.target.value)}
              placeholder="Votre prénom"
              disabled={isLoading}
              className={errors.firtName ? "border-red-500" : ""}
            />
            {errors.firtName && (
              <p className="text-sm text-red-500">{errors.firtName}</p>
            )}
          </div>

          {/* Champ Nom */}
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Votre nom"
              disabled={isLoading}
              className={errors.lastName ? "border-red-500" : ""}
            />
            {errors.lastName && (
              <p className="text-sm text-red-500">{errors.lastName}</p>
            )}
          </div>

          {/* Champ Mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="plainPassword">Mot de passe</Label>
            <Input
              id="plainPassword"
              type="password"
              value={formData.plainPassword}
              onChange={(e) => handleInputChange('plainPassword', e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className={errors.plainPassword ? "border-red-500" : ""}
            />
            {errors.plainPassword && (
              <p className="text-sm text-red-500">{errors.plainPassword}</p>
            )}
          </div>

          {/* Champ Confirmation mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className={errors.confirmPassword ? "border-red-500" : ""}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword}</p>
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