from app.modules.export.document_model import _localize_analysis_text
from app.modules.export.i18n import get_export_i18n


def test_localize_analysis_text_translates_master_case_references_to_spanish():
    i18n = get_export_i18n("es")

    assert (
        _localize_analysis_text(
            "The recurrence is classified as Case 3 (subject to regularity).",
            i18n,
        )
        == "La recurrencia se clasifica como Caso 3 (sujeto a regularidad)."
    )


def test_localize_analysis_text_translates_master_case_references_to_english():
    i18n = get_export_i18n("en")

    assert (
        _localize_analysis_text(
            "La recurrencia se clasifica como Caso 2.",
            i18n,
        )
        == "The recurrence is classified as Case 2."
    )


def test_localize_analysis_text_translates_master_step_titles():
    assert (
        _localize_analysis_text("Case evaluation", get_export_i18n("es"))
        == "Evaluación de caso"
    )
    assert (
        _localize_analysis_text("Evaluación de caso", get_export_i18n("en"))
        == "Case evaluation"
    )
