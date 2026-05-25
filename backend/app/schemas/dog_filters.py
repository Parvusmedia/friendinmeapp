from pydantic import BaseModel


class DogFiltersMeta(BaseModel):
    provinces: list[str]
    breeds: list[str]
