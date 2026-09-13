from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleUpdate


class VehicleService:
    def list_vehicles(
        self,
        db: Session,
        logistics_user_id: Optional[str] = None,
        availability_status: Optional[str] = None,
    ) -> List[Vehicle]:
        query = db.query(Vehicle)
        if logistics_user_id:
            query = query.filter(Vehicle.logistics_user_id == logistics_user_id)
        if availability_status:
            query = query.filter(Vehicle.availability_status == availability_status)
        return query.order_by(Vehicle.created_at.desc()).all()

    def get_vehicle(self, db: Session, vehicle_id: str) -> Vehicle:
        vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vehicle '{vehicle_id}' not found.",
            )
        return vehicle

    def create_vehicle(
        self, db: Session, logistics_user_id: str, vehicle_in: VehicleCreate
    ) -> Vehicle:
        # Check duplicate registration number
        existing = (
            db.query(Vehicle)
            .filter(Vehicle.vehicle_number == vehicle_in.vehicle_number.strip().upper())
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Vehicle number '{vehicle_in.vehicle_number}' is already registered.",
            )

        vehicle = Vehicle(
            logistics_user_id=logistics_user_id,
            vehicle_number=vehicle_in.vehicle_number.strip().upper(),
            vehicle_type=vehicle_in.vehicle_type.strip().upper(),
            capacity=vehicle_in.capacity,
            availability_status="AVAILABLE",
        )
        db.add(vehicle)
        db.commit()
        db.refresh(vehicle)
        return vehicle

    def update_vehicle(
        self,
        db: Session,
        vehicle_id: str,
        vehicle_in: VehicleUpdate,
        logistics_user_id: Optional[str] = None,
    ) -> Vehicle:
        vehicle = self.get_vehicle(db, vehicle_id)
        if logistics_user_id and vehicle.logistics_user_id != logistics_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to manage this vehicle.",
            )

        if vehicle_in.vehicle_type is not None:
            vehicle.vehicle_type = vehicle_in.vehicle_type.strip().upper()
        if vehicle_in.capacity is not None:
            vehicle.capacity = vehicle_in.capacity
        if vehicle_in.availability_status is not None:
            vehicle.availability_status = vehicle_in.availability_status.strip().upper()
        if vehicle_in.current_latitude is not None:
            vehicle.current_latitude = vehicle_in.current_latitude
        if vehicle_in.current_longitude is not None:
            vehicle.current_longitude = vehicle_in.current_longitude

        db.commit()
        db.refresh(vehicle)
        return vehicle


vehicle_service = VehicleService()
