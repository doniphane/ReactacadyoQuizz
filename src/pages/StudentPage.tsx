import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, LogOut, AlertCircle } from 'lucide-react';
import { QuizApiService } from '@/lib/quizApi';

// Interface pour les données du participant
interface ParticipantData {
  firstName: string;
  lastName: string;
  quizCode: string;
}

// Interface pour les erreurs de validation
interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  quizCode?: string;
}

// Interface pour les informations du quiz
interface QuizInfo {
  id: number;
  title: string;
  description?: string;
  accessCode: string;
  isActive: boolean;
}

// Utilitaires de validation et sécurité
const ValidationUtils = {
  // Nettoie une chaîne de caractères dangereux
  sanitizeInput: (input: string): string => {
    return input
      .trim()
      .replace(/[<>\"'&]/g, '') // Supprime les caractères dangereux pour XSS
      .replace(/\s+/g, ' '); // Normalise les espaces
  },

  // Valide un nom (prénom/nom)
  validateName: (name: string): string | null => {
    const sanitized = ValidationUtils.sanitizeInput(name);
    
    if (!sanitized) {
      return 'Ce champ est obligatoire';
    }
    
    if (sanitized.length < 2) {
      return 'Minimum 2 caractères requis';
    }
    
    if (sanitized.length > 50) {
      return 'Maximum 50 caractères autorisés';
    }
    
    // Regex stricte : lettres, espaces, tirets, apostrophes uniquement
    const nameRegex = /^[a-zA-ZÀ-ÿ\s\-'\.]+$/;
    if (!nameRegex.test(sanitized)) {
      return 'Seules les lettres, espaces, tirets et apostrophes sont autorisés';
    }
    
    // Vérifier qu'il n'y a pas que des espaces/caractères spéciaux
    if (!/[a-zA-ZÀ-ÿ]/.test(sanitized)) {
      return 'Le nom doit contenir au moins une lettre';
    }
    
    return null;
  },

  // Valide le code du quiz
  validateQuizCode: (code: string): string | null => {
    const sanitized = code.trim().toUpperCase();
    
    if (!sanitized) {
      return 'Le code du quiz est obligatoire';
    }
    
    if (sanitized.length !== 6) {
      return 'Le code doit contenir exactement 6 caractères';
    }
    
    // Regex stricte : lettres majuscules et chiffres uniquement
    const codeRegex = /^[A-Z0-9]{6}$/;
    if (!codeRegex.test(sanitized)) {
      return 'Le code ne peut contenir que des lettres majuscules et des chiffres';
    }
    
    return null;
  },

  // Échappe les caractères HTML pour éviter XSS
  escapeHtml: (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Composant principal de la page de participation au quiz
const StudentPage: React.FC = () => {
  // Hook pour la navigation avec React Router
  const navigate = useNavigate();
  
  // Hook pour accéder au store d'authentification
  const { logout } = useAuthStore();
  
  // État pour les données du participant
  const [participantData, setParticipantData] = useState<ParticipantData>({
    firstName: '',
    lastName: '',
    quizCode: ''
  });

  // État pour les erreurs de validation
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // État pour stocker les informations du quiz
  const [quizInfo, setQuizInfo] = useState<QuizInfo | null>(null);

  // État pour indiquer si on cherche le quiz
  const [isLoading, setIsLoading] = useState(false);

  // État pour l'erreur générale
  const [generalError, setGeneralError] = useState<string>('');

  // Fonction pour valider un champ spécifique
  const validateField = (field: keyof ParticipantData, value: string): string | null => {
    switch (field) {
      case 'firstName':
        return ValidationUtils.validateName(value);
      case 'lastName':
        return ValidationUtils.validateName(value);
      case 'quizCode':
        return ValidationUtils.validateQuizCode(value);
      default:
        return null;
    }
  };

  // Fonction pour gérer les changements dans les champs avec validation en temps réel
  const handleInputChange = (field: keyof ParticipantData, value: string) => {
    // Limiter la longueur maximale par sécurité
    const maxLengths = {
      firstName: 50,
      lastName: 50,
      quizCode: 6
    };
    
    if (value.length > maxLengths[field]) {
      return; // Ignore les caractères supplémentaires
    }

    // Sanitiser l'entrée
    let sanitizedValue = value;
    if (field === 'quizCode') {
      sanitizedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    } else {
      // Pour les noms, permettre seulement les caractères autorisés
      sanitizedValue = value.replace(/[^a-zA-ZÀ-ÿ\s\-'\.]/g, '');
    }

    // Mettre à jour les données
    setParticipantData(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));

    // Valider le champ et mettre à jour les erreurs
    const error = validateField(field, sanitizedValue);
    setValidationErrors(prev => ({
      ...prev,
      [field]: error || undefined
    }));

    // Effacer l'erreur générale si l'utilisateur modifie les champs
    if (generalError) {
      setGeneralError('');
    }
  };

  // Fonction pour valider tout le formulaire
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Valider chaque champ
    Object.keys(participantData).forEach(key => {
      const field = key as keyof ParticipantData;
      const error = validateField(field, participantData[field]);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  // Fonction pour gérer la déconnexion
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fonction pour gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    
    // Validation complète du formulaire
    if (!validateForm()) {
      setGeneralError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setIsLoading(true);
    
    try {
      // Sanitiser les données avant l'envoi
      const sanitizedData = {
        firstName: ValidationUtils.sanitizeInput(participantData.firstName),
        lastName: ValidationUtils.sanitizeInput(participantData.lastName),
        quizCode: participantData.quizCode.trim().toUpperCase()
      };

      // Appeler l'API pour vérifier le code du quiz
      const quizData = await QuizApiService.findQuizByCode(sanitizedData.quizCode);
      
      // Vérifier que le quiz est actif
      if (!quizData.isActive) {
        setGeneralError('Ce quiz n\'est pas actif pour le moment');
        return;
      }
      
      // Stocker les informations du quiz
      setQuizInfo(quizData);
      
      // Navigation vers la page du quiz avec les données sanitisées
      navigate('/take-quiz', { 
        state: { 
          participantData: sanitizedData,
          quizInfo: quizData
        } 
      });
      
    } catch (error: unknown) {
      // Gérer les erreurs de l'API de manière sécurisée
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        setGeneralError('Code de quiz invalide ou quiz non trouvé');
      } else if (error && typeof error === 'object' && 'status' in error && error.status === 403) {
        setGeneralError('Accès refusé à ce quiz');
      } else if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
        setGeneralError('Trop de tentatives. Veuillez patienter quelques minutes');
      } else {
        setGeneralError('Erreur lors de la vérification du code. Veuillez réessayer');
        console.error('Quiz verification error:', error); // Log pour debug, pas pour l'utilisateur
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Composant pour afficher les erreurs
  const ErrorMessage: React.FC<{ error?: string }> = ({ error }) => {
    if (!error) return null;
    
    return (
      <div className="flex items-center mt-1 text-red-600 text-sm">
        <AlertCircle className="w-4 h-4 mr-1" />
        <span>{ValidationUtils.escapeHtml(error)}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8">
        {/* Titre et sous-titre */}
        <div>
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">
            Participer au Quiz
          </h1>
          <p className="text-gray-300 text-lg">
            Entrez vos informations et le code du quiz
          </p>
        </div>

        {/* Bouton de déconnexion */}
        <Button 
          onClick={handleLogout}
          variant="outline"
          className="border-gray-600 text-white hover:bg-gray-800"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Déconnexion
        </Button>
      </div>

      {/* Section principale */}
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gray-100 text-gray-900">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold">
              {quizInfo ? ValidationUtils.escapeHtml(quizInfo.title) : 'Participer au Quiz'}
            </CardTitle>
            {quizInfo?.description && (
              <p className="text-gray-600 mt-2">
                {ValidationUtils.escapeHtml(quizInfo.description)}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {/* Erreur générale */}
            {generalError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span>{ValidationUtils.escapeHtml(generalError)}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Champ Prénom */}
              <div className="mb-4">
                <Label htmlFor="first_name" className="text-sm font-medium">
                  Votre prénom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={participantData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`mt-1 ${validationErrors.firstName ? 'border-red-500' : ''}`}
                  placeholder="Prénom"
                  maxLength={50}
                  autoComplete="given-name"
                  aria-describedby={validationErrors.firstName ? "first_name_error" : undefined}
                />
                <ErrorMessage error={validationErrors.firstName} />
              </div>

              {/* Champ Nom */}
              <div className="mb-4">
                <Label htmlFor="last_name" className="text-sm font-medium">
                  Votre nom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={participantData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`mt-1 ${validationErrors.lastName ? 'border-red-500' : ''}`}
                  placeholder="Nom de famille"
                  maxLength={50}
                  autoComplete="family-name"
                  aria-describedby={validationErrors.lastName ? "last_name_error" : undefined}
                />
                <ErrorMessage error={validationErrors.lastName} />
              </div>

              {/* Champ Code du Quiz */}
              <div className="mb-6">
                <Label htmlFor="quiz_code" className="text-sm font-medium">
                  Code du Quiz <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quiz_code"
                  name="quiz_code"
                  type="text"
                  value={participantData.quizCode}
                  onChange={(e) => handleInputChange('quizCode', e.target.value)}
                  placeholder="ABC123"
                  className={`mt-1 uppercase ${validationErrors.quizCode ? 'border-red-500' : ''}`}
                  maxLength={6}
                  style={{ textTransform: 'uppercase' }}
                  autoComplete="off"
                  aria-describedby={validationErrors.quizCode ? "quiz_code_error" : undefined}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Code à 6 caractères fourni par votre professeur
                </div>
                <ErrorMessage error={validationErrors.quizCode} />
              </div>

              {/* Bouton Commencer le Quiz */}
              <div className="d-grid">
                <Button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-lg disabled:opacity-50"
                  disabled={isLoading || Object.keys(validationErrors).some(key => validationErrors[key as keyof ValidationErrors])}
                >
                  {isLoading ? 'Vérification...' : 'Commencer le Quiz'}
                </Button>
              </div>
            </form>

            {/* Séparateur */}
            <hr className="my-6" />

            {/* Bouton Retour à l'accueil */}
            <div className="text-center">
              <Button 
                onClick={() => navigate('/admin-dashboard')}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentPage;