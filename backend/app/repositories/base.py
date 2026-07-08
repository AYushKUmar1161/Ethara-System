from typing import Generic, TypeVar, Type, List, Optional, Any, Dict
from sqlalchemy import select, func, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Abstract base repository for all SQLAlchemy model operations."""

    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def get_by_id(self, id: Any) -> Optional[ModelType]:
        """Fetch a single record by its primary key ID."""
        result = await self.db.execute(select(self.model).filter(self.model.id == id))
        return result.scalar_one_or_none()

    async def get_all(
        self, 
        skip: int = 0, 
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None,
        sort_by: Optional[str] = None,
        sort_desc: bool = False
    ) -> List[ModelType]:
        """Fetch all records with optional filtering, pagination, and sorting."""
        query = select(self.model)
        
        if filters:
            for field, val in filters.items():
                if hasattr(self.model, field) and val is not None:
                    query = query.filter(getattr(self.model, field) == val)
                    
        if sort_by and hasattr(self.model, sort_by):
            order_col = getattr(self.model, sort_by)
            if sort_desc:
                query = query.order_by(order_col.desc())
            else:
                query = query.order_by(order_col.asc())
        else:
            # Default sorting by ID
            query = query.order_by(self.model.id.asc())

        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Get total count of records matching filters."""
        query = select(func.count(self.model.id))
        if filters:
            for field, val in filters.items():
                if hasattr(self.model, field) and val is not None:
                    query = query.filter(getattr(self.model, field) == val)
        result = await self.db.execute(query)
        return result.scalar() or 0

    async def create(self, obj_in: Dict[str, Any]) -> ModelType:
        """Create and persist a new record."""
        db_obj = self.model(**obj_in)
        self.db.add(db_obj)
        await self.db.flush()
        return db_obj

    async def update(self, db_obj: ModelType, obj_in: Dict[str, Any]) -> ModelType:
        """Update and persist an existing record."""
        for field, value in obj_in.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        self.db.add(db_obj)
        await self.db.flush()
        return db_obj

    async def delete(self, id: Any) -> Optional[ModelType]:
        """Delete and persist a record by ID."""
        db_obj = await self.get_by_id(id)
        if db_obj:
            await self.db.delete(db_obj)
            await self.db.flush()
        return db_obj
