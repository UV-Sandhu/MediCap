USE medicap;

INSERT INTO stations (station_id, station_name, location_text, latitude, longitude, contact, status) VALUES
(1, 'Station A - Bengaluru Central', 'Bengaluru',  12.971600, 77.594600, '+91-80-5550-0101', 'Active'),
(2, 'Station B - Tumakuru',          'Tumakuru',   13.339200, 77.114000, '+91-816-555-0102', 'Active'),
(3, 'Station C - Chitradurga',       'Chitradurga',14.222600, 76.398000, '+91-8194-55-0103', 'Active'),
(4, 'Station D - Mysuru',            'Mysuru',     12.295800, 76.639400, '+91-821-555-0104', 'Active'),
(5, 'Station E - Mangaluru',         'Mangaluru',  12.914100, 74.856000, '+91-824-555-0105', 'Active');

INSERT INTO users (user_id, full_name, email, password_hash, role, station_id) VALUES
(1, 'System Admin',  'admin@medicap.local',   '$2b$12$AVjF.JeuRyyr6q/vn3mRDO92iqXlM4SKBUwLvBynh1SGpupMMo6TC', 'Admin',    NULL),
(2, 'Karthik Rao',   'karthik@medicap.local', '$2b$12$AVjF.JeuRyyr6q/vn3mRDO92iqXlM4SKBUwLvBynh1SGpupMMo6TC', 'Operator', 1),
(3, 'Meera Iyer',    'meera@medicap.local',   '$2b$12$AVjF.JeuRyyr6q/vn3mRDO92iqXlM4SKBUwLvBynh1SGpupMMo6TC', 'Operator', 2),
(4, 'Sanjay Patil',  'sanjay@medicap.local',  '$2b$12$AVjF.JeuRyyr6q/vn3mRDO92iqXlM4SKBUwLvBynh1SGpupMMo6TC', 'Operator', 3),
(5, 'Divya Shetty',  'divya@medicap.local',   '$2b$12$AVjF.JeuRyyr6q/vn3mRDO92iqXlM4SKBUwLvBynh1SGpupMMo6TC', 'Operator', 4),
(6, 'Faisal Khan',   'faisal@medicap.local',  '$2b$12$AVjF.JeuRyyr6q/vn3mRDO92iqXlM4SKBUwLvBynh1SGpupMMo6TC', 'Operator', 5);

INSERT INTO storage_types (storage_type_id, type_name, min_temp_c, max_temp_c) VALUES
(1, 'Ambient',       15.0,  25.0),
(2, 'Refrigerated',   2.0,   8.0),
(3, 'Ultra-Cold',   -90.0, -60.0);

INSERT INTO medicines (medicine_id, medicine_name, category, manufacturer, description, storage_type_id) VALUES
(1,  'Paracetamol 500mg Tablets',   'Analgesic',    'Meridian Pharma',      'Pain and fever relief',            1),
(2,  'Amoxicillin 250mg Capsules',  'Antibiotic',   'NovaCure Labs',        'Broad-spectrum antibiotic',        1),
(3,  'Insulin Glargine 100 IU/mL',  'Antidiabetic', 'Helix Biologics',      'Long-acting insulin',              2),
(4,  'Hepatitis B Vaccine',         'Vaccine',      'ArcticVax Ltd',        'Adult hepatitis B immunisation',   2),
(5,  'MMR Vaccine',                 'Vaccine',      'ArcticVax Ltd',        'Measles, mumps and rubella',       2),
(6,  'mRNA COVID-19 Vaccine',       'Vaccine',      'Helix Biologics',      'Requires ultra-cold storage',      3),
(7,  'Oxytocin Injection 10 IU/mL', 'Hormone',      'NovaCure Labs',        'Obstetric use',                    2),
(8,  'Oral Rehydration Salts',      'Rehydration',  'Meridian Pharma',      'Sachets for dehydration',          1),
(9,  'Rapid Antigen Test Kit',      'Diagnostics',  'Sterling Diagnostics', 'Fragile diagnostic kit',           1),
(10, 'Tetanus Toxoid Vaccine',      'Vaccine',      'ArcticVax Ltd',        'Tetanus immunisation',             2);

INSERT INTO medicine_batches (batch_id, medicine_id, batch_number, manufacturing_date, expiry_date) VALUES
(1,  1,  'PCM-2501', '2025-03-01', '2027-03-01'),
(2,  1,  'PCM-2402', '2024-02-01', '2026-10-31'),
(3,  2,  'AMX-2509', '2025-09-10', '2027-09-10'),
(4,  3,  'INS-2606', '2026-06-01', '2027-06-01'),
(5,  3,  'INS-2512', '2025-12-01', '2026-12-05'),
(6,  4,  'HBV-2607', '2026-07-01', '2028-07-01'),
(7,  5,  'MMR-2605', '2026-05-01', '2027-11-01'),
(8,  6,  'MRN-2608', '2026-08-15', '2027-02-15'),
(9,  7,  'OXY-2604', '2026-04-01', '2027-04-01'),
(10, 8,  'ORS-2603', '2026-03-01', '2028-03-01'),
(11, 9,  'RAT-2602', '2026-02-01', '2027-08-01'),
(12, 10, 'TTX-2606', '2026-06-15', '2027-12-15');

INSERT INTO inventory (station_id, batch_id, condition_status, quantity, reserved_quantity) VALUES
(1, 1,  'Usable',      500,  0),
(1, 3,  'Usable',      300, 50),
(1, 4,  'Usable',      120, 20),
(1, 6,  'Usable',      200, 30),
(1, 8,  'Usable',       60,  0),
(1, 11, 'Usable',       80,  0),
(1, 12, 'Usable',      150,  0),
(1, 7,  'Usable',       20,  0),
(2, 1,  'Usable',      150,  0),
(2, 2,  'Usable',       40,  0),
(2, 4,  'Usable',       30,  0),
(2, 5,  'Usable',       25,  0),
(2, 7,  'Usable',       90,  0),
(2, 9,  'Usable',       12,  0),
(3, 1,  'Usable',       20,  0),
(3, 3,  'Usable',       80,  0),
(3, 6,  'Usable',       45,  0),
(3, 6,  'Quarantined',   5,  0),
(3, 10, 'Usable',      400,  0),
(4, 4,  'Usable',       70,  0),
(4, 5,  'Usable',       10,  0),
(4, 5,  'Damaged',       4,  0),
(4, 7,  'Usable',       40,  0),
(4, 8,  'Usable',       25,  0),
(4, 11, 'Usable',       30,  0),
(4, 12, 'Usable',       40,  0),
(5, 3,  'Usable',       10,  0),
(5, 10, 'Usable',      120,  0),
(5, 6,  'Usable',       30,  0),
(5, 9,  'Quarantined',   5,  0);

INSERT INTO station_medicine_settings (station_id, medicine_id, minimum_stock) VALUES
(1, 1, 100), (1, 2, 100), (1, 3, 50), (1, 4, 40),
(2, 1,  50), (2, 3,  20), (2, 5, 40), (2, 7, 20),
(3, 1,  50), (3, 2,  30), (3, 4, 20), (3, 8, 100),
(4, 3,  30), (4, 5,  30), (4, 6, 20),
(5, 2,  30), (5, 4,  20), (5, 8, 60);

INSERT INTO trucks (truck_id, plate_number, capacity_units, has_refrigeration, status, home_station_id, current_latitude, current_longitude) VALUES
(1, 'KA-01-MC-1001', 500, TRUE,  'Idle',        1, 12.971600, 77.594600),
(2, 'KA-01-MC-1002', 500, TRUE,  'In Transit',  1, 13.155400, 77.354300),
(3, 'KA-01-MC-1003', 800, FALSE, 'Idle',        1, 12.971600, 77.594600),
(4, 'KA-01-MC-1004', 300, TRUE,  'Maintenance', 3, 14.222600, 76.398000);

INSERT INTO shipments (shipment_id, truck_id, status, planned_departure, started_at, completed_at, created_by) VALUES
(1, 2, 'In Transit', '2026-11-14 07:30:00', '2026-11-14 07:45:00', NULL,                  2),
(2, 1, 'Completed',  '2026-11-09 06:00:00', '2026-11-09 06:00:00', '2026-11-09 11:30:00', 5),
(3, 3, 'Planned',    '2026-11-15 06:00:00', NULL,                  NULL,                  2);

INSERT INTO transfers (transfer_id, source_station_id, destination_station_id, shipment_id, requested_by, approved_by, status, request_date, dispatch_date, receive_date) VALUES
(1, 1, 2, 1,    2, 2,    'In Transit', '2026-11-12 10:00:00', '2026-11-14 07:45:00', NULL),
(2, 1, 3, 1,    2, 2,    'In Transit', '2026-11-12 10:05:00', '2026-11-14 07:45:00', NULL),
(3, 4, 1, 2,    5, 5,    'Received',   '2026-11-08 09:00:00', '2026-11-09 06:00:00', '2026-11-09 11:30:00'),
(4, 1, 5, NULL, 2, NULL, 'Requested',  '2026-11-14 09:30:00', NULL,                  NULL),
(5, 1, 4, 3,    2, 2,    'Approved',   '2026-11-13 14:00:00', NULL,                  NULL),
(6, 2, 3, NULL, 3, NULL, 'Cancelled',  '2026-11-10 12:00:00', NULL,                  NULL);

INSERT INTO transfer_items (transfer_id, batch_id, quantity) VALUES
(1, 4,  20),
(2, 6,  30),
(2, 3,  50),
(3, 7,  20),
(4, 3,  100),
(5, 11, 20),
(6, 1,  30);

INSERT INTO shipment_stops (shipment_id, stop_sequence, station_id, planned_arrival, actual_arrival, actual_departure, stop_status) VALUES
(1, 1, 1, '2026-11-14 07:30:00', '2026-11-14 07:30:00', '2026-11-14 07:45:00', 'Completed'),
(1, 2, 2, '2026-11-14 10:15:00', NULL, NULL, 'Pending'),
(1, 3, 3, '2026-11-14 14:30:00', NULL, NULL, 'Pending'),
(2, 1, 4, '2026-11-09 05:45:00', '2026-11-09 05:45:00', '2026-11-09 06:00:00', 'Completed'),
(2, 2, 1, '2026-11-09 11:15:00', '2026-11-09 11:30:00', NULL, 'Completed'),
(3, 1, 1, '2026-11-15 06:00:00', NULL, NULL, 'Pending'),
(3, 2, 4, '2026-11-15 10:00:00', NULL, NULL, 'Pending');

INSERT INTO stock_transactions (station_id, batch_id, condition_status, transaction_type, quantity_change, performed_by, transfer_id, created_at, notes) VALUES
(1, 1, 'Usable',      'Opening',          500, 1, NULL, '2026-11-01 09:00:00', 'Opening balance'),
(4, 7, 'Usable',      'Transfer_Out',     -20, 5, 3,    '2026-11-09 11:30:00', 'Left source stock on receipt confirmation'),
(1, 7, 'Usable',      'Transfer_In',       20, 2, 3,    '2026-11-09 11:30:00', NULL),
(4, 5, 'Usable',      'Condition_Change',  -4, 5, NULL, '2026-11-11 10:00:00', 'Cold-chain break, moved to damaged'),
(4, 5, 'Damaged',     'Condition_Change',   4, 5, NULL, '2026-11-11 10:00:00', 'Cold-chain break, moved to damaged'),
(3, 6, 'Usable',      'Condition_Change',  -5, 4, NULL, '2026-11-12 15:00:00', 'Held for inspection'),
(3, 6, 'Quarantined', 'Condition_Change',   5, 4, NULL, '2026-11-12 15:00:00', 'Held for inspection'),
(2, 9, 'Usable',      'Adjust',            -3, 3, NULL, '2026-11-13 11:00:00', 'Stock count correction');

INSERT INTO temperature_logs (log_id, station_id, shipment_id, batch_id, temperature_c, source, recorded_at) VALUES
(1, 2,    NULL, 4,    6.20, 'Manual',      '2026-11-13 09:00:00'),
(2, 2,    NULL, 5,    9.40, 'Manual',      '2026-11-13 15:30:00'),
(3, 4,    NULL, 8,  -72.00, 'Manual',      '2026-11-13 10:00:00'),
(4, NULL, 1,    NULL, 24.50, 'Weather_API','2026-11-14 08:10:00'),
(5, NULL, 1,    NULL, 31.20, 'Weather_API','2026-11-14 08:40:00');

INSERT INTO alerts (alert_id, alert_type, severity, message, station_id, batch_id, transfer_id, shipment_id, temperature_log_id, is_acknowledged, created_at) VALUES
(1, 'Low_Stock',             'Warning',  'Oxytocin Injection at Station B: 12 units, minimum is 20',                        2, 9,    NULL, NULL, NULL, FALSE, '2026-11-13 11:05:00'),
(2, 'Low_Stock',             'Warning',  'Paracetamol 500mg at Station C: 20 units, minimum is 50',                         3, 1,    NULL, NULL, NULL, FALSE, '2026-11-12 08:00:00'),
(3, 'Near_Expiry',           'Warning',  'Insulin Glargine batch INS-2512 at Station B expires on 2026-12-05',              2, 5,    NULL, NULL, NULL, FALSE, '2026-11-13 08:00:00'),
(4, 'Near_Expiry',           'Critical', 'Paracetamol batch PCM-2402 at Station B has EXPIRED (2026-10-31)',                2, 2,    NULL, NULL, NULL, FALSE, '2026-11-01 08:00:00'),
(5, 'Pending_Transfer',      'Info',     'Transfer 4 (Station A to Station E) is waiting for approval',                     1, NULL, 4,    NULL, NULL, FALSE, '2026-11-14 09:30:00'),
(6, 'Temperature_Deviation', 'Critical', 'Insulin batch INS-2512 at Station B read 9.4 C (allowed 2.0 to 8.0 C)',          2, 5,    NULL, NULL, 2,    FALSE, '2026-11-13 15:30:00'),
(7, 'Temperature_Deviation', 'Critical', 'Shipment 1 ambient reading 31.2 C is above the refrigerated range 2.0 to 8.0 C', NULL, 4, NULL, 1,    5,    FALSE, '2026-11-14 08:40:00');

INSERT INTO transfer_status_history (transfer_id, status, changed_by, changed_at) VALUES
(1, 'Requested',  2, '2026-11-12 10:00:00'),
(1, 'Approved',   2, '2026-11-12 10:20:00'),
(1, 'Dispatched', 2, '2026-11-14 07:30:00'),
(1, 'In Transit', 2, '2026-11-14 07:45:00'),
(2, 'Requested',  2, '2026-11-12 10:05:00'),
(2, 'Approved',   2, '2026-11-12 10:20:00'),
(2, 'Dispatched', 2, '2026-11-14 07:30:00'),
(2, 'In Transit', 2, '2026-11-14 07:45:00'),
(3, 'Requested',  5, '2026-11-08 09:00:00'),
(3, 'Approved',   5, '2026-11-08 09:30:00'),
(3, 'Dispatched', 5, '2026-11-09 05:45:00'),
(3, 'In Transit', 5, '2026-11-09 06:00:00'),
(3, 'Received',   2, '2026-11-09 11:30:00'),
(4, 'Requested',  2, '2026-11-14 09:30:00'),
(5, 'Requested',  2, '2026-11-13 14:00:00'),
(5, 'Approved',   2, '2026-11-13 14:30:00'),
(6, 'Requested',  3, '2026-11-10 12:00:00'),
(6, 'Cancelled',  3, '2026-11-10 16:00:00');
