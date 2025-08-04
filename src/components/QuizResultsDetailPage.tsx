
import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import axios from 'axios';
import type { AxiosResponse } from 'axios';

// Import des composants Shadcn UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Import des icônes Lucide React
import { ArrowLeft, Users, TrendingUp, Trophy, TrendingDown, Target, Search, Calendar, BarChart3, Eye, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';


// Interface pour l'état de navigation passé depuis la page précédente
interface LocationState {
    quizId: number;
    quizTitle: string;
    quizCode: string;
}

// Interface personnalisée pour useLocation avec notre type de state
interface CustomLocation extends Omit<Location, 'state'> {
    state: LocationState | null;
}

// Interface pour une tentative de quiz (données brutes de l'API)
interface QuizAttempt {
    id: number;
    quiz: string; // URL de référence vers le quiz
    participantFirstName: string;
    participantLastName: string;
    startedAt: string;
    score: number;
    totalQuestions: number;
    user?: string;
    completedAt?: string;
}

// Interface pour les données d'un étudiant avec ses résultats calculés
interface Student {
    id: number;
    name: string;
    email: string;
    date: string;
    score: number;
    totalQuestions: number;
    percentage: number;
}

// Interface pour les données complètes du quiz avec métriques
interface QuizData {
    title: string;
    code: string;
    totalStudents: number;
    averageScore: number;
    bestScore: number;
    lowestScore: number;
    successRate: number;
}

// Interface pour une question (données brutes de l'API)
interface Question {
    id: number;
    text: string;
    quiz: string; 
    orderNumber?: number;
}

// Interface pour une réponse possible (données brutes de l'API)
interface Answer {
    id: number;
    text: string;
    correct: boolean;
    question: string; 
    orderNumber?: number;
}

// Interface pour une réponse utilisateur (données brutes de l'API)
interface UserAnswer {
    id: number;
    question: string; 
    answer: string; 
    quizAttempt: string; 
}

// Interface pour les détails d'une réponse formatée pour l'affichage
interface StudentAnswerDetail {
    questionId: string;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
}

// Interface pour les réponses API au format JSON-LD
interface ApiResponse<T> {
    member?: T[];
    'hydra:member'?: T[];
}

type ApiResponseFormat<T> = T[] | ApiResponse<T>;

// Type pour les états de chargement
type LoadingState = boolean;

// Type pour les états d'erreur
type ErrorState = string | null;

// Type pour l'étudiant sélectionné
type SelectedStudent = Student | null;

// Type pour le terme de recherche
type SearchTerm = string;

// Type pour les fonctions de gestion d'événements
type EventHandler<T = void> = () => T;
type ParameterizedEventHandler<P, T = void> = (param: P) => T;



// URL de base de l'API Symfony
const API_BASE_URL: string = 'http://localhost:8000';

function QuizResultsDetailPage() {
    // Hook pour la navigation entre les pages
    const navigate = useNavigate();

    // Hook pour récupérer les données passées en navigation
    const location = useLocation() as CustomLocation;
    const { quizId, quizTitle, quizCode }: Partial<LocationState> = location.state || {};

    // État pour les données du quiz
    const [quizData, setQuizData] = useState<QuizData | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<SelectedStudent>(null);
    const [studentAnswers, setStudentAnswers] = useState<StudentAnswerDetail[]>([]);
    const [searchTerm, setSearchTerm] = useState<SearchTerm>('');
    const [isLoading, setIsLoading] = useState<LoadingState>(true);
    const [error, setError] = useState<ErrorState>(null);

  
    useEffect(() => {
        const loadQuizResults = async (): Promise<void> => {
            if (!quizId) {
                navigate('/admin');
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                // Récupérer les tentatives pour ce quiz
                const response: AxiosResponse<ApiResponseFormat<QuizAttempt>> = await axios.get<ApiResponseFormat<QuizAttempt>>(`${API_BASE_URL}/api/quiz_attempts`);
                let attemptsArray: QuizAttempt[] = [];

                // Gérer le format de réponse JSON-LD
                if (Array.isArray(response.data)) {
                    attemptsArray = response.data;
                } else if (response.data && Array.isArray((response.data as ApiResponse<QuizAttempt>).member)) {
                    attemptsArray = (response.data as ApiResponse<QuizAttempt>).member!;
                } else if (response.data && Array.isArray((response.data as ApiResponse<QuizAttempt>)['hydra:member'])) {
                    attemptsArray = (response.data as ApiResponse<QuizAttempt>)['hydra:member']!;
                }

                // Filtrer les tentatives pour ce quiz spécifique
                const quizAttempts: QuizAttempt[] = attemptsArray.filter((attempt: QuizAttempt) => {
                    const attemptQuizId: string = attempt.quiz.split('/').pop()!;
                    return attemptQuizId === quizId.toString();
                });

                // Transformer les données des étudiants avec calculs précis
                const studentsData: Student[] = quizAttempts.map((attempt: QuizAttempt): Student => {
                    const percentage: number = attempt.totalQuestions > 0
                        ? Math.round((attempt.score / attempt.totalQuestions) * 100)
                        : 0;

                    console.log(`Étudiant ${attempt.participantFirstName} ${attempt.participantLastName}:`, {
                        score: attempt.score,
                        totalQuestions: attempt.totalQuestions,
                        percentage: percentage
                    });

                    return {
                        id: attempt.id,
                        name: `${attempt.participantFirstName} ${attempt.participantLastName}`,
                        email: `${attempt.participantFirstName}${attempt.participantLastName}@gmail.com`,
                        date: new Date(attempt.startedAt).toLocaleDateString('fr-FR'),
                        score: attempt.score,
                        totalQuestions: attempt.totalQuestions,
                        percentage: percentage
                    };
                });

                // Calculer les métriques avec les vraies données
                const totalStudents: number = studentsData.length;

                // Calculer la moyenne des scores
                const averageScore: number = totalStudents > 0
                    ? Math.round(studentsData.reduce((sum: number, student: Student) => sum + student.percentage, 0) / totalStudents)
                    : 0;

                // Trouver le meilleur score
                const bestScore: number = totalStudents > 0
                    ? Math.max(...studentsData.map((student: Student) => student.percentage))
                    : 0;

                // Trouver le score le plus bas
                const lowestScore: number = totalStudents > 0
                    ? Math.min(...studentsData.map((student: Student) => student.percentage))
                    : 0;

                // Calculer le taux de réussite (score >= 70%)
                const successRate: number = totalStudents > 0
                    ? Math.round((studentsData.filter((student: Student) => student.percentage >= 70).length / totalStudents) * 100)
                    : 0;

                console.log('Métriques calculées:', {
                    totalStudents,
                    averageScore,
                    bestScore,
                    lowestScore,
                    successRate,
                    studentsData: studentsData.map((s: Student) => ({ name: s.name, percentage: s.percentage }))
                });

                setQuizData({
                    title: quizTitle || 'Quiz de Mathématiques',
                    code: quizCode || 'MATH01',
                    totalStudents,
                    averageScore,
                    bestScore,
                    lowestScore,
                    successRate
                });

                setStudents(studentsData);

            } catch (error) {
                console.error('Erreur lors du chargement des résultats:', error);
                setError('Erreur lors du chargement des résultats');
            } finally {
                setIsLoading(false);
            }
        };

        loadQuizResults();
    }, [quizId, navigate, quizTitle, quizCode]);

    // Fonction pour retourner à l'accueil
    const handleBackToHome: EventHandler = (): void => {
        navigate('/admin');
    };

    // Fonction pour exporter les résultats individuels d'un étudiant en PDF
    const handleExportStudentResults: ParameterizedEventHandler<Student> = (student: Student): void => {
        if (!quizData || !student || !studentAnswers.length) {
            toast.error('Aucune donnée à exporter pour cet étudiant');
            return;
        }

        try {
            // Créer un nouveau document PDF
            const doc: jsPDF = new jsPDF();

            // Titre du document
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('Rapport Individuel du Quiz', 105, 20, { align: 'center' });

            // Informations de l'étudiant
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Étudiant: ${student.name}`, 20, 35);
            doc.text(`Quiz: ${quizData.title}`, 20, 45);
            doc.text(`Code: ${quizData.code}`, 20, 55);
            doc.text(`Date de passage: ${student.date}`, 20, 65);
            doc.text(`Score: ${student.score}/${student.totalQuestions} (${student.percentage}%)`, 20, 75);

            // Résultats détaillés
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Détail des Réponses:', 20, 95);

            // Tableau des réponses
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Question', 20, 110);
            doc.text('Votre réponse', 80, 110);
            doc.text('Bonne réponse', 140, 110);
            doc.text('Statut', 180, 110);

            // Données des réponses
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            let yPosition: number = 120;

            studentAnswers.forEach((answer: StudentAnswerDetail) => {
                // Vérifier si on doit passer à une nouvelle page
                if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 20;

                    // Réafficher les en-têtes sur la nouvelle page
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Question', 20, yPosition);
                    doc.text('Votre réponse', 80, yPosition);
                    doc.text('Bonne réponse', 140, yPosition);
                    doc.text('Statut', 180, yPosition);
                    yPosition += 10;
                }

                // Tronquer les textes si trop longs
                const questionText: string = answer.questionText.length > 30 ?
                    answer.questionText.substring(0, 30) + '...' : answer.questionText;
                const userAnswerText: string = answer.userAnswer.length > 20 ?
                    answer.userAnswer.substring(0, 20) + '...' : answer.userAnswer;
                const correctAnswerText: string = answer.correctAnswer.length > 20 ?
                    answer.correctAnswer.substring(0, 20) + '...' : answer.correctAnswer;

                doc.text(questionText, 20, yPosition);
                doc.text(userAnswerText, 80, yPosition);
                doc.text(correctAnswerText, 140, yPosition);
                doc.text(answer.isCorrect ? '✓' : '✗', 180, yPosition);

                yPosition += 8;
            });

            // Pied de page
            const pageCount: number = (doc as unknown as { internal: { getNumberOfPages(): number } }).internal.getNumberOfPages();
            for (let i: number = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'italic');
                doc.text(`Page ${i} sur ${pageCount}`, 105, 280, { align: 'center' });
            }

            // Sauvegarder le PDF
            const fileName: string = `resultat_${student.name.replace(/\s+/g, '_')}_${quizData.code}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            toast.success(`Export PDF réussi pour ${student.name} !`);

        } catch (error) {
            console.error('Erreur lors de l\'export PDF:', error);
            toast.error('Erreur lors de l\'export PDF');
        }
    };

    // Fonction pour exporter les résultats en PDF
    const handleExportResults: EventHandler = (): void => {
        if (!quizData || students.length === 0) {
            toast.error('Aucune donnée à exporter');
            return;
        }

        try {
            // Créer un nouveau document PDF
            const doc: jsPDF = new jsPDF();

            // Titre du document
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('Rapport des Résultats du Quiz', 105, 20, { align: 'center' });

            // Informations du quiz
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            // doc.text(`Quiz: ${quizData.title}`, 20, 35);
            // doc.text(`Code: ${quizData.code}`, 20, 45);
            doc.text(`Date d'export: ${new Date().toLocaleDateString('fr-FR')}`, 20, 55);

            // Tableau des résultats
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Résultats Détaillés des Participants:', 20, 75);

            // En-têtes du tableau
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Nom', 20, 90);
            doc.text('Prénom', 60, 90);
            doc.text('Date de passage', 100, 90);
            doc.text('Score', 150, 90);
            doc.text('Pourcentage', 180, 90);

            // Données des participants
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            let yPosition: number = 100;

            students.forEach((student: Student) => {
                // Vérifier si on doit passer à une nouvelle page
                if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 20;

                    // Réafficher les en-têtes sur la nouvelle page
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Nom', 20, yPosition);
                    doc.text('Prénom', 60, yPosition);
                    doc.text('Date de passage', 100, yPosition);
                    doc.text('Score', 150, yPosition);
                    doc.text('Pourcentage', 180, yPosition);
                    yPosition += 10;
                }

                const [firstName, lastName]: string[] = student.name.split(' ');
                doc.text(lastName || student.name, 20, yPosition);
                doc.text(firstName || '', 60, yPosition);
                doc.text(student.date, 100, yPosition);
                doc.text(`${student.score}/${student.totalQuestions}`, 150, yPosition);
                doc.text(`${student.percentage}%`, 180, yPosition);

                yPosition += 8;
            });

            // Pied de page
            const pageCount: number = doc.internal.getNumberOfPages();
            for (let i: number = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'italic');
                doc.text(`Page ${i} sur ${pageCount}`, 105, 280, { align: 'center' });
            }

            // Sauvegarder le PDF
            const fileName: string = `resultats_${quizData.code}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            toast.success('Export PDF réussi !');

        } catch (error) {
            console.error('Erreur lors de l\'export PDF:', error);
            toast.error('Erreur lors de l\'export PDF');
        }
    };

    // Fonction pour sélectionner un étudiant
    const handleStudentSelect: ParameterizedEventHandler<Student, Promise<void>> = async (student: Student): Promise<void> => {
        setSelectedStudent(student);

        try {
            // Récupérer les questions du quiz
            const questionsResponse: AxiosResponse<ApiResponseFormat<Question>> = await axios.get<ApiResponseFormat<Question>>(`${API_BASE_URL}/api/questions`);
            let questionsArray: Question[] = [];

            // Gérer le format de réponse JSON-LD
            if (Array.isArray(questionsResponse.data)) {
                questionsArray = questionsResponse.data;
            } else if (questionsResponse.data && Array.isArray((questionsResponse.data as ApiResponse<Question>).member)) {
                questionsArray = (questionsResponse.data as ApiResponse<Question>).member!;
            } else if (questionsResponse.data && Array.isArray((questionsResponse.data as ApiResponse<Question>)['hydra:member'])) {
                questionsArray = (questionsResponse.data as ApiResponse<Question>)['hydra:member']!;
            }

            // Filtrer les questions pour ce quiz
            const quizQuestions: Question[] = questionsArray.filter((question: Question) =>
                question.quiz === `/api/quizzes/${quizId}`
            );

            // Récupérer toutes les réponses possibles
            const answersResponse: AxiosResponse<ApiResponseFormat<Answer>> = await axios.get<ApiResponseFormat<Answer>>(`${API_BASE_URL}/api/answers`);
            let answersArray: Answer[] = [];

            // Gérer le format de réponse JSON-LD
            if (Array.isArray(answersResponse.data)) {
                answersArray = answersResponse.data;
            } else if (answersResponse.data && Array.isArray((answersResponse.data as ApiResponse<Answer>).member)) {
                answersArray = (answersResponse.data as ApiResponse<Answer>).member!;
            } else if (answersResponse.data && Array.isArray((answersResponse.data as ApiResponse<Answer>)['hydra:member'])) {
                answersArray = (answersResponse.data as ApiResponse<Answer>)['hydra:member']!;
            }

            // Récupérer les réponses utilisateur
            const userAnswersResponse: AxiosResponse<ApiResponseFormat<UserAnswer>> = await axios.get<ApiResponseFormat<UserAnswer>>(`${API_BASE_URL}/api/user_answers`);
            let userAnswersArray: UserAnswer[] = [];

            // Gérer le format de réponse JSON-LD
            if (Array.isArray(userAnswersResponse.data)) {
                userAnswersArray = userAnswersResponse.data;
            } else if (userAnswersResponse.data && Array.isArray((userAnswersResponse.data as ApiResponse<UserAnswer>).member)) {
                userAnswersArray = (userAnswersResponse.data as ApiResponse<UserAnswer>).member!;
            } else if (userAnswersResponse.data && Array.isArray((userAnswersResponse.data as ApiResponse<UserAnswer>)['hydra:member'])) {
                userAnswersArray = (userAnswersResponse.data as ApiResponse<UserAnswer>)['hydra:member']!;
            }

            // Filtrer les réponses pour cette tentative
            const studentAnswers: UserAnswer[] = userAnswersArray.filter((answer: UserAnswer) =>
                answer.quizAttempt === `/api/quiz_attempts/${student.id}`
            );

            // Créer les détails des réponses
            const answersDetails: StudentAnswerDetail[] = studentAnswers.map((userAnswer: UserAnswer): StudentAnswerDetail => {
                console.log('UserAnswer:', userAnswer);

                // Extraire l'ID de la question depuis l'URL
                const questionId: string = userAnswer.question.split('/').pop()!;
                console.log('Question ID:', questionId);

                // Trouver la question correspondante
                const question: Question | undefined = quizQuestions.find((q: Question) => q.id === parseInt(questionId));
                console.log('Question trouvée:', question);

                // Trouver toutes les réponses pour cette question
                const allQuestionAnswers: Answer[] = answersArray.filter((a: Answer) => a.question === `/api/questions/${questionId}`);
                console.log('Réponses pour cette question:', allQuestionAnswers);

                // Extraire l'ID de la réponse depuis l'URL
                const answerId: string = userAnswer.answer.split('/').pop()!;
                console.log('Answer ID:', answerId);

                // Trouver la réponse sélectionnée par l'utilisateur
                const selectedAnswer: Answer | undefined = allQuestionAnswers.find((a: Answer) => a.id === parseInt(answerId));
                console.log('Réponse sélectionnée:', selectedAnswer);

                // Trouver la réponse correcte
                const correctAnswer: Answer | undefined = allQuestionAnswers.find((a: Answer) => a.correct === true);
                console.log('Réponse correcte:', correctAnswer);

                return {
                    questionId: questionId,
                    questionText: question?.text || 'Question non trouvée',
                    userAnswer: selectedAnswer?.text || 'Réponse non trouvée',
                    correctAnswer: correctAnswer?.text || 'Réponse correcte non trouvée',
                    isCorrect: selectedAnswer?.correct || false
                };
            });

            setStudentAnswers(answersDetails);

        } catch (error) {
            console.error('Erreur lors de la récupération des réponses:', error);
            setStudentAnswers([]);
        }
    };

    // Fonction pour gérer le changement du terme de recherche
    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setSearchTerm(e.target.value);
    };

    // Filtrer les étudiants selon la recherche
    const filteredStudents: Student[] = students.filter((student: Student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Affichage de chargement
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-xl mb-4">Chargement des résultats...</div>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
                </div>
            </div>
        );
    }

    // Affichage d'erreur
    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-6">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-2xl font-bold mb-4">Erreur</h1>
                    <p className="text-gray-300 mb-4">{error}</p>
                    <Button onClick={handleBackToHome} className="bg-yellow-400 hover:bg-yellow-500 text-gray-900">
                        Retour à l'accueil
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-8">
                    <Button
                        onClick={handleBackToHome}
                        className="bg-white hover:bg-gray-100 text-gray-900 border border-gray-300"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour à l'accueil
                    </Button>

                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-yellow-400 mb-2">
                            {quizData!.title}
                        </h1>
                        <p className="text-gray-300">
                            Code: {quizData!.code} • {quizData!.totalStudents} participants
                        </p>
                    </div>

                    <Button
                        onClick={handleExportResults}
                        className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Exporter les Résultats
                    </Button>
                </div>

                {/* Métriques Summary */}
                <div className="grid grid-cols-5 gap-4 mb-8">
                    <Card className="bg-yellow-400 text-gray-900">
                        <CardContent className="p-4 text-center">
                            <Users className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm font-medium">Participants</p>
                            <p className="text-2xl font-bold">{quizData!.totalStudents}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-yellow-400 text-gray-900">
                        <CardContent className="p-4 text-center">
                            <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm font-medium">Moyenne</p>
                            <p className="text-2xl font-bold">{quizData!.averageScore} %</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-yellow-400 text-gray-900">
                        <CardContent className="p-4 text-center">
                            <Trophy className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm font-medium">Meilleur</p>
                            <p className="text-2xl font-bold">{quizData!.bestScore} %</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-yellow-400 text-gray-900">
                        <CardContent className="p-4 text-center">
                            <TrendingDown className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm font-medium">Plus Bas</p>
                            <p className="text-2xl font-bold">{quizData!.lowestScore} %</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-yellow-400 text-gray-900">
                        <CardContent className="p-4 text-center">
                            <Target className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm font-medium">Taux Réussite Globale</p>
                            <p className="text-2xl font-bold">{quizData!.successRate} %</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Barre de recherche et filtres */}
                <div className="flex justify-between items-center mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            type="text"
                            placeholder="Rechercher un étudiant ..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="pl-10 bg-gray-800 border-gray-700 text-white"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button className="bg-white hover:bg-gray-100 text-gray-900 border border-gray-300">
                            <Calendar className="w-4 h-4 mr-2" />
                            Trie par date
                        </Button>
                        <Button className="bg-white hover:bg-gray-100 text-gray-900 border border-gray-300">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Trie par résultat
                        </Button>
                    </div>
                </div>

                {/* Contenu principal */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Liste des étudiants (gauche) */}
                    <Card className="bg-gray-100 text-gray-900">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Users className="w-5 h-5 mr-2" />
                                Étudiants ({filteredStudents.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {filteredStudents.map((student: Student) => (
                                <div
                                    key={student.id}
                                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedStudent?.id === student.id
                                        ? 'bg-blue-100 border-blue-300'
                                        : 'bg-white border-gray-300 hover:bg-gray-50'
                                        }`}
                                    onClick={() => handleStudentSelect(student)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{student.name}</h3>
                                            <p className="text-sm text-blue-600">{student.email}</p>
                                            <p className="text-xs text-gray-500">{student.date}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900">{student.percentage} %</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Résultats détaillés (droite) */}
                    <Card className="bg-gray-100 text-gray-900">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Résultats Détaillés</CardTitle>
                                {selectedStudent && studentAnswers && studentAnswers.length > 0 && (
                                    <Button
                                        onClick={() => handleExportStudentResults(selectedStudent)}
                                        className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-3 py-1 text-sm"
                                    >
                                        <Download className="w-4 h-4 mr-1" />
                                        Exporter PDF
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {selectedStudent ? (
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <h3 className="text-xl font-bold mb-2">{selectedStudent.name}</h3>
                                        <p className="text-gray-600 mb-4">{selectedStudent.email}</p>
                                        <div className="text-3xl font-bold text-green-600 mb-2">
                                            {selectedStudent.percentage}%
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            Score: {selectedStudent.score}/{selectedStudent.totalQuestions}
                                        </p>
                                    </div>

                                    <div className="border-t pt-4">
                                        <h4 className="font-semibold mb-2">Détails des réponses</h4>
                                        {studentAnswers.length > 0 ? (
                                            <div className="space-y-3">
                                                {studentAnswers.map((answer: StudentAnswerDetail, index: number) => (
                                                    <div key={answer.questionId} className="p-3 border rounded-lg bg-white">
                                                        <h5 className="font-medium text-gray-900 mb-2">
                                                            Question {index + 1}: {answer.questionText}
                                                        </h5>
                                                        <div className="space-y-1">
                                                            <div className="text-sm">
                                                                <span className="font-medium">Votre réponse:</span>
                                                                <span className={`ml-2 ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {answer.userAnswer}
                                                                </span>
                                                            </div>
                                                            {!answer.isCorrect && (
                                                                <div className="text-sm">
                                                                    <span className="font-medium">Réponse correcte:</span>
                                                                    <span className="ml-2 text-green-600">
                                                                        {answer.correctAnswer}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-600">
                                                Chargement des détails des réponses...
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                        Sélectionnez un étudiant
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Cliquez sur un étudiant dans la liste pour voir ses résultats détaillés
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default QuizResultsDetailPage;