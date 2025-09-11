import React, { useState, useEffect } from 'react';
import { 
  Edit3, 
  Upload, 
  MessageCircle, 
  Star, 
  Calendar,
  MapPin,
  Phone,
  Clock,
  Save,
  X,
  Plus,
  Camera,
  Eye,
  Reply,
  Trash2,
  Settings
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import axios from 'axios';

export const BarbershopManagement = ({ barbershop, onUpdate, BACKEND_URL }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [gallery, setGallery] = useState([]);
  
  const [formData, setFormData] = useState({
    name: barbershop?.name || '',
    description: barbershop?.description || '',
    address: barbershop?.address || '',
    phone: barbershop?.phone || '',
    services: barbershop?.services || [],
    working_hours: barbershop?.working_hours || {}
  });

  // Load reviews and gallery
  useEffect(() => {
    if (barbershop?.id) {
      loadReviews();
      loadGallery();
    }
  }, [barbershop?.id]);

  const loadReviews = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/reviews/barbershop/${barbershop.id}`);
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const loadGallery = async () => {
    try {
      // This would load gallery images - for now using placeholder
      setGallery(barbershop?.images || []);
    } catch (error) {
      console.error('Error loading gallery:', error);
    }
  };

  const handleSaveChanges = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.put(`${BACKEND_URL}/api/barbershops/${barbershop.id}`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setIsEditing(false);
      onUpdate(response.data);
      
    } catch (error) {
      console.error('Error updating barbershop:', error);
    }
  };

  const handleImageUpload = async (e, type = 'gallery') => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const token = localStorage.getItem('auth_token');
        const response = await axios.post(
          `${BACKEND_URL}/api/barbershops/${barbershop.id}/upload-image/${type}`,
          formData,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        // Refresh gallery
        loadGallery();
        
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  const addService = () => {
    setFormData({
      ...formData,
      services: [...formData.services, { name: '', price: 0, duration: 30 }]
    });
  };

  const updateService = (index, field, value) => {
    const newServices = [...formData.services];
    newServices[index] = { ...newServices[index], [field]: value };
    setFormData({ ...formData, services: newServices });
  };

  const removeService = (index) => {
    const newServices = formData.services.filter((_, i) => i !== index);
    setFormData({ ...formData, services: newServices });
  };

  const respondToReview = async (reviewId, response) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${BACKEND_URL}/api/reviews/${reviewId}/respond`, {
        response
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      loadReviews(); // Refresh reviews
      
    } catch (error) {
      console.error('Error responding to review:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <Button
          onClick={() => setIsEditing(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Edit3 className="w-4 h-4 mr-2" />
          Editar Información
        </Button>
        
        <Button
          onClick={() => setShowGallery(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Upload className="w-4 h-4 mr-2" />
          Subir Fotos
        </Button>
        
        <Button
          onClick={() => setShowReviews(true)}
          className="bg-amber-600 hover:bg-amber-700"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Ver Reseñas ({reviews.length})
        </Button>
      </div>

      {/* Barbershop Info Card */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            Mi Barbería
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-white font-semibold text-lg">{barbershop?.name}</h3>
              <p className="text-gray-400 text-sm">{barbershop?.description}</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <MapPin className="w-4 h-4" />
                {barbershop?.address}
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Phone className="w-4 h-4" />
                {barbershop?.phone}
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Star className="w-4 h-4" />
                {barbershop?.rating || 0}/5 ({reviews.length} reseñas)
              </div>
            </div>
          </div>
          
          {/* Services */}
          <div>
            <h4 className="text-white font-medium mb-2">Servicios</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {barbershop?.services?.map((service, index) => (
                <div key={index} className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-white text-sm">{service.name}</span>
                    <div className="text-right">
                      <span className="text-amber-400 font-medium">${service.price?.toLocaleString()}</span>
                      <div className="text-gray-400 text-xs">{service.duration} min</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Information Modal */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Información de la Barbería</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Nombre</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Teléfono</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Dirección</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Descripción</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                rows={3}
              />
            </div>

            {/* Services */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-white font-medium">Servicios</label>
                <Button onClick={addService} size="sm" className="bg-amber-600 hover:bg-amber-700">
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {formData.services.map((service, index) => (
                  <div key={index} className="flex gap-2 items-center bg-gray-800 p-3 rounded-lg">
                    <Input
                      placeholder="Servicio"
                      value={service.name}
                      onChange={(e) => updateService(index, 'name', e.target.value)}
                      className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                    <Input
                      type="number"
                      placeholder="Precio"
                      value={service.price}
                      onChange={(e) => updateService(index, 'price', parseInt(e.target.value) || 0)}
                      className="w-24 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                    <Input
                      type="number"
                      placeholder="Min"
                      value={service.duration}
                      onChange={(e) => updateService(index, 'duration', parseInt(e.target.value) || 0)}
                      className="w-16 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                    <Button
                      onClick={() => removeService(index)}
                      size="sm"
                      variant="outline"
                      className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveChanges} className="flex-1 bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1 text-white border-gray-600">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gallery/Photo Upload Modal */}
      <Dialog open={showGallery} onOpenChange={setShowGallery}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-white">Galería de Fotos</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Upload Section */}
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-white mb-2">Subir nuevas fotos</p>
              <p className="text-gray-400 text-sm mb-4">JPG, PNG hasta 5MB cada una</p>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageUpload(e, 'gallery')}
                className="bg-gray-800 border-gray-700 text-white file:bg-amber-600 file:text-white file:border-0 file:rounded file:px-3 file:py-1"
              />
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
              {gallery.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={`${BACKEND_URL}${image}`}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                    <Button size="sm" variant="outline" className="text-white border-gray-400">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reviews Management Modal */}
      <Dialog open={showReviews} onOpenChange={setShowReviews}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Gestión de Reseñas</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {reviews.length > 0 ? (
              reviews.map((review, index) => (
                <ReviewCard
                  key={review.id || index}
                  review={review}
                  onRespond={(response) => respondToReview(review.id, response)}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No hay reseñas aún</p>
                <p className="text-gray-500 text-sm">Las reseñas de tus clientes aparecerán aquí</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Review Card Component
const ReviewCard = ({ review, onRespond }) => {
  const [showResponse, setShowResponse] = useState(false);
  const [responseText, setResponseText] = useState('');

  const handleSubmitResponse = () => {
    if (responseText.trim()) {
      onRespond(responseText);
      setResponseText('');
      setShowResponse(false);
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-medium">{review.client_name}</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-gray-300 text-sm">{review.comment}</p>
            <p className="text-gray-500 text-xs mt-2">
              {new Date(review.created_at).toLocaleDateString('es-CL')}
            </p>
          </div>
        </div>

        {review.barber_response ? (
          <div className="bg-gray-900 p-3 rounded-lg mt-3">
            <div className="flex items-center gap-2 mb-1">
              <Reply className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">Tu respuesta:</span>
            </div>
            <p className="text-gray-300 text-sm">{review.barber_response}</p>
          </div>
        ) : (
          <div className="mt-3">
            {showResponse ? (
              <div className="space-y-2">
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button onClick={handleSubmitResponse} size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Enviar Respuesta
                  </Button>
                  <Button onClick={() => setShowResponse(false)} size="sm" variant="outline" className="text-white border-gray-600">
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowResponse(true)} size="sm" variant="outline" className="text-blue-400 border-blue-400">
                <Reply className="w-4 h-4 mr-1" />
                Responder
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};