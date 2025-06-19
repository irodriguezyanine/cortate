from flask import Blueprint, jsonify, request

dashboard_bp = Blueprint('dashboard', __name__)
ingresos = []
reservas = []
penalizaciones = []

@dashboard_bp.route('/dashboard/<barbero_id>', methods=['GET'])
def ver_dashboard(barbero_id):
    total_ingresos = sum([i["monto"] for i in ingresos if i["barbero_id"] == barbero_id])
    total_reservas = len([r for r in reservas if r["barbero"] == barbero_id])
    total_penalizaciones = sum([p["monto"] for p in penalizaciones if p["user_id"] == barbero_id])
    
    return jsonify({
        "barbero_id": barbero_id,
        "ingresos_totales": total_ingresos,
        "reservas_recibidas": total_reservas,
        "monto_penalizaciones": total_penalizaciones
    })
