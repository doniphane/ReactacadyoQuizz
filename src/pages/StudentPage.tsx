import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, LogOut } from 'lucide-react';

// Interface pour les données du participant
interface ParticipantData {
  firstName: string;
  lastName: string;
  quizCode: string;
}

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

  // État pour stocker les informations du quiz
  const [quizInfo, setQuizInfo] = useState<{
    title: string;
    description?: string;
  } | null>(null);

  // État pour indiquer si on cherche le quiz
  const [isLoading, setIsLoading] = useState(false);

  // Fonction pour gérer les changements dans les champs
  const handleInputChange = (field: keyof ParticipantData, value: string) => {
    setParticipantData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fonction pour gérer la déconnexion
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fonction pour gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des champs
    if (!participantData.firstName.trim() || !participantData.lastName.trim() || !participantData.quizCode.trim()) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: Appeler l'API pour vérifier le code du quiz
      // const response = await QuizApiService.findQuizByCode(participantData.quizCode);
      // setQuizInfo(response);
      
      // Pour l'instant, simulation
      setQuizInfo({
        title: 'Quiz de Test',
        description: 'Description du quiz'
      });
      
      // Navigation vers la page du quiz
      navigate('/take-quiz', { 
        state: { 
          participantData,
          quizInfo: {
            title: 'Quiz de Test',
            description: 'Description du quiz'
          }
        } 
      });
      
    } catch {
      alert('Code de quiz invalide ou quiz non trouvé');
    } finally {
      setIsLoading(false);
    }
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

      {/* Section principale - correspond au template Twig */}
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gray-100 text-gray-900">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold">
              {quizInfo ? quizInfo.title : 'Participer au Quiz'}
            </CardTitle>
            {quizInfo?.description && (
              <p className="text-gray-600 mt-2">{quizInfo.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              {/* Champ Prénom */}
              <div className="mb-4">
                <Label htmlFor="first_name" className="text-sm font-medium">
                  Votre prénom
                </Label>
                <Input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={participantData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              {/* Champ Nom */}
              <div className="mb-4">
                <Label htmlFor="last_name" className="text-sm font-medium">
                  Votre nom
                </Label>
                <Input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={participantData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              {/* Champ Code du Quiz */}
              <div className="mb-6">
                <Label htmlFor="quiz_code" className="text-sm font-medium">
                  Code du Quiz
                </Label>
                <Input
                  id="quiz_code"
                  name="quiz_code"
                  type="text"
                  value={participantData.quizCode}
                  onChange={(e) => handleInputChange('quizCode', e.target.value)}
                  placeholder="Entrez le code fourni par votre professeur"
                  required
                  className="mt-1"
                />
              </div>

              {/* Bouton Commencer le Quiz */}
              <div className="d-grid">
                <Button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-lg"
                  disabled={isLoading}
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