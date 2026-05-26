from app.utils.age_preferences import (
    dog_age_categories,
    dog_matches_age_preference,
    encode_age_ranges,
    estimate_age_months,
    parse_age_ranges,
)


def test_parse_encode_age():
    assert parse_age_ranges("puppy,young") == ["puppy", "young"]
    assert encode_age_ranges(["adult"]) == "adult"
    assert encode_age_ranges([]) == "no_preference"


def test_estimate_age_months():
    assert estimate_age_months("8 meses") == 8
    assert estimate_age_months("3 años") == 36
    assert estimate_age_months("1 año") == 12


def test_dog_age_categories():
    assert dog_age_categories("5 meses") == {"puppy"}
    assert dog_age_categories("11 meses") == {"puppy"}
    assert dog_age_categories("1 año") == {"puppy"}
    assert dog_age_categories("14 meses") == {"young"}
    assert dog_age_categories("2 años") == {"young"}
    assert dog_age_categories("3 años") == {"young"}
    assert dog_age_categories("4 años") == {"adult"}
    assert dog_age_categories("6 años") == {"adult"}
    assert dog_age_categories("9 años") == {"senior"}


def test_match_age_filter():
    assert dog_matches_age_preference("2 años", ["young"])
    assert dog_matches_age_preference("8 meses", ["puppy"])
    assert not dog_matches_age_preference("8 años", ["puppy"])
    assert dog_matches_age_preference("9 años", ["senior"])
