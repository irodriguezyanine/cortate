import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  CheckCircle,
  XCircle,
  Edit3,
  Eye,
  MessageCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { RealTimeChat } from '../chat/RealTimeChat';
import axios from 'axios';

export const AppointmentManager = ({ 
  appointments, 
  onUpdate, 
  currentUser,
  BACKEND_URL 
}) => {
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('auth_token');
      const response = await axios.put(`${BACKEND_URL}/api/bookings/${appointmentId}/status`, {
        status: newStatus,
        notes: notes.trim() || undefined
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Update local state
      onUpdate();
      setShowDetails(false);
      setSelectedAppointment(null);
      setNotes('');
      
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Error al actualizar la cita. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-600';
      case 'accepted': return 'bg-blue-600';
      case 'completed': return 'bg-green-600';
      case 'cancelled': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'accepted': return 'Aceptado';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {appointments.length === 0 ? (
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400">No hay citas programadas</p>
            </CardContent>
          </Card>
        ) : (
          appointments.map((appointment) => (
            <Card 
              key={appointment.id} 
              className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer"
              onClick={() => {
                setSelectedAppointment(appointment);
                setShowDetails(true);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-medium">{appointment.service}</h3>
                      <Badge className={`${getStatusColor(appointment.status)} text-white`}>
                        {getStatusText(appointment.status)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div className="flex items-center gap-1 text-gray-300">
                        <User className="w-4 h-4" />
                        {appointment.client_name}
                      </div>
                      <div className="flex items-center gap-1 text-gray-300">
                        <Calendar className="w-4 h-4" />
                        {new Date(appointment.date).toLocaleDateString('es-CL')}
                      </div>
                      <div className="flex items-center gap-1 text-gray-300">
                        <Clock className="w-4 h-4" />
                        {formatTime(appointment.time)}
                      </div>
                      <div className="text-amber-400 font-medium">
                        ${appointment.price?.toLocaleString()}
                      </div>
                    </div>
                    
                    {appointment.notes && (
                      <p className="text-gray-400 text-sm mt-2">
                        💬 {appointment.notes}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAppointment(appointment);
                        setShowDetails(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    
                    {(appointment.status === 'accepted' || appointment.status === 'pending') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-400 border-green-400 hover:bg-green-400 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAppointment(appointment);
                          setShowChat(true);
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Chat
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Appointment Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Detalles de la Cita</DialogTitle>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-6">
              {/* Service Info */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white text-lg font-medium">{selectedAppointment.service}</h3>
                  <Badge className={`${getStatusColor(selectedAppointment.status)} text-white`}>
                    {getStatusText(selectedAppointment.status)}
                  </Badge>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Fecha y Hora</p>
                    <p className="text-white">{formatDate(selectedAppointment.date)}</p>
                    <p className="text-amber-400">{formatTime(selectedAppointment.time)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Precio</p>
                    <p className="text-white text-xl font-bold">${selectedAppointment.price?.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Client Info */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-3">Información del Cliente</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-white">{selectedAppointment.client_name}</span>
                  </div>
                  {selectedAppointment.client_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{selectedAppointment.client_email}</span>
                    </div>
                  )}
                  {selectedAppointment.client_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{selectedAppointment.client_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedAppointment.notes && (
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Notas del Cliente</h4>
                  <p className="text-gray-300">{selectedAppointment.notes}</p>
                </div>
              )}

              {/* Action Notes */}
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Notas adicionales (opcional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  placeholder="Agrega notas sobre esta cita..."
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {selectedAppointment.status === 'pending' && (
                  <>
                    <Button 
                      onClick={() => handleStatusChange(selectedAppointment.id, 'accepted')}
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Aceptar Cita
                    </Button>
                    <Button 
                      onClick={() => handleStatusChange(selectedAppointment.id, 'cancelled')}
                      disabled={loading}
                      variant="outline"
                      className="flex-1 border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </>
                )}
                
                {selectedAppointment.status === 'accepted' && (
                  <>
                    <Button 
                      onClick={() => handleStatusChange(selectedAppointment.id, 'completed')}
                      disabled={loading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marcar Completado
                    </Button>
                    <Button 
                      onClick={() => handleStatusChange(selectedAppointment.id, 'cancelled')}
                      disabled={loading}
                      variant="outline"
                      className="flex-1 border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </>
                )}
                
                {['completed', 'cancelled'].includes(selectedAppointment.status) && (
                  <Button 
                    onClick={() => setShowDetails(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700"
                  >
                    Cerrar
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Real-time Chat */}
      {showChat && selectedAppointment && (
        <RealTimeChat
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          serviceData={{
            id: selectedAppointment.id,
            service: selectedAppointment.service,
            price: selectedAppointment.price,
            type: 'traditional_booking'
          }}
          currentUser={currentUser}
          otherUser={{
            id: selectedAppointment.client_id,
            name: selectedAppointment.client_name,
            avatar: selectedAppointment.client_avatar
          }}
          BACKEND_URL={BACKEND_URL}
        />
      )}
    </div>
  );
};