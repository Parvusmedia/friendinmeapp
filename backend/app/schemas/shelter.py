from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ShelterBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    phone: str = Field(min_length=5, max_length=64)
    province: str
    city: str
    address: str | None = None
    description: str = ""
    website: str | None = None
    instagram: str = ""
    contact_person: str = ""
    contact_mobile: str = ""
    whatsapp: str = ""


class ShelterCreate(ShelterBase):
    pass


class ShelterUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    province: str | None = None
    city: str | None = None
    address: str | None = None
    description: str | None = None
    website: str | None = None
    instagram: str | None = None
    contact_person: str | None = None
    contact_mobile: str | None = None
    whatsapp: str | None = None


class ShelterRead(ShelterBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ShelterUserBrief(BaseModel):
    id: int
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class ShelterDogBrief(BaseModel):
    id: int
    name: str
    status: str
    city: str
    province: str
    breed: str

    model_config = ConfigDict(from_attributes=True)


class ShelterManageRead(BaseModel):
    shelter: ShelterRead
    dog_count: int
    user_count: int
    users: list[ShelterUserBrief]
    dogs: list[ShelterDogBrief]
