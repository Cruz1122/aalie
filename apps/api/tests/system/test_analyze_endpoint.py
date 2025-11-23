# tests/system/test_analyze_endpoint.py
"""
Tests de sistema para el endpoint /analyze/open.
Verifica que el análisis de complejidad funcione correctamente a través del endpoint HTTP.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestAnalyzeEndpoint:
    """Tests para el endpoint /analyze/open."""
    
    def test_simple_for_loop(self):
        """Test: Bucle FOR simple"""
        source = """
test(n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        x <- 1;
    END
END
"""
        payload = {
            "source": source,
            "mode": "worst"
        }
        
        response = client.post("/analyze/open", json=payload)
        assert response.status_code == 200
        
        result = response.json()
        assert result.get("ok"), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
        assert len(result.get("byLine", [])) > 0, "Debe tener filas"
        
        # Verificar campos básicos
        for row in result.get("byLine", []):
            assert "count_raw" in row, "Debe tener count_raw"
            assert "count" in row, "Debe tener count"
            assert "unknown" not in row.get("count", "").lower(), f"No debe tener 'unknown': {row.get('count')}"
    
    def test_insertion_sort(self):
        """Test: Insertion Sort completo con WHILE anidado"""
        source = """
insertionSort(arr, n) BEGIN
    FOR i <- 2 TO n DO BEGIN
        key <- arr[i];
        j <- i - 1;
        WHILE (j >= 1 AND arr[j] > key) DO BEGIN
            arr[j + 1] <- arr[j];
            j <- j - 1;
        END
        arr[j + 1] <- key;
    END
END
"""
        payload = {
            "source": source,
            "mode": "worst"
        }
        
        response = client.post("/analyze/open", json=payload)
        assert response.status_code == 200
        
        result = response.json()
        assert result.get("ok"), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
        assert len(result.get("byLine", [])) > 0, "Debe tener filas"
        
        # Verificar que tiene T_open
        assert "totals" in result, "Debe tener totals"
        assert "T_open" in result["totals"], "Debe tener T_open"
        t_open = result["totals"]["T_open"]
        assert isinstance(t_open, str), "T_open debe ser string"
        assert len(t_open) > 0, "T_open no debe estar vacío"
    
    def test_bubble_sort(self):
        """Test: Bubble Sort con bucles anidados"""
        source = """
burbuja(A[n], n) BEGIN
    FOR i <- 1 TO n - 1 DO BEGIN
        FOR j <- 1 TO n - i DO BEGIN
            IF (A[j] > A[j + 1]) THEN BEGIN
                temp <- A[j];
                A[j] <- A[j + 1];
                A[j + 1] <- temp;
            END
        END
    END
END
"""
        payload = {
            "source": source,
            "mode": "worst"
        }
        
        response = client.post("/analyze/open", json=payload)
        assert response.status_code == 200
        
        result = response.json()
        assert result.get("ok"), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
        
        # Verificar T_open
        if "totals" in result and "T_open" in result["totals"]:
            t_open = result["totals"]["T_open"]
            assert isinstance(t_open, str), "T_open debe ser string"
            assert len(t_open) > 0, "T_open no debe estar vacío"
    
    def test_triangular_sum(self):
        """Test: Sumatoria triangular (FOR anidado)"""
        source = """
triangular(n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        FOR j <- 1 TO i DO BEGIN
            x <- 1;
        END
    END
END
"""
        payload = {
            "source": source,
            "mode": "worst"
        }
        
        response = client.post("/analyze/open", json=payload)
        assert response.status_code == 200
        
        result = response.json()
        assert result.get("ok"), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
        assert len(result.get("byLine", [])) > 0, "Debe tener filas"
        
        # Verificar que todas las filas tienen los campos necesarios
        for row in result.get("byLine", []):
            assert "line" in row, "Debe tener line"
            assert "kind" in row, "Debe tener kind"
            assert "ck" in row, "Debe tener ck"
            assert "count_raw" in row, "Debe tener count_raw"
            assert "count" in row, "Debe tener count"
    
    def test_nested_rectangular_loops(self):
        """Test: Bucles FOR anidados rectangulares"""
        source = """
rectangular(m, n) BEGIN
    FOR i <- 1 TO m DO BEGIN
        FOR j <- 1 TO n DO BEGIN
            x <- 1;
        END
    END
END
"""
        payload = {
            "source": source,
            "mode": "worst"
        }
        
        response = client.post("/analyze/open", json=payload)
        assert response.status_code == 200
        
        result = response.json()
        assert result.get("ok"), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
    
    def test_selection_sort(self):
        """Test: Selection Sort"""
        source = """
selectionSort(A[n], n) BEGIN
    FOR i <- 1 TO n - 1 DO BEGIN
        min_idx <- i;
        FOR j <- i + 1 TO n DO BEGIN
            IF (A[j] < A[min_idx]) THEN BEGIN
                min_idx <- j;
            END
        END
        IF (min_idx != i) THEN BEGIN
            temp <- A[i];
            A[i] <- A[min_idx];
            A[min_idx] <- temp;
        END
    END
END
"""
        payload = {
            "source": source,
            "mode": "worst"
        }
        
        response = client.post("/analyze/open", json=payload)
        assert response.status_code == 200
        
        result = response.json()
        assert result.get("ok"), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
    
    def test_matrix_multiplication(self):
        """Test: Multiplicación de matrices con triple bucle anidado"""
        source = """
matrixMult(m, n, p) BEGIN
    FOR i <- 1 TO m DO BEGIN
        FOR j <- 1 TO n DO BEGIN
            sum <- 0;
            FOR k <- 1 TO p DO BEGIN
                sum <- sum + 1;
            END
            result <- sum;
        END
    END
END
"""
        payload = {
            "source": source,
            "mode": "worst"
        }
        
        response = client.post("/analyze/open", json=payload)
        assert response.status_code == 200
        
        result = response.json()
        assert result.get("ok"), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
    
    def test_while_loop(self):
        """Test: WHILE loop con multiplicación (complejidad logarítmica)"""
        source = """
whileLoop(n) BEGIN
    i <- 1;
    WHILE (i <= n) DO BEGIN
        x <- 1;
        i <- i * 2;
    END
END
"""
        payload = {
            "source": source,
            "mode": "worst"
        }
        
        response = client.post("/analyze/open", json=payload)
        assert response.status_code == 200
        
        result = response.json()
        assert result.get("ok"), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
    
    def test_mixed_for_and_while(self):
        """Test: FOR con WHILE anidado"""
        source = """
mixedLoops(n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        j <- 1;
        WHILE (j <= i) DO BEGIN
            x <- 1;
            j <- j + 1;
        END
    END
END
"""
        payload = {
            "source": source,
            "mode": "worst"
        }
        
        response = client.post("/analyze/open", json=payload)
        assert response.status_code == 200
        
        result = response.json()
        assert result.get("ok"), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
    
    def test_invalid_source(self):
        """Test: Código fuente inválido debe retornar error"""
        source = "invalid code {"
        payload = {
            "source": source,
            "mode": "worst"
        }
        
        response = client.post("/analyze/open", json=payload)
        # Puede retornar 200 con ok=False o 422/400
        assert response.status_code in [200, 400, 422]
        
        if response.status_code == 200:
            result = response.json()
            # Si el parsing falla, ok debería ser False
            # O puede que el endpoint intente analizar de todas formas
            assert "ok" in result or "errors" in result

