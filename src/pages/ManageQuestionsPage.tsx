import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

import { ArrowLeft, Plus, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { QuizApiService, QuizApiError } from '@/lib/quizApi';
import type { Quiz } from '@/types/Quiz';

// Composant principal de la page de gestion des questions
const ManageQuestionsPage: React.FC = () => {
  // Hook pour la navigation avec React Router
  const navigate = useNavigate();
  const { quizId } = useParams<{ quizId: string }>();
  
  // États pour les données
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour le formulaire d'ajout de question
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    answers: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fonction pour récupérer les données du quiz
  const fetchQuiz = async () => {
    if (!quizId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const quizData = await QuizApiService.getQuizById(parseInt(quizId));
      
      // Transformer les données pour correspondre à notre interface
      const transformedQuiz: Quiz = {
        id: quizData.id || 0,
        title: quizData.title,
        description: quizData.description,
        uniqueCode: quizData.uniqueCode || 'N/A',
        isActive: quizData.isActive,
        isStarted: quizData.isStarted,
        passingScore: quizData.passingScore,
        teacher: quizData.teacher,
        questions: quizData.questions || []
      };
      setQuiz(transformedQuiz);
      
    } catch (error) {
      console.error('Erreur lors de la récupération du quiz:', error);
      setError('Erreur lors du chargement du quiz');
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer les données au chargement de la page
  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  // Fonction pour ajouter une réponse au formulaire
  const handleAddAnswer = () => {
    setNewQuestion(prev => ({
      ...prev,
      answers: [...prev.answers, { text: '', isCorrect: false }]
    }));
  };

  // Fonction pour mettre à jour une réponse
  const handleAnswerChange = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    setNewQuestion(prev => ({
      ...prev,
      answers: prev.answers.map((answer, i) => 
        i === index ? { ...answer, [field]: value } : answer
      )
    }));
  };

  // Fonction pour supprimer une réponse
  const handleRemoveAnswer = (index: number) => {
    if (newQuestion.answers.length <= 2) return; 
    
    setNewQuestion(prev => ({
      ...prev,
      answers: prev.answers.filter((_, i) => i !== index)
    }));
  };

  // Fonction pour soumettre une nouvelle question
  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quiz) return;
    
    // Validation
    if (!newQuestion.text.trim()) {
      alert('Le texte de la question est obligatoire');
      return;
    }
    
    if (newQuestion.answers.length < 2) {
      alert('Il faut au moins 2 réponses');
      return;
    }
    
    const hasCorrectAnswer = newQuestion.answers.some(answer => answer.isCorrect);
    if (!hasCorrectAnswer) {
      alert('Il faut au moins une réponse correcte');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Appel API pour ajouter une question
      await QuizApiService.addQuestion(quiz.id || 0, {
        text: newQuestion.text,
        answers: newQuestion.answers.map(answer => ({
          text: answer.text,
          isCorrect: answer.isCorrect
        }))
      });
      
      // Réinitialiser le formulaire
      setNewQuestion({
        text: '',
        answers: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ]
      });
      
      // Recharger les données du quiz
      await fetchQuiz();
      
      alert('Question ajoutée avec succès !');
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la question:', error);
      
      let errorMessage = 'Erreur lors de l\'ajout de la question';
      
      if (error instanceof QuizApiError) {
        if (error.status === 401) {
          errorMessage = 'Vous devez être connecté pour ajouter une question';
        } else if (error.status === 403) {
          errorMessage = 'Vous n\'êtes pas autorisé à modifier ce quiz';
        } else if (error.status === 400) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction pour retourner au dashboard
  const handleBackToDashboard = () => {
    navigate('/admin-dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Chargement du quiz...</span>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{error || 'Quiz non trouvé'}</p>
          <Button onClick={handleBackToDashboard} className="bg-blue-600 hover:bg-blue-700">
            Retour au dashboard
          </Button>
        </div>
      </div>
    );
  }

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
            Retour au dashboard
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-yellow-400 mb-2">
              Gérer les Questions
            </h1>
            <p className="text-gray-300 text-lg">
              Quiz "{quiz.title}" - Code: {quiz.uniqueCode}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section principale - Liste des questions */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-100 text-gray-900">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                Questions du quiz "{quiz.title}"
              </CardTitle>
            </CardHeader>
            <CardContent>
                             {(!quiz.questions || quiz.questions.length === 0) ? (
                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                   <h4 className="text-blue-800 font-semibold mb-2">Aucune question</h4>
                   <p className="text-blue-700">
                     Ce quiz n'a pas encore de questions. Ajoutez-en une ci-dessous !
                   </p>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {Array.isArray(quiz.questions) ? quiz.questions
                     .sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0))
                     .map((question, index) => (
                     <div key={`question-${question.id || index}-${index}`} className="border border-gray-200 rounded-lg p-4 bg-white">
                       <h5 className="font-semibold text-gray-900 mb-3">
                         Question {index + 1}: {question.text || 'Question sans texte'}
                       </h5>
                       <div className="ml-4 space-y-2">
                         {question.answers && Array.isArray(question.answers) && question.answers
                           .sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0))
                           .map((answer, answerIndex) => (
                           <div key={`answer-${answer.id || answerIndex}-${index}-${answerIndex}`} className="flex items-center gap-2">
                             <span className={`font-medium ${
                               answer.isCorrect ? 'text-green-600' : 'text-gray-600'
                             }`}>
                               {answerIndex + 1}. {answer.text || 'Réponse sans texte'}
                             </span>
                             {answer.isCorrect && (
                               <Badge className="bg-green-100 text-green-800">
                                 <CheckCircle className="w-3 h-3 mr-1" />
                                 Correct
                               </Badge>
                             )}
                           </div>
                         ))}
                       </div>
                     </div>
                   )) : (
                     <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                       <h4 className="text-yellow-800 font-semibold mb-2">Erreur d'affichage</h4>
                       <p className="text-yellow-700">
                         Les questions ne sont pas dans le bon format. Vérifiez la console pour plus de détails.
                       </p>
                     </div>
                   )}
                 </div>
               )}
            </CardContent>
          </Card>
        </div>

        {/* Section latérale - Ajouter une question */}
        <div className="space-y-6">
          <Card className="bg-gray-100 text-gray-900">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Ajouter une question</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitQuestion}>
                {/* Texte de la question */}
                <div className="mb-4">
                  <Label htmlFor="question-text" className="text-sm font-medium">
                    Question *
                  </Label>
                  <Textarea
                    id="question-text"
                    value={newQuestion.text}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Entrez votre question ici..."
                    rows={3}
                    required
                    className="mt-1"
                  />
                </div>

                {/* Réponses */}
                <div className="mb-4">
                  <Label className="text-sm font-medium">Réponses *</Label>
                  <div className="space-y-2 mt-2">
                    {newQuestion.answers.map((answer, index) => (
                      <div key={`answer-${index}`} className="flex gap-2">
                        <Input
                          value={answer.text}
                          onChange={(e) => handleAnswerChange(index, 'text', e.target.value)}
                          placeholder={`Réponse ${index + 1}`}
                          required
                          className="flex-1"
                        />
                        <input
                          type="checkbox"
                          checked={answer.isCorrect}
                          onChange={(e) => handleAnswerChange(index, 'isCorrect', e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        {newQuestion.answers.length > 2 && (
                          <Button
                            type="button"
                            onClick={() => handleRemoveAnswer(index)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddAnswer}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter une réponse
                  </Button>
                </div>

                {/* Bouton de soumission */}
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Ajout...
                    </>
                  ) : (
                    'Ajouter la question'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default ManageQuestionsPage; 