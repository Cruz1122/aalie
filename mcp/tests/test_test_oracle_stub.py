from tools.generate_test_oracle_stub import generate_test_oracle_stub


def test_generate_test_oracle_stub_for_while_case_uses_symbolic_mode_when_supported():
    source = """linear(n) BEGIN
  i <- 0;
  WHILE (i < n) DO BEGIN
    i <- i + 1;
  END
END"""

    result = generate_test_oracle_stub(source=source)

    assert result["ok"] is True
    assert result["focus"] == "while"
    assert result["comparison_mode"] == "symbolic"
    assert "iterations_expr" in result["required_fields"]
    assert result["suggested_contract_values"]["pattern_detected"] == "linear_counter"


def test_generate_test_oracle_stub_for_recursive_case_exposes_family_fields():
    source = """factorial(n) BEGIN
  IF (n <= 1) THEN BEGIN
    RETURN 1;
  END
  RETURN n * factorial(n - 1);
END"""

    result = generate_test_oracle_stub(source=source)

    assert result["ok"] is True
    assert result["focus"] == "recursive"
    assert result["comparison_mode"] == "symbolic"
    assert "family" in result["required_fields"]
    assert (
        result["suggested_contract_values"]["default_method"]
        == "characteristic_equation"
    )


def test_generate_test_oracle_stub_for_export_focus_is_contractual():
    source = "sumatoria(n) BEGIN RETURN n; END"
    result = generate_test_oracle_stub(
        source=source,
        changed_paths=["apps/api/app/modules/export/engine.py"],
    )

    assert result["ok"] is True
    assert result["focus"] == "export_snapshot"
    assert result["comparison_mode"] == "contractual"
    assert "schemaVersion" in result["required_fields"]


def test_generate_test_oracle_stub_for_inconclusive_while_stays_contractual():
    source = """stuck(n) BEGIN
  i <- 0;
  WHILE (i < n) DO BEGIN
    x <- x + 1;
  END
END"""

    result = generate_test_oracle_stub(source=source)

    assert result["ok"] is True
    assert result["focus"] == "while"
    assert result["comparison_mode"] == "contractual"
