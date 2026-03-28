# AALIE Repo-Local MCP

Servidor MCP local del repositorio para encapsular reglas contractuales de AALIE.

## Qué expone

- `get_change_context`
- `check_contract_impact`
- `validate_snapshot_contract`
- `evaluate_while_case`
- `detect_recursive_family`
- `generate_test_oracle_stub`

No expone wrappers genéricos de shell o lectura de archivos.

## Instalación

```bash
python3 -m pip install -r mcp/requirements.txt
```

## Ejecutar

```bash
python3 mcp/server.py
```

El servidor usa `stdio`.

## Integración de editor

- Cursor usa `.cursor/mcp.json`
- VS Code usa `.vscode/mcp.json` y `.vscode/tasks.json`

## Notas de runtime

- Los archivos committeados usan `python3` porque ese binario sí existe en este entorno.
- Si trabajas con venv local, reemplaza el comando por `.venv/bin/python3`.
- En Windows, apunta al ejecutable del entorno virtual correspondiente.
