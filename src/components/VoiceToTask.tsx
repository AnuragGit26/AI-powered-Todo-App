import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Mic, MicOff, Waveform, Crown, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useBillingStore } from '../store/billingStore';
import { toast } from 'react-hot-toast';

interface VoiceToTaskProps {
    onTaskCreate?: (task: { title: string; description: string; priority: string; estimatedTime: string }) => void;
}

const VoiceToTask: React.FC<VoiceToTaskProps> = ({ onTaskCreate }) => {
    const { subscription, checkUsageLimits } = useBillingStore();
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [analyzedTask, setAnalyzedTask] = useState<any>(null);
    const [audioLevel, setAudioLevel] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recognitionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number>();

    // Check if feature is available
    const isFeatureAvailable = subscription?.limits.voiceToTask || false;

    useEffect(() => {
        // Initialize Speech Recognition if available
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const results = Array.from(event.results);
                const transcript = results
                    .map((result: any) => result[0].transcript)
                    .join('');
                setTranscript(transcript);
            };

            recognitionRef.current.onerror = () => {
                setIsRecording(false);
                toast.error('Voice recognition error');
            };
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    const startRecording = async () => {
        if (!isFeatureAvailable) {
            toast.error('Voice-to-Task is a Premium feature. Upgrade to unlock!');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Set up audio analysis
            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 256;

            // Start recording
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.start();

            // Start speech recognition
            if (recognitionRef.current) {
                recognitionRef.current.start();
            }

            setIsRecording(true);
            setTranscript('');
            setAnalyzedTask(null);

            // Start audio level monitoring
            monitorAudioLevel();

            toast.success('Recording started! Speak your task...');
        } catch (error) {
            toast.error('Failed to access microphone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();

            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }

            if (audioContextRef.current) {
                audioContextRef.current.close();
            }

            setIsRecording(false);
            setAudioLevel(0);

            if (transcript.trim()) {
                processVoiceToTask(transcript);
            } else {
                toast.error('No speech detected. Please try again.');
            }
        }
    };

    const monitorAudioLevel = () => {
        if (analyserRef.current) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);

            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioLevel(average / 255 * 100);

            animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
        }
    };

    const processVoiceToTask = async (voiceInput: string) => {
        setIsProcessing(true);

        try {
            // Simulate AI processing (in real app, this would call an AI service)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mock AI analysis
            const analysisResult = analyzeVoiceInput(voiceInput);
            setAnalyzedTask(analysisResult);

            toast.success('Voice converted to task successfully!');
        } catch (error) {
            toast.error('Failed to process voice input');
        } finally {
            setIsProcessing(false);
        }
    };

    const analyzeVoiceInput = (input: string) => {
        // Mock AI analysis - in real app this would use OpenAI/Gemini API
        const words = input.toLowerCase();

        let priority = 'medium';
        if (words.includes('urgent') || words.includes('asap') || words.includes('immediately')) {
            priority = 'high';
        } else if (words.includes('later') || words.includes('when possible') || words.includes('low priority')) {
            priority = 'low';
        }

        let estimatedTime = '30 minutes';
        if (words.includes('quick') || words.includes('short')) {
            estimatedTime = '15 minutes';
        } else if (words.includes('long') || words.includes('detailed') || words.includes('complex')) {
            estimatedTime = '2 hours';
        }

        // Extract task title (simplified)
        const title = input.split('.')[0] || input.substring(0, 50) + '...';

        return {
            title: title.trim(),
            description: input,
            priority,
            estimatedTime,
            category: 'Work', // Could be enhanced with AI categorization
            suggestedSubtasks: [
                'Research requirements',
                'Plan approach',
                'Execute task',
                'Review and finalize'
            ]
        };
    };

    const createTaskFromVoice = () => {
        if (analyzedTask && onTaskCreate) {
            onTaskCreate(analyzedTask);
            setTranscript('');
            setAnalyzedTask(null);
            toast.success('Task created successfully!');
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
                            <Mic className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                Voice-to-Task AI
                                <Crown className="h-4 w-4 text-yellow-500" />
                            </CardTitle>
                            <CardDescription>
                                Convert speech to intelligent tasks with AI analysis
                            </CardDescription>
                        </div>
                    </div>
                    {!isFeatureAvailable && (
                        <Badge variant="secondary">Premium Feature</Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {!isFeatureAvailable && (
                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Crown className="h-5 w-5 text-yellow-600" />
                            <div>
                                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                                    Premium Feature
                                </p>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                    Upgrade to Premium to unlock Voice-to-Task AI conversion
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recording Interface */}
                <div className="text-center space-y-4">
                    <AnimatePresence mode="wait">
                        {isRecording ? (
                            <motion.div
                                key="recording"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="space-y-4"
                            >
                                <div className="relative">
                                    <motion.div
                                        className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center"
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    >
                                        <Waveform className="h-8 w-8 text-white" />
                                    </motion.div>

                                    {/* Audio Level Visualization */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-32 h-32 rounded-full border-4 border-red-500/30">
                                            <div
                                                className="w-full h-full rounded-full border-4 border-red-500 transition-all duration-100"
                                                style={{
                                                    transform: `scale(${1 + (audioLevel / 100) * 0.3})`,
                                                    opacity: 0.6 + (audioLevel / 100) * 0.4
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <p className="text-lg font-medium text-red-600">Recording...</p>
                                <p className="text-sm text-gray-500">Speak your task clearly</p>

                                <Button
                                    onClick={stopRecording}
                                    variant="destructive"
                                    size="lg"
                                >
                                    <MicOff className="h-5 w-5 mr-2" />
                                    Stop Recording
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="space-y-4"
                            >
                                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                    <Mic className="h-8 w-8 text-white" />
                                </div>

                                <p className="text-lg font-medium">Ready to Record</p>
                                <p className="text-sm text-gray-500">
                                    Click to start recording your task
                                </p>

                                <Button
                                    onClick={startRecording}
                                    disabled={!isFeatureAvailable || isProcessing}
                                    size="lg"
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                                >
                                    <Mic className="h-5 w-5 mr-2" />
                                    Start Recording
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Transcript Display */}
                {transcript && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                    >
                        <h4 className="font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Transcript
                        </h4>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm">{transcript}</p>
                        </div>
                    </motion.div>
                )}

                {/* Processing State */}
                {isProcessing && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-3"
                    >
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                        <p className="text-sm text-gray-600">AI is analyzing your voice input...</p>
                    </motion.div>
                )}

                {/* Analyzed Task Display */}
                {analyzedTask && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <h4 className="font-medium flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            AI Analysis Complete
                        </h4>

                        <div className="space-y-3 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Task Title</label>
                                <p className="font-medium">{analyzedTask.title}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                                    <Badge variant={analyzedTask.priority === 'high' ? 'destructive' : 'default'}>
                                        {analyzedTask.priority}
                                    </Badge>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Time</label>
                                    <p className="text-sm">{analyzedTask.estimatedTime}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{analyzedTask.description}</p>
                            </div>

                            <Button
                                onClick={createTaskFromVoice}
                                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Create Task
                            </Button>
                        </div>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
};

export default VoiceToTask; 