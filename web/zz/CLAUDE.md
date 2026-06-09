# MIAMI DEV — Claude Code Workspace

## Environment
- Machine: DEV (Windows Server 2019 Standard)
- SQL Server: Enterprise Edition on server `DEV`, connect as `DEV\Administrator` (Windows Auth)
- Python: confirm with `python --version` (install if missing)
- Visual FoxPro 9.0 source: `D:\WMOVE`, `D:\WMOVE\PRGS`, `D:\WMOVE\classes`
- DBF data files: `X:\MOVING\WHITEGLOVE`

## SQL Server Connection
- Server name: `DEV`
- Auth: Windows Authentication (Trusted_Connection=yes)
- ODBC: prefer "ODBC Driver 18 for SQL Server"; fallback to Driver 17 or "SQL Server"
- All queries default to `master`; pass `database=` param to target others

## MCP Server
- File: `C:\GitHub\mcp\mssql_server.py`
- Config: `C:\GitHub\.mcp.json`
- Restart Claude Code after modifying config to reload MCP

## VFP / DBF Conventions
- .PRG files are plain text — read directly with the Read tool
- DBF files use Visual FoxPro format (dBASE IV/VFP variant)
- Python library: `dbfread` for reading DBF files
- Memo fields (.FPT) are paired with their .DBF — keep them together when reading
- Deleted records in DBF are soft-deleted (flag byte); `dbfread` skips them by default
- Character fields are right-padded with spaces — strip on import
- Date fields map to Python `datetime.date`, None if empty (0000-00-00)

## DBF → SQL Server Transfer Rules
- Always inspect schema first (`read_dbf_schema`) before transferring
- Map VFP types → SQL Server types:
  - C (Character) → NVARCHAR(n)
  - N (Numeric, 0 decimals) → INT or BIGINT
  - N (Numeric, >0 decimals) → DECIMAL(p, s)
  - D (Date) → DATE NULL
  - T (DateTime) → DATETIME2 NULL
  - L (Logical) → BIT NULL
  - M (Memo) → NVARCHAR(MAX)
- Stage into a schema named `stage` (CREATE SCHEMA IF NOT EXISTS)
- Table names: match DBF filename, lowercase, underscores

## Working Style
- Read .PRG files directly before modifying
- Test SQL queries with `query(sql, database=...)` before writing to files
- Confirm row counts before and after any transfer
