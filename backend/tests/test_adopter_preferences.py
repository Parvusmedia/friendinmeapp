from app.utils.adopter_preferences import encode_breeds, encode_sizes, parse_breeds, parse_sizes


def test_parse_sizes_csv():
    assert parse_sizes("small,medium") == ["small", "medium"]


def test_parse_breeds_csv():
    assert "Mestizo" in parse_breeds("Mestizo,Labrador")


def test_encode_roundtrip():
    assert parse_sizes(encode_sizes(["large"])) == ["large"]
    assert parse_breeds(encode_breeds(["Mestizo"])) == ["Mestizo"]
