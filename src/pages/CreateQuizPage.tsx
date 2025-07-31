import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { ArrowLeft, RefreshCw } from 'lucide-react';
import { QuizApiService, QuizApiError } from '@/lib/quizApi';

// Fonction pour générer un code unique côté client (temporaire)
const generateUniqueCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Composant principal de la page de création de quiz
const CreateQuizPage: React.FC = () => {
  // Hook pour la navigation avec React Router
  const navigate = useNavigate();
  
  // État pour stocker les données du formulaire de quiz
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    uniqueCode: ''
  });

  // État pour indiquer si on crée le quiz
  const [isLoading, setIsLoading] = useState(false);

  // Générer un nouveau code unique à chaque visite de la page
  useEffect(() => {
    setQuizData(prev => ({
      ...prev,
      uniqueCode: generateUniqueCode()
    }));
  }, []);

  // Fonction pour générer un nouveau code
  const handleGenerateNewCode = () => {
    setQuizData(prev => ({
      ...prev,
      uniqueCode: generateUniqueCode()
    }));
  };

  // Fonction pour mettre à jour les champs du formulaire
  const handleInputChange = (field: 'title' | 'description', value: string) => {
    setQuizData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  // Fonction pour créer le quiz
  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des données
    if (!quizData.title.trim()) {
      alert('Le titre du quiz est obligatoire');
      return;
    }

    setIsLoading(true);
    
    try {
      // Préparer les données pour l'API Symfony
      const quizToSend = {
        title: quizData.title,
        description: quizData.description || '',
        isActive: true,
        isStarted: false,
        passingScore: 70,
        questions: [] // Les questions seront ajoutées séparément
      };

      console.log('Données du quiz à envoyer:', quizToSend);

      // Créer le quiz via l'API Symfony
      const createdQuizResponse = await QuizApiService.createQuiz(quizToSend);
      
      console.log('Quiz créé avec succès:', createdQuizResponse);
      
      // Afficher le code d'accès généré
      alert(`Quiz créé avec succès ! Code d'accès : ${createdQuizResponse.uniqueCode}`);

      // Redirection vers le dashboard admin
      navigate('/admin-dashboard');
      
    } catch (error) {
      console.error('Erreur lors de la création du quiz:', error);
      
      let errorMessage = 'Erreur lors de la création du quiz';
      
      if (error instanceof QuizApiError) {
        if (error.status === 401) {
          errorMessage = 'Vous devez être connecté pour créer un quiz';
        } else if (error.status === 400) {
          errorMessage = 'Données invalides pour la création du quiz';
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour retourner au dashboard
  const handleBackToDashboard = () => {
    navigate('/admin-dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        {/* Bouton retour et titre */}
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleBackToDashboard}
            variant="outline"
            className="border-gray-600 text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-yellow-400 mb-2">
              Créer un nouveau quiz
            </h1>
            <p className="text-gray-300 text-lg">
              Créez votre quiz en quelques étapes simples
            </p>
          </div>
        </div>
      </div>

      {/* Section principale - correspond au template Twig */}
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gray-100 text-gray-900">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Créer un nouveau quiz</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateQuiz}>
              {/* Titre du quiz */}
              <div className="mb-4">
                <Label htmlFor="title" className="text-sm font-medium">
                  Titre du quiz *
                </Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  value={quizData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ex: Quiz de culture générale"
                  required
                  className="mt-1"
                />
                <div className="text-sm text-gray-600 mt-1">
                  Ex: Quiz de culture générale
                </div>
              </div>
              
              {/* Description */}
              <div className="mb-4">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={quizData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Description optionnelle du quiz"
                  rows={3}
                  className="mt-1"
                />
                <div className="text-sm text-gray-600 mt-1">
                  Description optionnelle du quiz
                </div>
              </div>

              {/* Code unique généré */}
              <div className="mb-6">
                <Label htmlFor="uniqueCode" className="text-sm font-medium">
                  Code d'accès unique
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="uniqueCode"
                    name="uniqueCode"
                    type="text"
                    value={quizData.uniqueCode}
                    readOnly
                    className="flex-1 bg-gray-50 text-gray-700 font-mono text-lg text-center"
                  />
                  <Button 
                    type="button"
                    onClick={handleGenerateNewCode}
                    variant="outline"
                    className="px-3"
                    title="Générer un nouveau code"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Code unique généré automatiquement - cliquez sur l'icône pour en générer un nouveau
                </div>
              </div>
              
              {/* Boutons d'action */}
              <div className="flex gap-4">
                <Button 
                  type="button"
                  onClick={handleBackToDashboard}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </Button>
                
                <Button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? 'Création...' : 'Créer le quiz'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateQuizPage; 