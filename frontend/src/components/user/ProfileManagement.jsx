import React, { useState, useRef } from 'react';
import { 
  User, 
  Camera, 
  Upload, 
  Save, 
  Edit3,
  Mail,
  Phone,
  MapPin,
  Globe,
  X,
  Check
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useLanguage, LANGUAGES } from '../../hooks/useLanguage';
import axios from 'axios';

export const ProfileManagement = ({ user, onUpdate, BACKEND_URL }) => {
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    bio: user?.bio || ''
  });

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('La imagen debe ser menor a 5MB');
        return;
      }
      
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      setShowAvatarModal(true);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(`${BACKEND_URL}/api/user/avatar`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      onUpdate({ ...user, avatar: response.data.avatar_url });
      setShowAvatarModal(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error al subir la imagen. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('auth_token');
      const response = await axios.put(`${BACKEND_URL}/api/user/profile`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      onUpdate({ ...user, ...formData });
      setIsEditing(false);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error al actualizar el perfil. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="text-center">
          <div className="relative inline-block">
            <Avatar className="w-24 h-24 mx-auto">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="bg-amber-600 text-white text-2xl">
                {user?.name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              className="absolute -bottom-2 -right-2 rounded-full bg-amber-600 hover:bg-amber-700 w-8 h-8 p-0"
            >
              <Camera className="w-4 h-4" />
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
            />
          </div>
          
          <CardTitle className="text-white text-xl mt-4">{user?.name}</CardTitle>
          <p className="text-gray-400">{user?.user_type === 'barber' ? 'Barbero Profesional' : 'Cliente'}</p>
          
          {/* Language Selector */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <Globe className="w-4 h-4 text-gray-400" />
            <Select value={currentLanguage} onValueChange={changeLanguage}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {Object.values(LANGUAGES).map((lang) => (
                  <SelectItem 
                    key={lang.code} 
                    value={lang.code}
                    className="text-white hover:bg-gray-700"
                  >
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Information */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">{t('common.profile_info', 'Información del Perfil')}</CardTitle>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="outline"
              size="sm"
              className="text-white border-gray-600"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              {isEditing ? t('common.cancel') : t('common.edit')}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                <User className="w-4 h-4 inline mr-2" />
                {t('auth.full_name')}
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                disabled={!isEditing}
              />
            </div>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                <Mail className="w-4 h-4 inline mr-2" />
                {t('auth.email')}
              </label>
              <Input
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                disabled={!isEditing}
                type="email"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                <Phone className="w-4 h-4 inline mr-2" />
                {t('barbershop.phone')}
              </label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                disabled={!isEditing}
                placeholder="+56 9 xxxx xxxx"
              />
            </div>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                <MapPin className="w-4 h-4 inline mr-2" />
                {t('barbershop.address')}
              </label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                disabled={!isEditing}
                placeholder="Tu dirección"
              />
            </div>
          </div>
          
          {user?.user_type === 'barber' && (
            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Biografía Profesional
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded-md p-3 min-h-[80px]"
                disabled={!isEditing}
                placeholder="Cuéntanos sobre tu experiencia como barbero..."
              />
            </div>
          )}
          
          {isEditing && (
            <div className="flex gap-2">
              <Button 
                onClick={handleSaveProfile}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? t('common.loading') : t('common.save')}
              </Button>
              <Button 
                onClick={() => setIsEditing(false)}
                variant="outline"
                className="flex-1 text-white border-gray-600"
              >
                {t('common.cancel')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Avatar Upload Modal */}
      <Dialog open={showAvatarModal} onOpenChange={setShowAvatarModal}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Actualizar Foto de Perfil</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {avatarPreview && (
              <div className="text-center">
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-amber-600"
                />
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={handleAvatarUpload}
                disabled={loading || !avatarFile}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                {loading ? 'Subiendo...' : 'Subir Foto'}
              </Button>
              <Button 
                onClick={() => {
                  setShowAvatarModal(false);
                  setAvatarFile(null);
                  setAvatarPreview(null);
                }}
                variant="outline"
                className="flex-1 text-white border-gray-600"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
            
            <p className="text-xs text-gray-400 text-center">
              Formatos soportados: JPG, PNG. Máximo 5MB.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};