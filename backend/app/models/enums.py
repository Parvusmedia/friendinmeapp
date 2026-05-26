import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    shelter = "shelter"


class DogSize(str, enum.Enum):
    small = "small"
    medium = "medium"
    large = "large"


class DogSex(str, enum.Enum):
    male = "male"
    female = "female"
    unknown = "unknown"


class TriState(str, enum.Enum):
    yes = "yes"
    no = "no"
    unknown = "unknown"


class EnergyLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class Sociability(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    unknown = "unknown"


class DogStatus(str, enum.Enum):
    available = "available"
    reserved = "reserved"
    adopted = "adopted"
    hidden = "hidden"


class HousingType(str, enum.Enum):
    apartment = "apartment"
    house = "house"
    house_with_garden = "house_with_garden"
    rural = "rural"
    other = "other"


class DogExperience(str, enum.Enum):
    none = "none"
    low = "low"
    medium = "medium"
    high = "high"


class HoursAway(str, enum.Enum):
    h0_2 = "0-2"
    h3_5 = "3-5"
    h6_8 = "6-8"
    more_than_8 = "more_than_8"


class SizePreference(str, enum.Enum):
    small = "small"
    medium = "medium"
    large = "large"
    no_preference = "no_preference"


class EnergyPreference(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    no_preference = "no_preference"


class LeadStatus(str, enum.Enum):
    new = "new"
    contacted = "contacted"
    in_process = "in_process"
    adopted = "adopted"
    rejected = "rejected"
    archived = "archived"
    cancelled = "cancelled"


class MatchLevel(str, enum.Enum):
    excellent = "excellent"
    good = "good"
    possible = "possible"
    risky = "risky"


class ShelterApplicationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
