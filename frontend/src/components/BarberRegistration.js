import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, Minus, Clock, DollarSign } from 'lucide-react';

const BarberRegistration = ({ onComplete, user, backend_url }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    services: [{ name: 'Corte de pelo', price: 12000, duration: 30 }],
    working_hours: {
      monday: { open: '09:00', close: '18:00', isOpen: true },
      tuesday: { open: '09:00', close: '18:00', isOpen: true },
      wednesday: { open: '09:00', close: '18:00', isOpen: true },
      thursday: { open: '09:00', close: '18:00', isOpen: true },
      friday: { open: '09:00', close: '18:00', isOpen: true },
      saturday: { open: '09:00', close: '16:00', isOpen: true },
      sunday: { open: '10:00', close: '15:00', isOpen: false }
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addService = () => {
    setFormData({
      ...formData,
      services: [...formData.services, { name: '', price: 0, duration: 30 }]
    });
  };

  const removeService = (index) => {
    const newServices = formData.services.filter((_, i) => i !== index);
    setFormData({ ...formData, services: newServices });
  };

  const updateService = (index, field, value) => {
    const newServices = [...formData.services];
    newServices[index] = { ...newServices[index], [field]: value };
    setFormData({ ...formData, services: newServices });
  };

  const updateWorkingHours = (day, field, value) => {
    setFormData({
      ...formData,
      working_hours: {
        ...formData.working_hours,
        [day]: { ...formData.working_hours[day], [field]: value }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${backend_url}/api/barbershops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const barbershop = await response.json();
        onComplete(barbershop);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Error al crear la barbería');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const days = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-2xl">Registra tu Barbería</CardTitle>
          <p className="text-gray-400">
            Completa la información para que los clientes puedan encontrarte
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Nombre de la barbería *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Barbería El Maestro"
                  required
                />
              </div>
              
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Teléfono *
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="+56 9 1234 5678"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Dirección completa *
              </label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Av. Providencia 1234, Providencia, Santiago"
                required
              />
              <p className="text-gray-500 text-xs mt-1">
                Esta dirección se usará para mostrar tu barbería en el mapa
              </p>
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Descripción de tu barbería
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                placeholder="Describe tu barbería, especialidades, años de experiencia..."
              />
            </div>

            {/* Services */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-semibold">Servicios</h3>
                <Button
                  type="button"
                  onClick={addService}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar Servicio
                </Button>
              </div>
              
              <div className="space-y-3">
                {formData.services.map((service, index) => (
                  <div key={index} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="grid md:grid-cols-4 gap-3 items-end">
                      <div className="md:col-span-2">
                        <label className="text-white text-sm mb-1 block">Servicio</label>
                        <Input
                          value={service.name}
                          onChange={(e) => updateService(index, 'name', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="Ej: Corte + barba"
                        />
                      </div>
                      
                      <div>
                        <label className="text-white text-sm mb-1 block flex items-center">
                          <DollarSign className="w-3 h-3 mr-1" />
                          Precio (CLP)
                        </label>
                        <Input
                          type="number"
                          value={service.price}
                          onChange={(e) => updateService(index, 'price', parseInt(e.target.value))}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="12000"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-white text-sm mb-1 block flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Duración (min)
                          </label>
                          <Input
                            type="number"
                            value={service.duration}
                            onChange={(e) => updateService(index, 'duration', parseInt(e.target.value))}
                            className="bg-gray-700 border-gray-600 text-white"
                            placeholder="30"
                          />
                        </div>
                        
                        {formData.services.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeService(index)}
                            size="sm"
                            variant="outline"
                            className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Working Hours */}
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Horarios de Atención</h3>
              <div className="space-y-3">
                {days.map(({ key, label }) => (
                  <div key={key} className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className="w-20">
                        <label className="flex items-center text-white text-sm">
                          <input
                            type="checkbox"
                            checked={formData.working_hours[key].isOpen}
                            onChange={(e) => updateWorkingHours(key, 'isOpen', e.target.checked)}
                            className="mr-2"
                          />
                          {label}
                        </label>
                      </div>
                      
                      {formData.working_hours[key].isOpen && (
                        <>
                          <div>
                            <label className="text-gray-400 text-xs">Apertura</label>
                            <Input
                              type="time"
                              value={formData.working_hours[key].open}
                              onChange={(e) => updateWorkingHours(key, 'open', e.target.value)}
                              className="bg-gray-700 border-gray-600 text-white w-32"
                            />
                          </div>
                          
                          <div>
                            <label className="text-gray-400 text-xs">Cierre</label>
                            <Input
                              type="time"
                              value={formData.working_hours[key].close}
                              onChange={(e) => updateWorkingHours(key, 'close', e.target.value)}
                              className="bg-gray-700 border-gray-600 text-white w-32"
                            />
                          </div>
                        </>
                      )}
                      
                      {!formData.working_hours[key].isOpen && (
                        <span className="text-gray-500 text-sm">Cerrado</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-400 p-3 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3"
            >
              {loading ? 'Creando barbería...' : 'Registrar Mi Barbería'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BarberRegistration;