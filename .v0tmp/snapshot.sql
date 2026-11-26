SELECT a.name AS agencia,
  (SELECT count(*) FROM staff s WHERE s.agency_id = a.id) AS colaboradores,
  (SELECT md5(coalesce(string_agg(s.id::text, ',' ORDER BY s.id), '')) FROM staff s WHERE s.agency_id = a.id) AS hash_colab,
  (SELECT count(*) FROM bank_accounts b WHERE b.agency_id = a.id) AS cuentas,
  (SELECT coalesce(sum(b.current_balance), 0) FROM bank_accounts b WHERE b.agency_id = a.id) AS saldo_total,
  (SELECT md5(coalesce(string_agg(b.id::text || ':' || coalesce(b.current_balance, 0)::text, ',' ORDER BY b.id), '')) FROM bank_accounts b WHERE b.agency_id = a.id) AS hash_cuentas,
  (SELECT count(*) FROM bank_movements m WHERE m.agency_id = a.id) AS movimientos,
  (SELECT count(*) FROM payroll_periods p WHERE p.agency_id = a.id) AS nominas,
  (SELECT count(*) FROM incentives i WHERE i.agency_id = a.id) AS incentivos
FROM agencies a
ORDER BY a.name;
