SELECT COUNT(*) AS total_rows,
       COUNT(cpi_index) AS non_null_rows,
       SUM(CASE WHEN cpi_index IS NULL THEN 1 ELSE 0 END) AS null_rows,
       SUM(cpi_index) AS numeric_sum,
       AVG(cpi_index) AS numeric_avg,
       MAX(cpi_index) AS numeric_max
FROM (
    SELECT iso3,
           month_end,
           fx_avg_lcu_per_usd,
           CAST(NULLIF(TRIM(cpi_index), '') AS DECIMAL(30,12)) AS cpi_index,
           fx_reserves_usd,
           reserve_import_months,
           imports_usd,
           source_id,
           source_frequency,
           fetch_date,
           data_version,
           is_proxy,
           is_imputed,
           run_id,
           fx_eom_lcu_per_usd,
           fx_eom_source,
           fx_avg_source,
           cpi_source
    FROM input.v50_country_monthly_risk
) cpi_cast_check
