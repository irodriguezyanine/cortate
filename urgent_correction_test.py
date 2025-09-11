#!/usr/bin/env python3
"""
URGENT CORRECTION TEST - CÓRTATE.CL
Restore BARBERIA CANTAGALLO and clean fake barbershops
"""

import requests
import json
from datetime import datetime

class UrgentCorrectionTester:
    def __init__(self, base_url="https://quickcut-app.preview.emergentagent.com"):
        self.base_url = base_url
        self.barber_token = None
        
    def authenticate_as_barber(self):
        """Create a barber account for cleanup operations"""
        timestamp = datetime.now().strftime('%H%M%S')
        barber_email = f"cleanup_barber{timestamp}@test.com"
        
        # Register barber
        response = requests.post(f"{self.base_url}/api/auth/register", json={
            "name": "Cleanup Barber",
            "email": barber_email,
            "password": "CleanupPass123!",
            "confirmPassword": "CleanupPass123!",
            "userType": "barber",
            "phone": "+56987654321",
            "address": "Santiago, Chile"
        })
        
        if response.status_code == 200:
            data = response.json()
            self.barber_token = data['access_token']
            print(f"✅ Authenticated as cleanup barber")
            return True
        else:
            print(f"❌ Failed to authenticate: {response.status_code}")
            return False
    
    def get_current_barbershops(self):
        """Get current barbershops state"""
        response = requests.get(f"{self.base_url}/api/barbershops")
        if response.status_code == 200:
            return response.json().get('barbershops', [])
        return []
    
    def create_barberia_cantagallo(self):
        """Create BARBERIA CANTAGALLO"""
        if not self.barber_token:
            print("❌ No barber token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.barber_token}'}
        
        response = requests.post(f"{self.base_url}/api/barbershops", 
            headers=headers,
            json={
                "name": "BARBERIA CANTAGALLO",
                "description": "Barbería tradicional en Santiago, especializada en cortes clásicos y modernos",
                "address": "Av. Libertador Bernardo O'Higgins 1234, Santiago, Chile",
                "phone": "+56912345678",
                "services": [
                    {"name": "Corte de pelo", "price": 15000, "duration": 30},
                    {"name": "Barba", "price": 10000, "duration": 20},
                    {"name": "Corte completo", "price": 22000, "duration": 45}
                ],
                "working_hours": {
                    "monday": {"open": "09:00", "close": "19:00"},
                    "tuesday": {"open": "09:00", "close": "19:00"},
                    "wednesday": {"open": "09:00", "close": "19:00"},
                    "thursday": {"open": "09:00", "close": "19:00"},
                    "friday": {"open": "09:00", "close": "19:00"},
                    "saturday": {"open": "09:00", "close": "18:00"},
                    "sunday": {"open": "10:00", "close": "16:00"}
                }
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ BARBERIA CANTAGALLO created successfully")
            print(f"   ID: {data.get('id')}")
            return True
        else:
            print(f"❌ Failed to create BARBERIA CANTAGALLO: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    
    def delete_barbershop(self, barbershop_id, name):
        """Delete a specific barbershop"""
        if not self.barber_token:
            print("❌ No barber token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.barber_token}'}
        
        response = requests.delete(f"{self.base_url}/api/barbershops/{barbershop_id}", 
                                 headers=headers)
        
        if response.status_code == 200:
            print(f"✅ Deleted: {name}")
            return True
        else:
            print(f"❌ Failed to delete {name}: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    
    def run_urgent_correction(self):
        """Execute the urgent correction"""
        print("🚨 URGENT BARBERSHOP CORRECTION - CÓRTATE.CL")
        print("=" * 60)
        print("OBJETIVO: Restaurar BARBERIA CANTAGALLO y mantener solo barberías legítimas")
        print("-" * 60)
        
        # Step 1: Authenticate
        if not self.authenticate_as_barber():
            return False
        
        # Step 2: Check current state
        print("\n1️⃣ VERIFICANDO ESTADO ACTUAL")
        current_barbershops = self.get_current_barbershops()
        print(f"   📊 Barberías actuales: {len(current_barbershops)}")
        
        barberia_dani_exists = False
        barberia_cantagallo_exists = False
        fake_barbershops_to_delete = []
        
        for bs in current_barbershops:
            name = bs.get('name', '')
            print(f"   - {name}")
            
            if 'Barbería Dani' in name:
                barberia_dani_exists = True
                print("     ✅ Barbería Dani (MANTENER)")
            elif 'BARBERIA CANTAGALLO' in name.upper():
                barberia_cantagallo_exists = True
                print("     ✅ BARBERIA CANTAGALLO (MANTENER)")
            else:
                # These are the fake ones to delete according to user request
                fake_names = [
                    'Barbershop Classic',
                    'Barbería El Maestro', 
                    'Barbería Santiago Maps Test'
                ]
                
                if any(fake_name.lower() in name.lower() for fake_name in fake_names):
                    fake_barbershops_to_delete.append(bs)
                    print(f"     🚨 ELIMINAR (barbería falsa)")
                else:
                    print(f"     ❓ No clasificada")
        
        # Step 3: Create BARBERIA CANTAGALLO if missing
        if not barberia_cantagallo_exists:
            print("\n2️⃣ RESTAURANDO BARBERIA CANTAGALLO")
            if not self.create_barberia_cantagallo():
                return False
        else:
            print("\n2️⃣ BARBERIA CANTAGALLO YA EXISTE")
            print("   ✅ No es necesario restaurar")
        
        # Step 4: Delete fake barbershops
        if fake_barbershops_to_delete:
            print(f"\n3️⃣ ELIMINANDO {len(fake_barbershops_to_delete)} BARBERÍAS FALSAS")
            deleted_count = 0
            
            for bs in fake_barbershops_to_delete:
                if self.delete_barbershop(bs.get('id'), bs.get('name')):
                    deleted_count += 1
            
            print(f"   📊 Eliminadas: {deleted_count}/{len(fake_barbershops_to_delete)}")
        else:
            print("\n3️⃣ NO HAY BARBERÍAS FALSAS PARA ELIMINAR")
        
        # Step 5: Verify final result
        print("\n4️⃣ VERIFICANDO RESULTADO FINAL")
        final_barbershops = self.get_current_barbershops()
        print(f"   📊 Barberías finales: {len(final_barbershops)}")
        
        barberia_dani_final = False
        barberia_cantagallo_final = False
        
        print("   📋 BARBERÍAS FINALES:")
        for bs in final_barbershops:
            name = bs.get('name', '')
            print(f"      - {name}")
            
            if 'Barbería Dani' in name:
                barberia_dani_final = True
            elif 'BARBERIA CANTAGALLO' in name.upper():
                barberia_cantagallo_final = True
        
        # Check if we achieved the goal
        if len(final_barbershops) == 2 and barberia_dani_final and barberia_cantagallo_final:
            print(f"\n🎉 CORRECCIÓN COMPLETADA EXITOSAMENTE")
            print(f"   ✅ Solo quedan las 2 barberías legítimas:")
            print(f"      - Barbería Dani")
            print(f"      - BARBERIA CANTAGALLO")
            return True
        else:
            print(f"\n⚠️ CORRECCIÓN INCOMPLETA")
            print(f"   Expected: 2 barbershops (Barbería Dani + BARBERIA CANTAGALLO)")
            print(f"   Found: {len(final_barbershops)} barbershops")
            print(f"   Barbería Dani: {'✅' if barberia_dani_final else '❌'}")
            print(f"   BARBERIA CANTAGALLO: {'✅' if barberia_cantagallo_final else '❌'}")
            
            if len(final_barbershops) > 2:
                print(f"\n   🚨 BARBERÍAS ADICIONALES QUE DEBEN SER ELIMINADAS:")
                for bs in final_barbershops:
                    name = bs.get('name', '')
                    if 'Barbería Dani' not in name and 'BARBERIA CANTAGALLO' not in name.upper():
                        print(f"      - {name} (ID: {bs.get('id')})")
            
            return False

def main():
    tester = UrgentCorrectionTester()
    success = tester.run_urgent_correction()
    
    if success:
        print("\n🎉 URGENT CORRECTION COMPLETED SUCCESSFULLY")
        return 0
    else:
        print("\n❌ URGENT CORRECTION FAILED")
        return 1

if __name__ == "__main__":
    exit(main())