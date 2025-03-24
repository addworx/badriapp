import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image, MessageCircle, RefreshCw, AlertTriangle, Settings, LogOut, Lock, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

// Mock API functions (replace with actual API calls)
const mockLogin = async (username: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (username === 'user' && password === 'password') {
        return { success: true, token: 'mock-token' };
    } else {
        throw new Error('Invalid credentials');
    }
};

const mockChat = async (message: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return `Echo: ${message}`;
};

const mockGenerateImage = async (prompt: string, model: string, aspectRatio: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Simulate different results based on prompt
    if (prompt.toLowerCase().includes('error')) {
        throw new Error('Failed to generate image. Try a different prompt.');
    }
    if (prompt.toLowerCase().includes('empty')) {
        return ''; // Simulate empty response
    }

    // Placeholder image URL with dynamic parameters
    const width = parseInt(aspectRatio.split(':')[0]) * 100;
    const height = parseInt(aspectRatio.split(':')[1]) * 100;
    return `https://placehold.co/${width}x${height}/${Math.random().toString(16).slice(2, 8)}/FFF?text=${encodeURIComponent(prompt + ' | ' + model + ' | ' + aspectRatio)}`;
};

// ===============================
// Components
// ===============================

// Chat Message Component
const ChatMessage = ({ message, isUser }: { message: string; isUser: boolean }) => (
    <motion.div
        initial={{ opacity: 0, x: isUser ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: isUser ? -20 : 20 }}
        className={cn(
            'flex mb-4',
            isUser ? 'justify-end' : 'justify-start'
        )}
    >
        <div
            className={cn(
                'rounded-xl px-4 py-2 max-w-[70%] sm:max-w-[50%]',
                isUser
                    ? 'bg-blue-500/90 text-white ml-auto shadow-md'
                    : 'bg-gray-200/90 text-gray-800 mr-auto shadow-md',
                'backdrop-blur-md'
            )}
        >
            {message}
        </div>
    </motion.div>
);

// Image Display Component
const GeneratedImage = ({ src, prompt, onRegenerate, isLoading }: { src: string; prompt: string, onRegenerate: () => void, isLoading: boolean }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="mb-6 border rounded-xl overflow-hidden shadow-lg bg-white/5 backdrop-blur-md"
    >
        {isLoading ? (
            <div className="flex items-center justify-center h-[300px] bg-gray-100/5">
                <RefreshCw className="animate-spin h-8 w-8 text-gray-400" />
            </div>
        ) : src ? (
            <>
                <img src={src} alt={prompt} className="w-full h-auto" />
                <div className="p-4 flex justify-between items-center">
                    <p className="text-sm text-gray-300">Prompt: {prompt}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRegenerate}
                        disabled={isLoading}
                        className="bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border-gray-700/50"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerate
                    </Button>
                </div>
            </>
        ) : (
            <div className="flex items-center justify-center h-[300px] bg-gray-100/5 text-gray-400">
                No image generated.
            </div>
        )}
    </motion.div>
);

// Main App Component
const BadriApp = () => {
    // ===============================
    // State
    // ===============================
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [chatMessages, setChatMessages] = useState<string[]>([]);
    const [currentChatMessage, setCurrentChatMessage] = useState('');
    const [imagePrompt, setImagePrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedModel, setSelectedModel] = useState('Model A');
    const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
    const [user, setUser] = useState<{ name: string; token: string } | null>(null);
    const { setTheme } = useTheme();
    const [isDarkMode, setIsDarkMode] = useState(true);

    // ===============================
    // Refs
    // ===============================
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // ===============================
    // Effects
    // ===============================

    // Scroll to bottom of chat on new message
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

    // Check for saved session on initial load and set dark mode
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
                setIsLoggedIn(true);
            } catch (error) {
                console.error("Error parsing user data:", error);
                localStorage.removeItem('user');
            }
        }
        setTheme('dark'); // Force dark mode
        setIsDarkMode(true); // Ensure state reflects dark mode
    }, [setTheme]);


    // ===============================
    // Handlers
    // ===============================

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            setError('Please enter username and password.');
            return;
        }
        try {
            const response = await mockLogin(username, password);
            if (response.success) {
                setUser({ name: username, token: response.token });
                localStorage.setItem('user', JSON.stringify({ name: username, token: response.token }));
                setIsLoggedIn(true);
                setError('');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUsername('');
            setPassword('');
        }
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setChatMessages([]);
        setGeneratedImage('');
    };

    const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentChatMessage(e.target.value);
        setError('');
    };

    const handleImagePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setImagePrompt(e.target.value);
        setError('');
    };

    const handleChatSubmit = async () => {
        if (!currentChatMessage.trim()) {
            setError('Please enter a message.');
            return;
        }
        try {
            setIsChatLoading(true);
            setChatMessages(prev => [...prev, `You: ${currentChatMessage}`]);
            setCurrentChatMessage('');
            const response = await mockChat(currentChatMessage);
            setChatMessages(prev => [...prev, `Bot: ${response}`]);
            setError('');
        } catch (err: any) {
            setError(`Error sending chat message: ${err.message}`);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleImageGenerate = async () => {
        if (!imagePrompt.trim()) {
            setError('Please enter an image prompt.');
            return;
        }
        try {
            setIsImageLoading(true);
            setGeneratedImage('');
            const imageUrl = await mockGenerateImage(imagePrompt, selectedModel, selectedAspectRatio);
            if (imageUrl) {
                setGeneratedImage(imageUrl);
            } else {
                setError('Image generation failed: Empty response.');
            }
            setError('');
        } catch (err: any) {
            setError(`Error generating image: ${err.message}`);
            setGeneratedImage('');
        } finally {
            setIsImageLoading(false);
        }
    };

    const handleRegenerateImage = async () => {
        await handleImageGenerate();
    };


    // ===============================
    // Render
    // ===============================
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-gray-800/50 p-8 rounded-xl shadow-lg border border-gray-700/50 backdrop-blur-md"
                >
                    <h2 className="text-2xl font-bold mb-6 text-center flex items-center justify-center">
                        <Lock className="mr-2 h-6 w-6 text-blue-400" />
                        Login
                    </h2>
                    <Input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="mb-4 bg-gray-700/50 text-white border-gray-700/50"
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mb-6 bg-gray-700/50 text-white border-gray-700/50"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleLogin();
                            }
                        }}
                    />
                    <Button
                        onClick={handleLogin}
                        className="w-full bg-blue-500/90 hover:bg-blue-600/90 text-white font-bold py-2 px-4 rounded shadow-md"
                    >
                        Login
                    </Button>
                    {error && (
                        <div className="bg-red-500/10 border border-red-400 text-red-400 px-4 py-3 rounded-xl relative mt-4 backdrop-blur-md" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                            <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
                                <AlertTriangle className="h-6 w-6 fill-current text-red-300" />
                            </span>
                        </div>
                    )}
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-400 to-green-400 text-transparent bg-clip-text">
                        Badri&apos;s n8n Interface
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-300">Welcome, {user?.name || 'Guest'}</span>
                        {user && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleLogout}
                                className="bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border-gray-700/50"

                            >
                                <LogOut className="h-5 w-5" />
                            </Button>
                        )}
                    </div>
                </div>

                <Tabs defaultValue="chat" className="w-full">
                    <TabsList className="mb-4 bg-gray-800/50 border-b border-gray-700/50">
                        <TabsTrigger
                            value="chat"
                            className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-blue-500/50 data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-transform"
                        >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Chat
                        </TabsTrigger>
                        <TabsTrigger
                            value="image"
                            className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-purple-500/50 data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-transform"
                        >
                            <Image className="mr-2 h-4 w-4" />
                            Image Generator
                        </TabsTrigger>
                        <TabsTrigger
                            value="settings"
                            className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-500/50 data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-transform"
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </TabsTrigger>
                    </TabsList>

                    {/* Chat Section */}
                    <TabsContent value="chat">
                        <div className="bg-gray-800/50 p-6 rounded-xl shadow-md border border-gray-700/50">
                            <div
                                ref={chatContainerRef}
                                className="h-64 overflow-y-auto mb-4 p-2 rounded-md"
                            >
                                <AnimatePresence>
                                    {chatMessages.map((message, index) => (
                                        <ChatMessage
                                            key={index}
                                            message={message.substring(message.indexOf(':') + 2)}
                                            isUser={message.startsWith('You:')}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                            <div className="flex items-center">
                                <Input
                                    type="text"
                                    placeholder="Type your message..."
                                    value={currentChatMessage}
                                    onChange={handleChatInputChange}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleChatSubmit();
                                        }
                                    }}
                                    className="mr-2 bg-gray-700/50 text-white border-gray-700/50"
                                    disabled={isChatLoading}
                                />
                                <Button
                                    onClick={handleChatSubmit}
                                    disabled={isChatLoading}
                                    className="bg-blue-500/90 hover:bg-blue-600/90 text-white font-bold py-2 px-4 rounded shadow-md hover:scale-105 transition-transform"
                                >
                                    {isChatLoading ? (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Send
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Image Generation Section */}
                    <TabsContent value="image">
                        <div className="bg-gray-800/50 p-6 rounded-xl shadow-md border border-gray-700/50">
                            <div className="mb-4">
                                <label htmlFor="model-select" className="block text-sm font-medium text-gray-300 mb-1">Model</label>
                                <Select
                                    onValueChange={setSelectedModel}
                                    defaultValue={selectedModel}
                                >
                                    <SelectTrigger className="w-full bg-gray-700/50 text-white border-gray-700/50">
                                        <SelectValue placeholder="Select a model" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700/50">
                                        <SelectItem value="Model A" className="hover:bg-gray-700/50 text-white">Model A</SelectItem>
                                        <SelectItem value="Model B" className="hover:bg-gray-700/50 text-white">Model B</SelectItem>
                                        <SelectItem value="Model C" className="hover:bg-gray-700/50 text-white">Model C</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="mb-4">
                                <label htmlFor="aspect-ratio-select" className="block text-sm font-medium text-gray-300 mb-1">Aspect Ratio</label>
                                <Select
                                    onValueChange={setSelectedAspectRatio}
                                    defaultValue={selectedAspectRatio}
                                >
                                    <SelectTrigger className="w-full bg-gray-700/50 text-white border-gray-700/50">
                                        <SelectValue placeholder="Select aspect ratio" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700/50">
                                        <SelectItem value="1:1" className="hover:bg-gray-700/50 text-white">1:1</SelectItem>
                                        <SelectItem value="4:3" className="hover:bg-gray-700/50 text-white">4:3</SelectItem>
                                        <SelectItem value="16:9" className="hover:bg-gray-700/50 text-white">16:9</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Input
                                type="text"
                                placeholder="Enter prompt to generate image..."
                                value={imagePrompt}
                                onChange={handleImagePromptChange}
                                className="mb-4 bg-gray-700/50 text-white border-gray-700/50"
                                disabled={isImageLoading}
                            />
                            <Button
                                onClick={handleImageGenerate}
                                disabled={isImageLoading}
                                className="bg-purple-500/90 hover:bg-purple-600/90 text-white font-bold py-2 px-4 rounded shadow-md hover:scale-105 transition-transform"
                            >
                                {isImageLoading ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Image className="mr-2 h-4 w-4" />
                                        Generate Image
                                    </>
                                )}
                            </Button>
                            <AnimatePresence>
                                {generatedImage && (
                                    <GeneratedImage
                                        src={generatedImage}
                                        prompt={imagePrompt}
                                        onRegenerate={handleRegenerateImage}
                                        isLoading={isImageLoading}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    </TabsContent>

                    {/* Settings Section */}
                    <TabsContent value="settings">
                        <div className="bg-gray-800/50 p-6 rounded-xl shadow-md border border-gray-700/50">
                            <h3 className="text-lg font-semibold mb-4">Application Settings</h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-1">Theme</label>
                                <div className="w-full bg-gray-700/50 text-white border-gray-700/50 flex items-center justify-start rounded-md py-2 px-4">
                                    <Moon className="mr-2 h-4 w-4" /> Dark Mode (Forced)
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleLogout}
                                className="bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border-gray-700/50 mt-4 w-full flex items-center justify-start hover:scale-105 transition-transform"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </Button>
                            {/* Add more settings here */}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-400 text-red-400 px-4 py-3 rounded-xl relative mt-4 backdrop-blur-md" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                        <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
                            <AlertTriangle className="h-6 w-6 fill-current text-red-300" />
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BadriApp;
