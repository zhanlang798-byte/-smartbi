SELECT s.total_rows,
       s.country_count,
       s.first_month,
       s.last_month,
       s.null_key_rows,
       s.raw_null_rows,
       s.blank_string_rows,
       s.cast_null_rows,
       k.duplicate_key_groups,
       k.extra_duplicate_rows
FROM (
    SELECT COUNT(*) AS total_rows,
           COUNT(DISTINCT iso3) AS country_count,
           MIN(month_end) AS first_month,
           MAX(month_end) AS last_month,
           SUM(CASE WHEN iso3 IS NULL OR TRIM(iso3) = '' OR month_end IS NULL THEN 1 ELSE 0 END) AS null_key_rows,
           SUM(CASE WHEN cpi_index IS NULL THEN 1 ELSE 0 END) AS raw_null_rows,
           SUM(CASE WHEN cpi_index IS NOT NULL AND TRIM(cpi_index) = '' THEN 1 ELSE 0 END) AS blank_string_rows,
           SUM(CASE WHEN CAST(NULLIF(TRIM(cpi_index), '') AS DECIMAL(30,12)) IS NULL THEN 1 ELSE 0 END) AS cast_null_rows
    FROM input.v50_country_monthly_risk
) s
CROSS JOIN (
    SELECT COUNT(*) AS duplicate_key_groups,
           COALESCE(SUM(key_rows - 1), 0) AS extra_duplicate_rows
    FROM (
        SELECT iso3, month_end, COUNT(*) AS key_rows
        FROM input.v50_country_monthly_risk
        GROUP BY iso3, month_end
        HAVING COUNT(*) > 1
    ) d
) k
