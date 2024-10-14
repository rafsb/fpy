SELECT *
	   , CASE WHEN (available - IIF(orders_sap_actual > fcast_siop_actual, orders_sap_actual, fcast_siop_actual)) < 0 THEN 0 ELSE (available - IIF(orders_sap_actual > fcast_siop_actual, orders_sap_actual, fcast_siop_actual)) END AS stock_balance_siop_sap
       , CASE WHEN aging_days <= 90  THEN '1- menor que 3M'
	          WHEN aging_days > 90 AND aging_days <= 180  THEN '2- entre 3M e 6M'
		      WHEN aging_days > 180 AND aging_days <= 270  THEN '3- entre 6M e 9M'
			  WHEN aging_days > 270 AND aging_days <= 365  THEN '4- entre 9M e 1A'
			  WHEN aging_days > 365 AND aging_days <= 730  THEN '5- entre 1A e 2A'
			  ELSE '6- maior de 2A' END AS aging_period
		, CASE WHEN (orders_sap_actual>0 OR fcast_siop_actual>0) AND (available - IIF(orders_sap_actual > fcast_siop_actual, orders_sap_actual, fcast_siop_actual))<=0 THEN 'C/DEMANDA' WHEN (orders_sap_actual>0 OR fcast_siop_actual>0) AND (available - IIF(orders_sap_actual > fcast_siop_actual, orders_sap_actual, fcast_siop_actual))>0 THEN 'DEMANDA_PARCIAL' WHEN orders_sap_actual<=0 OR fcast_siop_actual<=0 AND (available - IIF(orders_sap_actual > fcast_siop_actual, orders_sap_actual, fcast_siop_actual))>=0  THEN 'S/DEMANDA' ELSE '' END AS status_fcast_actual
FROM(
SELECT T1.[date], T1.[sku], T1.[sku_description], T1.[size], T1.[tp_produto], T1.[plant], T1.[region_stock], T1.[warehouse], T1.[ag_code], T1.[status_2], T1.[value_unit], T1.[available], T1.[quality], T1.[blocked], T1.[volume_total], T1.[special_flag], T1.[customer_1], T1.[customer_2], T1.[label], T1.[last_production], T1.[aging_days], T1.[volume_ibp], T1.[ABC_region], T1.[ABC_bpsa], T1.[pallets_ibp], T1.[sku_dist], T1.[dist], T1.[wooden_pallets], T1.[lot], T1.[plant_lot], T1.[or_last_prod], T1.[net_stock], T1.[pallet_default], T1.[pallets_net_stock], T1.[coord_cff]
	   , ROUND(ISNULL(T5.Pedido * (T1.volume_total / (SUM(T1.volume_total) OVER (PARTITION BY T1.[date], T1.sku))), 0),6) AS orders_sap_actual
	   , ROUND(ISNULL(T6.SIOP_fcast * (T1.volume_total / (SUM(T1.volume_total) OVER (PARTITION BY T1.[date], T1.sku))), 0),6) AS fcast_siop_actual
FROM(
SELECT	T1.[date]
		, T1.sku
		, T1.sku_description
		, T1.size
		, T1.tp_produto
		, T1.plant
		, T1.region_stock
		, T1.warehouse
		, T1.ag_code
		, T1.status_2
		, 'Million' AS value_unit
		, T1.available
		, T1.quality
		, T1.blocked
		, T1.volume_total
		, T1.special_flag
		, ISNULL(T4.comercial_group, T1.customer) AS customer_1
		, ISNULL(T4.group_global, T1.customer) AS customer_2
	    , T1.[label]
		, (LEFT(T1.sku,6)+LEFT(T1.[plant],2)+T3.circ_country+T1.size) AS sku_key
		, CASE WHEN LEFT(T1.sku,1) = 'C' THEN ISNULL(CONVERT(DATE, dm.dbo.last_production_plant(T1.sku, T1.plant_lot, DATEADD(MI, 1439, CONVERT(DATETIME, T1.[date])))), ISNULL(dm.dbo.last_production_bpsa(T1.sku, DATEADD(MI, 1439, CONVERT(DATETIME, T1.[date]))), '2017-12-31')) ELSE CAST(GETDATE() AS DATE) END AS last_production
        , CASE WHEN LEFT(T1.sku,1) = 'C' THEN DATEDIFF(dd, ISNULL(dm.dbo.last_production_plant(T1.sku, T1.plant_lot, DATEADD(MI, 1439, CONVERT(DATETIME, T1.[date]))), ISNULL(dm.dbo.last_production_bpsa(T1.sku, DATEADD(MI, 1439, CONVERT(DATETIME, T1.[date]))), '2017-12-31')), CAST(T1.[date] AS DATE)) ELSE 0 END AS aging_days
		, T1.volume_ibp
		, T1.ABC_region
		, T1.ABC_bpsa
		, T1.pallets_ibp
		, T1.sku_dist
		, T1.dist
		, T1.wooden_pallets
		, T1.lot
		, T1.plant_lot
		, T1.or_last_prod
		, IIF((volume_ibp-or_last_prod) < 0, 0, (volume_ibp-or_last_prod)) AS net_stock
        , CASE WHEN LEFT(T1.sku,1) = 'C' THEN ISNULL(d.pallet_qty, 8.169)/1000 WHEN LEFT(T1.sku,1) = 'T' THEN 289.800/1000 WHEN LEFT(T1.sku,1) = 'E' THEN 275.310/1000 ELSE 0 END AS pallet_default
		, CASE WHEN LEFT(T1.sku,1) = 'C' THEN CEILING((IIF((volume_ibp-or_last_prod) < 0, 0, (volume_ibp-or_last_prod))*1000000) / (ISNULL(d.pallet_qty, 8.169)*1000)) WHEN LEFT(T1.sku,1) = 'T' THEN CEILING((IIF((volume_ibp-or_last_prod) < 0, 0, (volume_ibp-or_last_prod))*1000000)  / (289.800*1000)) WHEN LEFT(T1.sku,1) = 'E' THEN CEILING((IIF((volume_ibp-or_last_prod) < 0, 0, (volume_ibp-or_last_prod))*1000000)  / (275.310*1000)) ELSE 0 END AS pallets_net_stock
		, CASE WHEN LEFT(T1.sku,3) = 'CA-' THEN	'Genérico' ELSE ISNULL(ISNULL(T4.coord_fulfillment,T5.coord_fulfillment),'-') END AS coord_cff
FROM(
SELECT		T1.dt AS 'date'
			, T1.sku
			, T1.sku_description
			, T1.size
			, T1.tp_produto
			, CASE WHEN T1.plant IN ('BRPD', 'RIPD') THEN 'BRPA' WHEN T1.plant IN ('RISC') THEN 'BR3R' ELSE T1.plant END AS plant
			, T1.region_stock
			, T1.warehouse
			, T1.status_2
			, 'Million' AS value_unit
			, T1.available AS available
			, T1.quality AS quality
			, T1.blocked AS blocked
			, T1.volume_total
			, T1.special_flag
			, T1.ag_code
			, T2.material_group_0 AS customer
			, T2.material_group_2 AS [label]
			, T1.g2
			, T1.volume_ibp
			, T1.ABC_region
			, T1.ABC_bpsa
			, T1.pallets_ibp
			, T1.sku_dist
			, T1.dist
			, T1.wooden_pallets / 1000 AS wooden_pallets
			, T1.lot
			, T1.plant_lot
			, ROUND(ISNULL(IIF(SUM(T3.over_run)/1000 < 0, 0, SUM(T3.over_run)/1000),0) * IIF((SUM(T1.volume_ibp) OVER (PARTITION BY T1.sku, plant_lot)) = 0, 0, (T1.volume_ibp / SUM(T1.volume_ibp) OVER (PARTITION BY T1.sku, plant_lot))),6) AS or_last_prod
FROM (		
SELECT	* FROM [dm].[dbo].[inventory_can_end_bpsa_abc_00h] AS T1
WHERE T1.tp_produto = 'Lata' AND YEAR(T1.dt) = YEAR(GETDATE()) AND DAY(T1.dt) = 1 
	  --AND T1.sku = 'CAABSKR-20-255B20'
UNION
SELECT	* FROM [dm].[dbo].[inventory_can_end_bpsa_abc_00h] AS T1
WHERE T1.tp_produto = 'Lata' AND T1.dt = CAST(GETDATE() AS DATE) 
      --AND T1.sku = 'CAABSKR-20-255B20'
) AS T1

LEFT JOIN (SELECT sku, material_group_0, material_group_2 FROM [dm].[dbo].[skus] GROUP BY sku, material_group_0, material_group_2) AS T2 ON T1.sku = T2.sku

LEFT JOIN (
SELECT DISTINCT	T1.[sku]
		, T1.[plant]
		, ([provided_qty]-[planned_qty]) AS over_run
		, release_date
		, CONVERT(TIME, production_date) AS [real_start_time]
		, T2.production_date 
FROM [dm].[dbo].[coid_production] AS T1
RIGHT JOIN (
SELECT	[sku]
		, [plant]
		, MAX(production_date) AS production_date
FROM (SELECT [sku]
			 , [plant]
			 , [release_date]
			 , [real_start_time]
			 , ([release_date]+[real_start_time]) AS production_date
	  FROM [dm].[dbo].[coid_production]
	  GROUP BY [sku], [plant], [release_date], [real_start_time]) AS T1
GROUP BY [sku], [plant]
) AS T2 ON T2.[sku] = T1.[sku] AND T2.[plant] = T1.[plant] AND CONVERT(DATE, T2.production_date) = T1.release_date AND CONVERT(TIME, T2.production_date) = CONVERT(TIME, T1.[real_start_time])
) AS T3 ON T1.sku = T3.sku AND T1.plant_lot = T3.plant

LEFT JOIN [dm].[dbo].[info_size] AS T5 ON T5.[cod_size] = IIF(RIGHT(T1.[sku],1) = 'X', LEFT(RIGHT(T1.[sku],4),2), IIF(ISNUMERIC(LEFT(RIGHT(T1.[sku],3),2)) = 1, RIGHT(T1.[sku],4), LEFT(RIGHT(T1.[sku],3),2)))

WHERE (T1.special_flag NOT IN ('M')) AND (T1.inv_location IN ('Internal', 'External')) AND (T1.plant <> 'BRCA') AND (warehouse LIKE ('07%') OR warehouse LIKE ('N%') OR warehouse LIKE ('')) AND (T1.available+T1.quality+T1.blocked+T1.[volume_ibp]) <> 0

	  /*FILTROS PARA SELECIONAR APENAS O ESTOQUE VENDÁVEL*/
	  --(warehouse IN ('0700', '0707', '') OR warehouse LIKE 'N%') AND special_flag NOT IN ('M','E') AND (T1.inv_location IN ('Internal', 'External')) AND T1.plant <> 'BRCA' AND T1.status_2 NOT IN ('O2', 'O3') AND (T1.available+T1.quality+T1.blocked+T1.[volume_ibp]) <> 0

GROUP BY T1.dt
		 , T1.sku
		 , T1.sku_description
		 , T1.size
		 , T1.tp_produto
		 , T2.material_group_0
		 , T2.material_group_2
		 , T3.release_date
		 , CASE WHEN T1.plant IN ('BRPD', 'RIPD') THEN 'BRPA' WHEN T1.plant IN ('RISC') THEN 'BR3R' ELSE T1.plant END
		 , T1.region_stock
		 , T1.warehouse
		 , T1.status_2
		 , T1.available
		 , T1.quality
		 , T1.blocked
		 , T1.volume_total
		 , T1.special_flag
		 , T1.ag_code
		 , T1.g2
		 , T1.ABC_region
		 , T1.ABC_bpsa
		 , T1.pallets_ibp
		 , T1.sku_dist
		 , T1.dist
		 , T1.wooden_pallets
		 , T1.lot
		 , T1.plant_lot 
		 , T1.volume_ibp) AS T1
LEFT JOIN (SELECT [sku], group_desc, material_group_1, material_group_5, MAX(IIF([pallet_qty] > 1000, [pallet_qty] / 1000, [pallet_qty])) AS plt
           FROM [dm].[dbo].[skus] WHERE sku NOT LIKE 'C%' GROUP BY [sku], group_desc, material_group_1, material_group_5) s ON T1.sku = s.sku

LEFT JOIN (SELECT sku, size, pallet_qty FROM [dm].[dbo].[sku_can_info] GROUP BY sku, size, pallet_qty) d ON RIGHT(T1.sku, 4) = d.sku

LEFT JOIN (SELECT DISTINCT [sku_part],[prod_vs_dist_vs_circ],[prod_country],[circ_country] FROM [dm].[dbo].[sku_prod_dist_circ]) AS T3 ON T3.sku_part = SUBSTRING(T1.sku,9,2)

LEFT JOIN (SELECT sku_key, T1.comercial_group, T1.comercial_group_2, T1.group_global, T3.coord_fulfillment
           FROM(SELECT (LEFT(T1.[sku_code],6)+T1.[country_from]+T2.circ_country+T1.[sku_size]) AS sku_key, T1.comercial_group, T1.comercial_group_2, T1.group_global, RANK() OVER (PARTITION BY (LEFT(T1.[sku_code],6)+T1.[country_from]+T2.circ_country+T1.[sku_size]) ORDER BY SUM(T1.sales_qty_MM) DESC, billing_date DESC) AS ranking
                FROM [dm].[dbo].[sales_ztco0018_2014_YTD] AS T1
                LEFT JOIN (SELECT DISTINCT [sku_part],[prod_vs_dist_vs_circ],[prod_country],[circ_country] FROM [dm].[dbo].[sku_prod_dist_circ]) AS T2 ON T2.sku_part = SUBSTRING([sku_code],9,2)
                WHERE T1.tp_produto = 'Lata'
                GROUP BY (LEFT(T1.[sku_code],6)+T1.[country_from]+T2.circ_country+T1.[sku_size]), T1.comercial_group, T1.comercial_group_2, T1.group_global, billing_date) AS T1
           LEFT JOIN (SELECT DISTINCT [comercial_group], [coord_fulfillment] FROM [dm].[dbo].[customer] WHERE comercial_group <> '' GROUP BY [comercial_group], [coord_fulfillment]) AS T3 ON T1.comercial_group = T3.comercial_group
           WHERE T1.ranking = 1 AND sku_key IS NOT NULL) AS T4 ON T4.sku_key = (LEFT(T1.sku,6)+LEFT(T1.[plant],2)+T3.circ_country+T1.size)

LEFT JOIN (SELECT sku_key, T1.comercial_group, T1.comercial_group_2, T3.coord_fulfillment
           FROM(SELECT (LEFT(T1.[sku_code],4)+T2.circ_country) AS sku_key, T1.comercial_group, T1.comercial_group_2, RANK() OVER (PARTITION BY (LEFT(T1.[sku_code],4)+T2.circ_country) ORDER BY SUM(T1.sales_qty_MM) DESC, billing_date DESC) AS ranking
                FROM [dm].[dbo].[sales_ztco0018_2014_YTD] AS T1
                LEFT JOIN (SELECT DISTINCT [sku_part],[prod_vs_dist_vs_circ],[circ_country] FROM [dm].[dbo].[sku_prod_dist_circ]) AS T2 ON T2.sku_part = SUBSTRING([sku_code],9,2)
                WHERE T1.tp_produto = 'Lata'
                GROUP BY (LEFT(T1.[sku_code],4)+T2.circ_country), T1.comercial_group, T1.comercial_group_2, billing_date) AS T1
           LEFT JOIN (SELECT DISTINCT [comercial_group], [coord_fulfillment] FROM [dm].[dbo].[customer] WHERE comercial_group <> '' GROUP BY [comercial_group], [coord_fulfillment]) AS T3 ON T1.comercial_group = T3.comercial_group
           WHERE T1.ranking = 1 AND sku_key IS NOT NULL) AS T5 ON T5.sku_key = (LEFT(T1.sku,4)+T3.circ_country)

) AS T1
LEFT JOIN (SELECT [ref_date], [sku], SUM(Pedido) AS Pedido FROM (
           SELECT CONVERT(DATE, [timestamp]) AS [ref_date], sku, (SUM(shipment_quantity) + SUM(balance_quantity))/1000 AS Pedido
		   FROM [dm].[dbo].[sales_schedule_history_view] 
           WHERE (shipment_quantity + balance_quantity) > 0 
                 AND DATEPART(HOUR, [timestamp]) = 1
	             AND CONVERT(DATE, [timestamp]) > EOMONTH([shipping_date], - 2)
           GROUP BY CONVERT(DATE, [timestamp]), sku
           UNION
           SELECT CONVERT(DATE, [timestamp]) AS [ref_date], sku, (SUM(shipment_quantity) + SUM(balance_quantity))/1000 AS Pedido
           FROM [dm_backup].[dbo].[sales_schedule_history_view]
           WHERE (shipment_quantity + balance_quantity) > 0 
                 AND DATEPART(HOUR, [timestamp]) = 1
	             AND CONVERT(DATE, [timestamp]) > EOMONTH([shipping_date], - 2)
           GROUP BY CONVERT(DATE, [timestamp]), sku) AS T1
           GROUP BY [ref_date], [sku]) AS T5 ON T1.sku = T5.sku AND T1.[date] = T5.[ref_date]

LEFT JOIN (SELECT [ref_date], [sku], SUM([forecast_qty]) AS SIOP_fcast 
		   FROM [dm].[dbo].[dp_forecast_base_view]
           WHERE ([demand_date] >= [ref_date]) AND ([demand_date] < DATEADD(M, 3, [ref_date])) AND (forecast_type = 'SIOP') AND [forecast_qty] <> 0 AND YEAR([ref_date]) >= 2024
           GROUP BY [ref_date], [sku]) AS T6 ON T1.sku = T6.sku AND DATEADD(D, 1, EOMONTH(T1.[date], -1)) = T6.ref_date
) AS T1
ORDER BY T1.[date], T1.sku