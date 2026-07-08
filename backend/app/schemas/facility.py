from typing import Optional, List
from pydantic import BaseModel


# Floor Schemas
class FloorBase(BaseModel):
    name: str
    number: int


class FloorCreate(FloorBase):
    pass


class FloorRead(FloorBase):
    id: int

    class Config:
        from_attributes = True


# Zone Schemas
class ZoneBase(BaseModel):
    floor_id: int
    name: str
    code: str


class ZoneCreate(ZoneBase):
    pass


class ZoneRead(ZoneBase):
    id: int
    floor: FloorRead

    class Config:
        from_attributes = True


# Bay Schemas
class BayBase(BaseModel):
    zone_id: int
    name: str
    code: str


class BayCreate(BayBase):
    pass


class BayRead(BayBase):
    id: int
    zone: ZoneRead

    class Config:
        from_attributes = True


# Seat Schemas
class SeatBase(BaseModel):
    bay_id: int
    number: str
    status: str = "Available"
    type: str = "Standard"


class SeatCreate(SeatBase):
    pass


class SeatUpdate(BaseModel):
    status: Optional[str] = None
    type: Optional[str] = None


class SeatRead(SeatBase):
    id: int
    bay: BayRead

    class Config:
        from_attributes = True
