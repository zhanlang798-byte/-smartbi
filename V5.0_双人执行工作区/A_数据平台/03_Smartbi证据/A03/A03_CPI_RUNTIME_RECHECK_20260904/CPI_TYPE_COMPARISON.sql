SELECT COUNT(*) AS total_rows,
       COUNT(cpi_index) AS non_null_rows,
       SUM(CASE WHEN cpi_index IS NULL THEN 1 ELSE 0 END) AS null_rows,
       MAX(cpi_index) AS raw_max,
       MAX(CAST(NULLIF(TRIM(cpi_index), '') AS DECIMAL(30,12))) AS numeric_max,
       AVG(CAST(NULLIF(TRIM(cpi_index), '') AS DECIMAL(30,12))) AS numeric_avg
FROM input.v50_country_monthly_risk
