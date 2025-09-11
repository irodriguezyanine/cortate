import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  Phone, 
  Video, 
  Paperclip,
  Smile,
  X,
  Minimize2,
  Maximize2,
  Circle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import axios from 'axios';

export const RealTimeChat = ({ 
  isOpen, 
  onClose, 
  serviceData, 
  currentUser, 
  otherUser,
  BACKEND_URL 
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize WebSocket connection for real-time messaging
  useEffect(() => {
    if (isOpen && serviceData?.id) {
      initializeWebSocket();
      loadChatHistory();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isOpen, serviceData?.id]);

  const initializeWebSocket = () => {
    try {
      // In a real implementation, you'd use WebSocket
      // For now, we'll simulate with polling
      const intervalId = setInterval(() => {
        // Simulate receiving messages
        checkForNewMessages();
      }, 2000);

      return () => clearInterval(intervalId);
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
    }
  };

  const loadChatHistory = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${BACKEND_URL}/api/chat/${serviceData.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const checkForNewMessages = async () => {
    // Simulate checking for new messages
    // In a real app, this would be handled by WebSocket
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    const messageData = {
      id: Date.now().toString(),
      service_id: serviceData.id,
      sender_id: currentUser.id,
      sender_name: currentUser.name,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    try {
      setLoading(true);
      
      // Add message to local state immediately
      setMessages(prev => [...prev, messageData]);
      setNewMessage('');

      // Send to backend
      const token = localStorage.getItem('auth_token');
      await axios.post(`${BACKEND_URL}/api/chat/send`, messageData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      console.error('Error sending message:', error);
      // Remove message from local state if failed
      setMessages(prev => prev.filter(msg => msg.id !== messageData.id));
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-CL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[500px]'
    }`}>
      <Card className="bg-gray-900 border-gray-700 h-full flex flex-col">
        {/* Chat Header */}
        <CardHeader className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={otherUser?.avatar} alt={otherUser?.name} />
                <AvatarFallback>{otherUser?.name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-white text-sm">{otherUser?.name}</CardTitle>
                <div className="flex items-center gap-1">
                  <Circle className={`w-2 h-2 ${isOnline ? 'fill-green-400 text-green-400' : 'fill-gray-400 text-gray-400'}`} />
                  <span className="text-xs text-gray-400">
                    {isOnline ? 'En línea' : 'Desconectado'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-gray-400 hover:text-white p-1"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onClose}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Service Info */}
          <div className="bg-gray-800 p-2 rounded-lg mt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">{serviceData?.service}</p>
                <p className="text-amber-400 text-xs">${serviceData?.price?.toLocaleString()}</p>
              </div>
              <Badge variant="outline" className="text-green-400 border-green-400">
                {serviceData?.type === 'quick_cut' ? '⚡ Corte Rápido' : '📅 Reserva'}
              </Badge>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <CardContent className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-sm">Inicia la conversación</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Los mensajes son privados y seguros
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg ${
                          message.sender_id === currentUser.id
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-700 text-white'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-700 px-3 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </CardContent>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-700">
              <form onSubmit={sendMessage} className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="bg-gray-800 border-gray-600 text-white pr-20"
                    disabled={loading}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="ghost" 
                      className="p-1 h-auto text-gray-400 hover:text-white"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="ghost" 
                      className="p-1 h-auto text-gray-400 hover:text-white"
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={!newMessage.trim() || loading}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};