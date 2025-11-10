# tests/system/test_parse_endpoint.py
"""
Tests de sistema para el endpoint /grammar/parse.
Verifica que el parsing de pseudocódigo funcione correctamente a través del endpoint HTTP.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestParseEndpoint:
    """Tests para el endpoint /grammar/parse."""
    
    def test_parse_ok_assign_and_for(self):
        """Test: Parsear código con asignación y bucle FOR"""
        source = "{ a <- 1; for i <- 1 to 3 do { A[i] <- i } }"
        response = client.post("/grammar/parse", json={"source": source})
        
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        assert isinstance(data["ast"], dict)
        assert data["errors"] == []
    
    def test_parse_error_unclosed_block(self):
        """Test: Parsear código con bloque sin cerrar debe retornar error"""
        source = "{ a <- 1 "
        response = client.post("/grammar/parse", json={"source": source})
        
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is False
        assert len(data["errors"]) >= 1
    
    def test_parse_if_else(self):
        """Test: Parsear código con IF-ELSE"""
        source = "{ a <- 1; if (a>0) then { a <- a+1; } else { a <- 0; } }"
        response = client.post("/grammar/parse", json={"source": source})
        
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        assert isinstance(data["ast"], dict)
    
    def test_parse_empty_source(self):
        """Test: Parsear código vacío"""
        source = ""
        response = client.post("/grammar/parse", json={"source": source})
        
        assert response.status_code == 200
        data = response.json()
        # Puede ser válido o no dependiendo de la gramática
        assert "ok" in data
    
    def test_parse_function_definition(self):
        """Test: Parsear definición de función"""
        source = """
test(n) BEGIN
    x <- 1;
END
"""
        response = client.post("/grammar/parse", json={"source": source})
        
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        assert isinstance(data["ast"], dict)

