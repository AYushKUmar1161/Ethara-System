import pytest
from app.services.user_service import UserService
from app.models.rbac import Role, User


@pytest.mark.asyncio
async def test_user_registration(test_db):
    # 1. Seed a default role
    role = Role(name="Employee")
    test_db.add(role)
    await test_db.flush()

    service = UserService(test_db)
    
    # 2. Register user
    user = await service.register_user(
        username="newuser",
        email="newuser@example.com",
        password="secretpassword"
    )
    
    assert user.username == "newuser"
    assert user.email == "newuser@example.com"
    assert service.verify_password("secretpassword", user.hashed_password)
    assert user.role_id == role.id


@pytest.mark.asyncio
async def test_duplicate_registration_fails(test_db):
    role = Role(name="Employee")
    test_db.add(role)
    await test_db.flush()

    service = UserService(test_db)

    # Register first user
    await service.register_user(
        username="duplicate",
        email="duplicate@example.com",
        password="password123"
    )

    # Register second user with same username
    with pytest.raises(ValueError, match="Username already taken."):
        await service.register_user(
            username="duplicate",
            email="another@example.com",
            password="password123"
        )

    # Register third user with same email
    with pytest.raises(ValueError, match="Email already registered."):
        await service.register_user(
            username="another",
            email="duplicate@example.com",
            password="password123"
        )
