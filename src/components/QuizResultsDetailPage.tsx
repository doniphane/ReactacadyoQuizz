import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// Import des composants UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Import des icônes
import { 
    ArrowLeft, 
    Users, 
    TrendingUp, 
    Trophy, 
    TrendingDown, 
    Target, 
    Search, 
    Calendar, 
    BarChart3, 
    Eye, 
    Download 
} from 'lucide-react';

import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import AuthService from '../services/AuthService';


// Type pour un étudiant
interface Student {
    id: number;
    name: string;
    email: string;
    date: string;
    score: number;
    totalQuestions: number;
    percentage: number;
}

// Type pour les détails d'une réponse
interface AnswerDetail {
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
}

// Type pour les métriques
interface Metrics {
    totalStudents: number;
    averageScore: number;
    bestScore: number;
    lowestScore: number;
    successRate: number;
}

// Type pour une tentative de quiz
interface QuizAttempt {
    id: number;
    quiz: string;
    participantFirstName: string;
    participantLastName: string;
    startedAt: string;
    score: number;
    totalQuestions: number;
}

// Type pour une question
interface Question {
    id: number;
    text: string;
    quiz: string;
}

// Type pour une réponse
interface Answer {
    id: number;
    text: string;
    correct: boolean;
    question: string;
}

// Type pour une réponse utilisateur
interface UserAnswer {
    question: string;
    answer: string;
    quizAttempt: string;
}

// URL de l'API
const API_BASE_URL = 'http://localhost:8000';



function QuizResultsDetailPage() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Récupérer les données passées depuis la page précédente
    const { quizId, quizTitle, quizCode } = location.state || {};

    // États simples
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [studentAnswers, setStudentAnswers] = useState<AnswerDetail[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Métriques calculées
    const [metrics, setMetrics] = useState<Metrics>({
        totalStudents: 0,
        averageScore: 0,
        bestScore: 0,
        lowestScore: 0,
        successRate: 0
    });

    // Fonction pour obtenir le token
    const getToken = (): string | null => {
        const token = AuthService.getToken();
        if (!token) {
            toast.error('Vous devez être connecté');
            navigate('/login');
            return null;
        }
        return token;
    };

    // Charger les résultats du quiz
    useEffect(() => {
        const loadQuizResults = async (): Promise<void> => {
            if (!quizId) {
                navigate('/admin');
                return;
            }

            try {
                setLoading(true);
                const token = getToken();
                if (!token) return;

                // Récupérer toutes les tentatives
                const response = await axios.get(`${API_BASE_URL}/api/quiz_attempts`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                // Extraire les tentatives depuis la réponse
                let allAttempts: QuizAttempt[] = [];
                if (Array.isArray(response.data)) {
                    allAttempts = response.data;
                } else if (response.data.member) {
                    allAttempts = response.data.member;
                } else if (response.data['hydra:member']) {
                    allAttempts = response.data['hydra:member'];
                }

                // Filtrer pour ce quiz spécifique
                const quizAttempts: QuizAttempt[] = allAttempts.filter((attempt: QuizAttempt) => {
                    const attemptQuizId = attempt.quiz.split('/').pop();
                    return attemptQuizId === quizId.toString();
                });

                // Transformer en données d'étudiants
                const studentsData: Student[] = quizAttempts.map((attempt: QuizAttempt) => {
                    const percentage = attempt.totalQuestions > 0
                        ? Math.round((attempt.score / attempt.totalQuestions) * 100)
                        : 0;

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

                setStudents(studentsData);

                // Calculer les métriques
                if (studentsData.length > 0) {
                    const percentages: number[] = studentsData.map((student: Student) => student.percentage);
                    const average: number = Math.round(percentages.reduce((a: number, b: number) => a + b, 0) / studentsData.length);
                    const best: number = Math.max(...percentages);
                    const lowest: number = Math.min(...percentages);
                    const success: number = Math.round((studentsData.filter((student: Student) => student.percentage >= 70).length / studentsData.length) * 100);

                    setMetrics({
                        totalStudents: studentsData.length,
                        averageScore: average,
                        bestScore: best,
                        lowestScore: lowest,
                        successRate: success
                    });
                }

            } catch (error) {
                console.error('Erreur:', error);
                toast.error('Erreur lors du chargement des résultats');
            } finally {
                setLoading(false);
            }
        };

        loadQuizResults();
    }, [quizId, navigate]);

    // Sélectionner un étudiant
    const handleStudentSelect = async (student: Student): Promise<void> => {
        setSelectedStudent(student);

        try {
            const token = getToken();
            if (!token) return;

            // Récupérer les questions du quiz
            const questionsResponse = await axios.get(`${API_BASE_URL}/api/questions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            let questions: Question[] = [];
            if (Array.isArray(questionsResponse.data)) {
                questions = questionsResponse.data;
            } else if (questionsResponse.data.member) {
                questions = questionsResponse.data.member;
            } else if (questionsResponse.data['hydra:member']) {
                questions = questionsResponse.data['hydra:member'];
            }

            // Filtrer pour ce quiz
            const quizQuestions: Question[] = questions.filter((question: Question) => question.quiz === `/api/quizzes/${quizId}`);

            // Récupérer toutes les réponses possibles
            const answersResponse = await axios.get(`${API_BASE_URL}/api/answers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            let answers: Answer[] = [];
            if (Array.isArray(answersResponse.data)) {
                answers = answersResponse.data;
            } else if (answersResponse.data.member) {
                answers = answersResponse.data.member;
            } else if (answersResponse.data['hydra:member']) {
                answers = answersResponse.data['hydra:member'];
            }

            // Récupérer les réponses de l'étudiant
            const userAnswersResponse = await axios.get(`${API_BASE_URL}/api/user_answers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            let userAnswers: UserAnswer[] = [];
            if (Array.isArray(userAnswersResponse.data)) {
                userAnswers = userAnswersResponse.data;
            } else if (userAnswersResponse.data.member) {
                userAnswers = userAnswersResponse.data.member;
            } else if (userAnswersResponse.data['hydra:member']) {
                userAnswers = userAnswersResponse.data['hydra:member'];
            }

            // Filtrer pour cet étudiant
            const studentUserAnswers: UserAnswer[] = userAnswers.filter(
                (userAnswer: UserAnswer) => userAnswer.quizAttempt === `/api/quiz_attempts/${student.id}`
            );

            // Créer les détails des réponses
            const answersDetails: AnswerDetail[] = studentUserAnswers.map((userAnswer: UserAnswer) => {
                const questionId = userAnswer.question.split('/').pop();
                const answerId = userAnswer.answer.split('/').pop();

                const question = quizQuestions.find((q: Question) => q.id === parseInt(questionId || '0'));
                const questionAnswers = answers.filter((answer: Answer) => answer.question === `/api/questions/${questionId}`);
                const selectedAnswer = questionAnswers.find((answer: Answer) => answer.id === parseInt(answerId || '0'));
                const correctAnswer = questionAnswers.find((answer: Answer) => answer.correct === true);

                return {
                    questionText: question?.text || 'Question non trouvée',
                    userAnswer: selectedAnswer?.text || 'Réponse non trouvée',
                    correctAnswer: correctAnswer?.text || 'Réponse correcte non trouvée',
                    isCorrect: selectedAnswer?.correct || false
                };
            });

            setStudentAnswers(answersDetails);

        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors du chargement des détails');
            setStudentAnswers([]);
        }
    };

    // Export PDF pour tous les résultats
    const handleExportAllResults = (): void => {
        if (students.length === 0) {
            toast.error('Aucune donnée à exporter');
            return;
        }

        try {
            const doc = new jsPDF();

            // Titre
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('Rapport des Résultats du Quiz', 105, 20, { align: 'center' });

            // Infos du quiz
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Quiz: ${quizTitle || 'Quiz de Mathématiques'}`, 20, 35);
            doc.text(`Code: ${quizCode || 'MATH01'}`, 20, 45);
            doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 20, 55);

            // Tableau
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Nom', 20, 80);
            doc.text('Date', 80, 80);
            doc.text('Score', 130, 80);
            doc.text('Pourcentage', 170, 80);

            // Données
            doc.setFont('helvetica', 'normal');
            let y = 90;

            students.forEach((student: Student) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }

                doc.text(student.name, 20, y);
                doc.text(student.date, 80, y);
                doc.text(`${student.score}/${student.totalQuestions}`, 130, y);
                doc.text(`${student.percentage}%`, 170, y);
                y += 10;
            });

            // Sauvegarder
            doc.save(`resultats_${quizCode || 'quiz'}_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('Export PDF réussi !');

        } catch (error) {
            console.error('Erreur PDF:', error);
            toast.error('Erreur lors de l\'export PDF');
        }
    };

    // Export PDF pour un étudiant
    const handleExportStudentResult = (): void => {
        if (!selectedStudent || !studentAnswers.length) {
            toast.error('Sélectionnez un étudiant d\'abord');
            return;
        }

        try {
            const doc = new jsPDF();

            // Titre
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('Rapport Individuel', 105, 20, { align: 'center' });

            // Infos
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Étudiant: ${selectedStudent.name}`, 20, 40);
            doc.text(`Quiz: ${quizTitle || 'Quiz'}`, 20, 50);
            doc.text(`Date: ${selectedStudent.date}`, 20, 60);
            doc.text(`Score: ${selectedStudent.score}/${selectedStudent.totalQuestions} (${selectedStudent.percentage}%)`, 20, 70);

            // Réponses
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Détail des Réponses:', 20, 90);

            let y = 105;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            studentAnswers.forEach((answer: AnswerDetail, index: number) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }

                doc.text(`Q${index + 1}: ${answer.questionText.substring(0, 50)}...`, 20, y);
                y += 8;
                doc.text(`Votre réponse: ${answer.userAnswer}`, 30, y);
                y += 8;
                if (!answer.isCorrect) {
                    doc.text(`Bonne réponse: ${answer.correctAnswer}`, 30, y);
                    y += 8;
                }
                doc.text(answer.isCorrect ? '✓ Correct' : '✗ Incorrect', 30, y);
                y += 12;
            });

            // Sauvegarder
            doc.save(`resultat_${selectedStudent.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('Export PDF réussi !');

        } catch (error) {
            console.error('Erreur PDF:', error);
            toast.error('Erreur lors de l\'export PDF');
        }
    };

    // Filtrer les étudiants
    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Affichage du chargement
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-xl mb-4">Chargement des résultats...</div>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <Button
                        onClick={() => navigate('/admin')}
                        className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour à l'accueil
                    </Button>

                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-yellow-400 mb-2">
                            {quizTitle || 'Quiz de Mathématiques'}
                        </h1>
                        <p className="text-gray-300">
                            Code: {quizCode || 'MATH01'} • {metrics.totalStudents} participants
                        </p>
                    </div>

                    <Button
                        onClick={handleExportAllResults}
                        className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Exporter les Résultats
                    </Button>
                </div>

                {/* Métriques */}
                <div className="grid grid-cols-5 gap-4 mb-8">
                    <Card className="bg-yellow-400 text-gray-900">
                        <CardContent className="p-4 text-center">
                            <Users className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm font-medium">Participants</p>
                            <p className="text-2xl font-bold">{metrics.totalStudents}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-yellow-400 text-gray-900">
                        <CardContent className="p-4 text-center">
                            <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm font-medium">Moyenne</p>
                            <p className="text-2xl font-bold">{metrics.averageScore}%</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-yellow-400 text-gray-900">
                        <CardContent className="p-4 text-center">
                            <Trophy className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm font-medium">Meilleur</p>
                            <p className="text-2xl font-bold">{metrics.bestScore}%</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-yellow-400 text-gray-900">
                        <CardContent className="p-4 text-center">
                            <TrendingDown className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm font-medium">Plus Bas</p>
                            <p className="text-2xl font-bold">{metrics.lowestScore}%</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-yellow-400 text-gray-900">
                        <CardContent className="p-4 text-center">
                            <Target className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm font-medium">Taux Réussite</p>
                            <p className="text-2xl font-bold">{metrics.successRate}%</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Recherche */}
                <div className="flex justify-between items-center mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            type="text"
                            placeholder="Rechercher un étudiant..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-gray-800 border-gray-700 text-white"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button className="bg-white hover:bg-yellow-600 text-gray-900">
                            <Calendar className="w-4 h-4 mr-2" />
                            Trier par date
                        </Button>
                        <Button className="bg-white hover:bg-yellow-600 text-gray-900">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Trier par résultat
                        </Button>
                    </div>
                </div>

                {/* Contenu principal */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Liste des étudiants */}
                    <Card className="bg-gray-100 text-gray-900">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Users className="w-5 h-5 mr-2" />
                                Étudiants ({filteredStudents.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {filteredStudents.map(student => (
                                <div
                                    key={student.id}
                                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                        selectedStudent?.id === student.id
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
                                            <p className="font-bold text-gray-900">{student.percentage}%</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Résultats détaillés */}
                    <Card className="bg-gray-100 text-gray-900">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Résultats Détaillés</CardTitle>
                                {selectedStudent && studentAnswers.length > 0 && (
                                    <Button
                                        onClick={handleExportStudentResult}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-3 py-1 text-sm"
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
                                                {studentAnswers.map((answer, index) => (
                                                    <div key={index} className="p-3 border rounded-lg bg-white">
                                                        <h5 className="font-medium text-gray-900 mb-2">
                                                            Question {index + 1}: {answer.questionText}
                                                        </h5>
                                                        <div className="space-y-1">
                                                            <div className="text-sm">
                                                                <span className="font-medium">Votre réponse:</span>
                                                                <span className={`ml-2 ${
                                                                    answer.isCorrect ? 'text-green-600' : 'text-red-600'
                                                                }`}>
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
                                                Chargement des détails...
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
                                        Cliquez sur un étudiant pour voir ses résultats
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