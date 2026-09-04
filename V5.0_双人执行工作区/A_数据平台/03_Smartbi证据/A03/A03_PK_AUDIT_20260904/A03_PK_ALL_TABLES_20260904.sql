SELECT 1 AS audit_order, 'V50_dim_country' AS object_name,
  COALESCE(SUM(n),0) AS total_rows, COUNT(*) AS key_groups,
  COALESCE(SUM(CASE WHEN n > 1 THEN 1 ELSE 0 END),0) AS duplicate_key_groups,
  COALESCE(SUM(n - 1),0) AS duplicate_extra_rows,
  COALESCE(SUM(CASE WHEN iso3 IS NULL THEN n ELSE 0 END),0) AS null_key_rows,
  COALESCE(SUM(CASE WHEN TRIM(CAST(iso3 AS CHAR)) = '' THEN n ELSE 0 END),0) AS blank_key_rows
FROM (SELECT iso3, COUNT(*) AS n FROM input.dim_country_gi0c3510b657b27001 GROUP BY iso3) AS pk_groups
UNION ALL
SELECT 2 AS audit_order, 'V50_dim_date' AS object_name,
  COALESCE(SUM(n),0) AS total_rows, COUNT(*) AS key_groups,
  COALESCE(SUM(CASE WHEN n > 1 THEN 1 ELSE 0 END),0) AS duplicate_key_groups,
  COALESCE(SUM(n - 1),0) AS duplicate_extra_rows,
  COALESCE(SUM(CASE WHEN date_key IS NULL THEN n ELSE 0 END),0) AS null_key_rows,
  COALESCE(SUM(CASE WHEN TRIM(CAST(date_key AS CHAR)) = '' THEN n ELSE 0 END),0) AS blank_key_rows
FROM (SELECT date_key, COUNT(*) AS n FROM input.dim_date_dpkgi0c3510fdb4327001 GROUP BY date_key) AS pk_groups
UNION ALL
SELECT 3 AS audit_order, 'V50_dim_year' AS object_name,
  COALESCE(SUM(n),0) AS total_rows, COUNT(*) AS key_groups,
  COALESCE(SUM(CASE WHEN n > 1 THEN 1 ELSE 0 END),0) AS duplicate_key_groups,
  COALESCE(SUM(n - 1),0) AS duplicate_extra_rows,
  COALESCE(SUM(CASE WHEN year_key IS NULL THEN n ELSE 0 END),0) AS null_key_rows,
  COALESCE(SUM(CASE WHEN TRIM(CAST(year_key AS CHAR)) = '' THEN n ELSE 0 END),0) AS blank_key_rows
FROM (SELECT year_key, COUNT(*) AS n FROM input.dim_year_dpkgi0c35120bf6b27000 GROUP BY year_key) AS pk_groups
UNION ALL
SELECT 4 AS audit_order, 'V50_dim_company' AS object_name,
  COALESCE(SUM(n),0) AS total_rows, COUNT(*) AS key_groups,
  COALESCE(SUM(CASE WHEN n > 1 THEN 1 ELSE 0 END),0) AS duplicate_key_groups,
  COALESCE(SUM(n - 1),0) AS duplicate_extra_rows,
  COALESCE(SUM(CASE WHEN company_id IS NULL THEN n ELSE 0 END),0) AS null_key_rows,
  COALESCE(SUM(CASE WHEN TRIM(CAST(company_id AS CHAR)) = '' THEN n ELSE 0 END),0) AS blank_key_rows
FROM (SELECT company_id, COUNT(*) AS n FROM input.dim_company GROUP BY company_id) AS pk_groups
UNION ALL
SELECT 5 AS audit_order, 'V50_dim_asset' AS object_name,
  COALESCE(SUM(n),0) AS total_rows, COUNT(*) AS key_groups,
  COALESCE(SUM(CASE WHEN n > 1 THEN 1 ELSE 0 END),0) AS duplicate_key_groups,
  COALESCE(SUM(n - 1),0) AS duplicate_extra_rows,
  COALESCE(SUM(CASE WHEN asset_id IS NULL THEN n ELSE 0 END),0) AS null_key_rows,
  COALESCE(SUM(CASE WHEN TRIM(CAST(asset_id AS CHAR)) = '' THEN n ELSE 0 END),0) AS blank_key_rows
FROM (SELECT asset_id, COUNT(*) AS n FROM input.dim_asset GROUP BY asset_id) AS pk_groups
UNION ALL
SELECT 6 AS audit_order, 'V50_dim_event' AS object_name,
  COALESCE(SUM(n),0) AS total_rows, COUNT(*) AS key_groups,
  COALESCE(SUM(CASE WHEN n > 1 THEN 1 ELSE 0 END),0) AS duplicate_key_groups,
  COALESCE(SUM(n - 1),0) AS duplicate_extra_rows,
  COALESCE(SUM(CASE WHEN event_id IS NULL THEN n ELSE 0 END),0) AS null_key_rows,
  COALESCE(SUM(CASE WHEN TRIM(CAST(event_id AS CHAR)) = '' THEN n ELSE 0 END),0) AS blank_key_rows
FROM (SELECT event_id, COUNT(*) AS n FROM input.dim_event_pkgi0c35127cfcb27000 GROUP BY event_id) AS pk_groups
UNION ALL
SELECT 7 AS audit_order, 'V50_country_exposure' AS object_name,
  COALESCE(SUM(n),0) AS total_rows, COUNT(*) AS key_groups,
  COALESCE(SUM(CASE WHEN n > 1 THEN 1 ELSE 0 END),0) AS duplicate_key_groups,
  COALESCE(SUM(n - 1),0) AS duplicate_extra_rows,
  COALESCE(SUM(CASE WHEN iso3 IS NULL OR year IS NULL THEN n ELSE 0 END),0) AS null_key_rows,
  COALESCE(SUM(CASE WHEN TRIM(CAST(iso3 AS CHAR)) = '' OR TRIM(CAST(year AS CHAR)) = '' THEN n ELSE 0 END),0) AS blank_key_rows
FROM (SELECT iso3, year, COUNT(*) AS n FROM input.v50_country_exposure GROUP BY iso3, year) AS pk_groups
UNION ALL
SELECT 8 AS audit_order, 'V50_country_monthly_risk' AS object_name,
  COALESCE(SUM(n),0) AS total_rows, COUNT(*) AS key_groups,
  COALESCE(SUM(CASE WHEN n > 1 THEN 1 ELSE 0 END),0) AS duplicate_key_groups,
  COALESCE(SUM(n - 1),0) AS duplicate_extra_rows,
  COALESCE(SUM(CASE WHEN iso3 IS NULL OR month_end IS NULL THEN n ELSE 0 END),0) AS null_key_rows,
  COALESCE(SUM(CASE WHEN TRIM(CAST(iso3 AS CHAR)) = '' OR TRIM(CAST(month_end AS CHAR)) = '' THEN n ELSE 0 END),0) AS blank_key_rows
FROM (SELECT iso3, month_end, COUNT(*) AS n FROM input.v50_country_monthly_risk GROUP BY iso3, month_end) AS pk_groups
UNION ALL
SELECT 9 AS audit_order, 'V50_country_policy_year' AS object_name,
  COALESCE(SUM(n),0) AS total_rows, COUNT(*) AS key_groups,
  COALESCE(SUM(CASE WHEN n > 1 THEN 1 ELSE 0 END),0) AS duplicate_key_groups,
  COALESCE(SUM(n - 1),0) AS duplicate_extra_rows,
  COALESCE(SUM(CASE WHEN iso3 IS NULL OR year IS NULL OR policy_code IS NULL THEN n ELSE 0 END),0) AS null_key_rows,
  COALESCE(SUM(CASE WHEN TRIM(CAST(iso3 AS CHAR)) = '' OR TRIM(CAST(year AS CHAR)) = '' OR TRIM(CAST(policy_code AS CHAR)) = '' THEN n ELSE 0 END),0) AS blank_key_rows
FROM (SELECT iso3, year, policy_code, COUNT(*) AS n FROM input.v50_country_policy_year GROUP BY iso3, year, policy_code) AS pk_groups
UNION ALL
SELECT 10 AS audit_order, 'V50_country_event' AS object_name,
  COALESCE(SUM(n),0) AS total_rows, COUNT(*) AS key_groups,
  COALESCE(SUM(CASE WHEN n > 1 THEN 1 ELSE 0 END),0) AS duplicate_key_groups,
  COALESCE(SUM(n - 1),0) AS duplicate_extra_rows,
  COALESCE(SUM(CASE WHEN event_id IS NULL THEN n ELSE 0 END),0) AS null_key_rows,
  COALESCE(SUM(CASE WHEN TRIM(CAST(event_id AS CHAR)) = '' THEN n ELSE 0 END),0) AS blank_key_rows
FROM (SELECT event_id, COUNT(*) AS n FROM input.v50_country_event GROUP BY event_id) AS pk_groups
UNION ALL
SELECT 11 AS audit_order, 'V50_global_cycle_month' AS object_name,
  COALESCE(SUM(n),0) AS total_rows, COUNT(*) AS key_groups,
  COALESCE(SUM(CASE WHEN n > 1 THEN 1 ELSE 0 END),0) AS duplicate_key_groups,
  COALESCE(SUM(n - 1),0) AS duplicate_extra_rows,
  COALESCE(SUM(CASE WHEN scope_id IS NULL OR month_end IS NULL THEN n ELSE 0 END),0) AS null_key_rows,
  COALESCE(SUM(CASE WHEN TRIM(CAST(scope_id AS CHAR)) = '' OR TRIM(CAST(month_end AS CHAR)) = '' THEN n ELSE 0 END),0) AS blank_key_rows
FROM (SELECT scope_id, month_end, COUNT(*) AS n FROM input.v50_global_cycle_month GROUP BY scope_id, month_end) AS pk_groups
UNION ALL
SELECT 12 AS audit_order, 'V50_historical_crisis_event' AS object_name,
  COALESCE(SUM(n),0) AS total_rows, COUNT(*) AS key_groups,
  COALESCE(SUM(CASE WHEN n > 1 THEN 1 ELSE 0 END),0) AS duplicate_key_groups,
  COALESCE(SUM(n - 1),0) AS duplicate_extra_rows,
  COALESCE(SUM(CASE WHEN historical_event_id IS NULL THEN n ELSE 0 END),0) AS null_key_rows,
  COALESCE(SUM(CASE WHEN TRIM(CAST(historical_event_id AS CHAR)) = '' THEN n ELSE 0 END),0) AS blank_key_rows
FROM (SELECT historical_event_id, COUNT(*) AS n FROM input.v50_historical_crisis_event GROUP BY historical_event_id) AS pk_groups
UNION ALL
SELECT 13 AS audit_order, 'V50_company_overseas_exposure' AS object_name,
  COALESCE(SUM(n),0) AS total_rows, COUNT(*) AS key_groups,
  COALESCE(SUM(CASE WHEN n > 1 THEN 1 ELSE 0 END),0) AS duplicate_key_groups,
  COALESCE(SUM(n - 1),0) AS duplicate_extra_rows,
  COALESCE(SUM(CASE WHEN company_id IS NULL OR fiscal_year IS NULL OR geography_id IS NULL THEN n ELSE 0 END),0) AS null_key_rows,
  COALESCE(SUM(CASE WHEN TRIM(CAST(company_id AS CHAR)) = '' OR TRIM(CAST(fiscal_year AS CHAR)) = '' OR TRIM(CAST(geography_id AS CHAR)) = '' THEN n ELSE 0 END),0) AS blank_key_rows
FROM (SELECT company_id, fiscal_year, geography_id, COUNT(*) AS n FROM input.v50_company_overseas_exposure GROUP BY company_id, fiscal_year, geography_id) AS pk_groups
UNION ALL
SELECT 14 AS audit_order, 'V50_bridge_company_geography' AS object_name,
  COALESCE(SUM(n),0) AS total_rows, COUNT(*) AS key_groups,
  COALESCE(SUM(CASE WHEN n > 1 THEN 1 ELSE 0 END),0) AS duplicate_key_groups,
  COALESCE(SUM(n - 1),0) AS duplicate_extra_rows,
  COALESCE(SUM(CASE WHEN bridge_id IS NULL THEN n ELSE 0 END),0) AS null_key_rows,
  COALESCE(SUM(CASE WHEN TRIM(CAST(bridge_id AS CHAR)) = '' THEN n ELSE 0 END),0) AS blank_key_rows
FROM (SELECT bridge_id, COUNT(*) AS n FROM input.v50_bridge_company_geography GROUP BY bridge_id) AS pk_groups
UNION ALL
SELECT 15 AS audit_order, 'V50_asset_monthly_return' AS object_name,
  COALESCE(SUM(n),0) AS total_rows, COUNT(*) AS key_groups,
  COALESCE(SUM(CASE WHEN n > 1 THEN 1 ELSE 0 END),0) AS duplicate_key_groups,
  COALESCE(SUM(n - 1),0) AS duplicate_extra_rows,
  COALESCE(SUM(CASE WHEN iso3 IS NULL OR month_end IS NULL OR asset_id IS NULL OR currency_basis IS NULL THEN n ELSE 0 END),0) AS null_key_rows,
  COALESCE(SUM(CASE WHEN TRIM(CAST(iso3 AS CHAR)) = '' OR TRIM(CAST(month_end AS CHAR)) = '' OR TRIM(CAST(asset_id AS CHAR)) = '' OR TRIM(CAST(currency_basis AS CHAR)) = '' THEN n ELSE 0 END),0) AS blank_key_rows
FROM (SELECT iso3, month_end, asset_id, currency_basis, COUNT(*) AS n FROM input.v50_asset_monthly_return GROUP BY iso3, month_end, asset_id, currency_basis) AS pk_groups
UNION ALL
SELECT 16 AS audit_order, 'V50_portfolio_scenario' AS object_name,
  COALESCE(SUM(n),0) AS total_rows, COUNT(*) AS key_groups,
  COALESCE(SUM(CASE WHEN n > 1 THEN 1 ELSE 0 END),0) AS duplicate_key_groups,
  COALESCE(SUM(n - 1),0) AS duplicate_extra_rows,
  COALESCE(SUM(CASE WHEN scenario_id IS NULL OR strategy_id IS NULL OR iso3 IS NULL OR window_end IS NULL OR horizon IS NULL OR run_id IS NULL THEN n ELSE 0 END),0) AS null_key_rows,
  COALESCE(SUM(CASE WHEN TRIM(CAST(scenario_id AS CHAR)) = '' OR TRIM(CAST(strategy_id AS CHAR)) = '' OR TRIM(CAST(iso3 AS CHAR)) = '' OR TRIM(CAST(window_end AS CHAR)) = '' OR TRIM(CAST(horizon AS CHAR)) = '' OR TRIM(CAST(run_id AS CHAR)) = '' THEN n ELSE 0 END),0) AS blank_key_rows
FROM (SELECT scenario_id, strategy_id, iso3, window_end, horizon, run_id, COUNT(*) AS n FROM input.v50_portfolio_scenario GROUP BY scenario_id, strategy_id, iso3, window_end, horizon, run_id) AS pk_groups
UNION ALL
SELECT 17 AS audit_order, 'V50_case_evidence' AS object_name,
  COALESCE(SUM(n),0) AS total_rows, COUNT(*) AS key_groups,
  COALESCE(SUM(CASE WHEN n > 1 THEN 1 ELSE 0 END),0) AS duplicate_key_groups,
  COALESCE(SUM(n - 1),0) AS duplicate_extra_rows,
  COALESCE(SUM(CASE WHEN case_id IS NULL THEN n ELSE 0 END),0) AS null_key_rows,
  COALESCE(SUM(CASE WHEN TRIM(CAST(case_id AS CHAR)) = '' THEN n ELSE 0 END),0) AS blank_key_rows
FROM (SELECT case_id, COUNT(*) AS n FROM input.v50_case_evidence GROUP BY case_id) AS pk_groups
UNION ALL
SELECT 18 AS audit_order, 'V50_source_registry' AS object_name,
  COALESCE(SUM(n),0) AS total_rows, COUNT(*) AS key_groups,
  COALESCE(SUM(CASE WHEN n > 1 THEN 1 ELSE 0 END),0) AS duplicate_key_groups,
  COALESCE(SUM(n - 1),0) AS duplicate_extra_rows,
  COALESCE(SUM(CASE WHEN source_id IS NULL THEN n ELSE 0 END),0) AS null_key_rows,
  COALESCE(SUM(CASE WHEN TRIM(CAST(source_id AS CHAR)) = '' THEN n ELSE 0 END),0) AS blank_key_rows
FROM (SELECT source_id, COUNT(*) AS n FROM input.v50_source_registry GROUP BY source_id) AS pk_groups
UNION ALL
SELECT 19 AS audit_order, 'V50_MVP_country_latest' AS object_name,
  COALESCE(SUM(n),0) AS total_rows, COUNT(*) AS key_groups,
  COALESCE(SUM(CASE WHEN n > 1 THEN 1 ELSE 0 END),0) AS duplicate_key_groups,
  COALESCE(SUM(n - 1),0) AS duplicate_extra_rows,
  COALESCE(SUM(CASE WHEN iso3 IS NULL THEN n ELSE 0 END),0) AS null_key_rows,
  COALESCE(SUM(CASE WHEN TRIM(CAST(iso3 AS CHAR)) = '' THEN n ELSE 0 END),0) AS blank_key_rows
FROM (SELECT iso3, COUNT(*) AS n FROM input.v50_mvp_country_latest GROUP BY iso3) AS pk_groups
UNION ALL
SELECT 20 AS audit_order, 'V50_MVP_company_data_status' AS object_name,
  COALESCE(SUM(n),0) AS total_rows, COUNT(*) AS key_groups,
  COALESCE(SUM(CASE WHEN n > 1 THEN 1 ELSE 0 END),0) AS duplicate_key_groups,
  COALESCE(SUM(n - 1),0) AS duplicate_extra_rows,
  COALESCE(SUM(CASE WHEN company_id IS NULL THEN n ELSE 0 END),0) AS null_key_rows,
  COALESCE(SUM(CASE WHEN TRIM(CAST(company_id AS CHAR)) = '' THEN n ELSE 0 END),0) AS blank_key_rows
FROM (SELECT company_id, COUNT(*) AS n FROM input.mvp_company_data_status GROUP BY company_id) AS pk_groups
UNION ALL
SELECT 21 AS audit_order, 'V50_MVP_cycle_state' AS object_name,
  COALESCE(SUM(n),0) AS total_rows, COUNT(*) AS key_groups,
  COALESCE(SUM(CASE WHEN n > 1 THEN 1 ELSE 0 END),0) AS duplicate_key_groups,
  COALESCE(SUM(n - 1),0) AS duplicate_extra_rows,
  COALESCE(SUM(CASE WHEN scope_id IS NULL OR month_end IS NULL THEN n ELSE 0 END),0) AS null_key_rows,
  COALESCE(SUM(CASE WHEN TRIM(CAST(scope_id AS CHAR)) = '' OR TRIM(CAST(month_end AS CHAR)) = '' THEN n ELSE 0 END),0) AS blank_key_rows
FROM (SELECT scope_id, month_end, COUNT(*) AS n FROM input.v50_mvp_cycle_state GROUP BY scope_id, month_end) AS pk_groups
ORDER BY audit_order
