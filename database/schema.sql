DROP DATABASE IF EXISTS medicap;
CREATE DATABASE medicap CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE medicap;

-- 1. stations: map points. Never hard-deleted; the map's delete sets status to Inactive.
CREATE TABLE stations (
    station_id     INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    station_name   VARCHAR(80)   NOT NULL,
    location_text  VARCHAR(150)  NULL,
    latitude       DECIMAL(9,6)  NOT NULL,
    longitude      DECIMAL(9,6)  NOT NULL,
    contact        VARCHAR(60)   NULL,
    status         ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
    PRIMARY KEY (station_id),
    UNIQUE KEY uq_station_name (station_name),
    CONSTRAINT ck_station_lat CHECK (latitude  BETWEEN -90  AND 90),
    CONSTRAINT ck_station_lng CHECK (longitude BETWEEN -180 AND 180)
) ENGINE=InnoDB;

-- 2. users: operators belong to one station, admins to none.
CREATE TABLE users (
    user_id        INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    full_name      VARCHAR(80)   NOT NULL,
    email          VARCHAR(120)  NOT NULL,
    password_hash  VARCHAR(100)  NOT NULL,
    role           ENUM('Operator','Admin') NOT NULL,
    station_id     INT UNSIGNED  NULL,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_user_email (email),
    CONSTRAINT fk_user_station FOREIGN KEY (station_id)
        REFERENCES stations (station_id) ON DELETE RESTRICT,
    CONSTRAINT ck_operator_has_station
        CHECK (role = 'Admin' OR station_id IS NOT NULL)
) ENGINE=InnoDB;

-- 3. storage_types: Ambient / Refrigerated / Ultra-Cold and their permitted temperature range.
CREATE TABLE storage_types (
    storage_type_id  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    type_name        VARCHAR(30)   NOT NULL,
    min_temp_c       DECIMAL(5,1)  NOT NULL,
    max_temp_c       DECIMAL(5,1)  NOT NULL,
    PRIMARY KEY (storage_type_id),
    UNIQUE KEY uq_storage_type_name (type_name),
    CONSTRAINT ck_temp_range CHECK (min_temp_c < max_temp_c)
) ENGINE=InnoDB;

-- 4. medicines: the catalogue.
CREATE TABLE medicines (
    medicine_id      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    medicine_name    VARCHAR(100)  NOT NULL,
    category         VARCHAR(50)   NOT NULL,
    manufacturer     VARCHAR(80)   NOT NULL,
    description      VARCHAR(255)  NULL,
    storage_type_id  INT UNSIGNED  NOT NULL,
    PRIMARY KEY (medicine_id),
    UNIQUE KEY uq_medicine (medicine_name, manufacturer),
    CONSTRAINT fk_medicine_storage FOREIGN KEY (storage_type_id)
        REFERENCES storage_types (storage_type_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 5. medicine_batches: one manufactured lot of a medicine.
CREATE TABLE medicine_batches (
    batch_id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    medicine_id         INT UNSIGNED  NOT NULL,
    batch_number        VARCHAR(40)   NOT NULL,
    manufacturing_date  DATE          NOT NULL,
    expiry_date         DATE          NOT NULL,
    PRIMARY KEY (batch_id),
    UNIQUE KEY uq_batch (medicine_id, batch_number),
    CONSTRAINT fk_batch_medicine FOREIGN KEY (medicine_id)
        REFERENCES medicines (medicine_id) ON DELETE RESTRICT,
    CONSTRAINT ck_batch_dates CHECK (expiry_date > manufacturing_date)
) ENGINE=InnoDB;

-- 6. inventory: quantity of a batch at a station, split by condition.
-- Expired is NOT a condition; it is derived from expiry_date.
CREATE TABLE inventory (
    inventory_id      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    station_id        INT UNSIGNED  NOT NULL,
    batch_id          INT UNSIGNED  NOT NULL,
    condition_status  ENUM('Usable','Quarantined','Damaged') NOT NULL DEFAULT 'Usable',
    quantity          INT UNSIGNED  NOT NULL DEFAULT 0,
    reserved_quantity INT UNSIGNED  NOT NULL DEFAULT 0,
    PRIMARY KEY (inventory_id),
    UNIQUE KEY uq_inventory (station_id, batch_id, condition_status),
    CONSTRAINT fk_inv_station FOREIGN KEY (station_id)
        REFERENCES stations (station_id) ON DELETE RESTRICT,
    CONSTRAINT fk_inv_batch FOREIGN KEY (batch_id)
        REFERENCES medicine_batches (batch_id) ON DELETE RESTRICT,
    CONSTRAINT ck_reserved_le_qty CHECK (reserved_quantity <= quantity),
    CONSTRAINT ck_reserved_usable_only
        CHECK (condition_status = 'Usable' OR reserved_quantity = 0)
) ENGINE=InnoDB;

-- 7. station_medicine_settings: minimum stock per (station, medicine).
CREATE TABLE station_medicine_settings (
    station_id     INT UNSIGNED  NOT NULL,
    medicine_id    INT UNSIGNED  NOT NULL,
    minimum_stock  INT UNSIGNED  NOT NULL,
    PRIMARY KEY (station_id, medicine_id),
    CONSTRAINT fk_set_station FOREIGN KEY (station_id)
        REFERENCES stations (station_id) ON DELETE RESTRICT,
    CONSTRAINT fk_set_medicine FOREIGN KEY (medicine_id)
        REFERENCES medicines (medicine_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 8. trucks: each truck is simulated as an independent agent. Live position only.
CREATE TABLE trucks (
    truck_id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    plate_number       VARCHAR(20)   NOT NULL,
    capacity_units     INT UNSIGNED  NOT NULL,
    has_refrigeration  BOOLEAN       NOT NULL DEFAULT FALSE,
    status             ENUM('Idle','Loading','In Transit','Maintenance') NOT NULL DEFAULT 'Idle',
    home_station_id    INT UNSIGNED  NOT NULL,
    current_latitude   DECIMAL(9,6)  NOT NULL,
    current_longitude  DECIMAL(9,6)  NOT NULL,
    PRIMARY KEY (truck_id),
    UNIQUE KEY uq_truck_plate (plate_number),
    CONSTRAINT fk_truck_home FOREIGN KEY (home_station_id)
        REFERENCES stations (station_id) ON DELETE RESTRICT,
    CONSTRAINT ck_truck_capacity CHECK (capacity_units > 0)
) ENGINE=InnoDB;

-- 9. shipments: one truck trip carrying one or more transfers. Origin is stop #1.
CREATE TABLE shipments (
    shipment_id        INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    truck_id           INT UNSIGNED  NOT NULL,
    status             ENUM('Planned','Loading','In Transit','Completed','Cancelled')
                       NOT NULL DEFAULT 'Planned',
    planned_departure  DATETIME      NOT NULL,
    started_at         DATETIME      NULL,
    completed_at       DATETIME      NULL,
    created_by         INT UNSIGNED  NOT NULL,
    PRIMARY KEY (shipment_id),
    CONSTRAINT fk_ship_truck FOREIGN KEY (truck_id)
        REFERENCES trucks (truck_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ship_user FOREIGN KEY (created_by)
        REFERENCES users (user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 10. transfers: a request to move medicines between two stations.
CREATE TABLE transfers (
    transfer_id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    source_station_id       INT UNSIGNED  NOT NULL,
    destination_station_id  INT UNSIGNED  NOT NULL,
    shipment_id             INT UNSIGNED  NULL,
    requested_by            INT UNSIGNED  NOT NULL,
    approved_by             INT UNSIGNED  NULL,
    status                  ENUM('Requested','Approved','Dispatched','In Transit','Received','Cancelled')
                            NOT NULL DEFAULT 'Requested',
    request_date            DATETIME      NOT NULL,
    dispatch_date           DATETIME      NULL,
    receive_date            DATETIME      NULL,
    PRIMARY KEY (transfer_id),
    CONSTRAINT fk_tr_source FOREIGN KEY (source_station_id)
        REFERENCES stations (station_id) ON DELETE RESTRICT,
    CONSTRAINT fk_tr_dest FOREIGN KEY (destination_station_id)
        REFERENCES stations (station_id) ON DELETE RESTRICT,
    CONSTRAINT fk_tr_shipment FOREIGN KEY (shipment_id)
        REFERENCES shipments (shipment_id) ON DELETE RESTRICT,
    CONSTRAINT fk_tr_requested FOREIGN KEY (requested_by)
        REFERENCES users (user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_tr_approved FOREIGN KEY (approved_by)
        REFERENCES users (user_id) ON DELETE RESTRICT,
    CONSTRAINT ck_tr_stations CHECK (source_station_id <> destination_station_id)
) ENGINE=InnoDB;

-- 11. transfer_items: junction between transfers and batches.
CREATE TABLE transfer_items (
    transfer_item_id  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    transfer_id       INT UNSIGNED  NOT NULL,
    batch_id          INT UNSIGNED  NOT NULL,
    quantity          INT UNSIGNED  NOT NULL,
    PRIMARY KEY (transfer_item_id),
    UNIQUE KEY uq_transfer_batch (transfer_id, batch_id),
    CONSTRAINT fk_ti_transfer FOREIGN KEY (transfer_id)
        REFERENCES transfers (transfer_id) ON DELETE CASCADE,
    CONSTRAINT fk_ti_batch FOREIGN KEY (batch_id)
        REFERENCES medicine_batches (batch_id) ON DELETE RESTRICT,
    CONSTRAINT ck_ti_qty CHECK (quantity > 0)
) ENGINE=InnoDB;

-- 12. shipment_stops: the planned route of a shipment, in order.
CREATE TABLE shipment_stops (
    stop_id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    shipment_id        INT UNSIGNED  NOT NULL,
    stop_sequence      INT UNSIGNED  NOT NULL,
    station_id         INT UNSIGNED  NOT NULL,
    planned_arrival    DATETIME      NULL,
    actual_arrival     DATETIME      NULL,
    actual_departure   DATETIME      NULL,
    stop_status        ENUM('Pending','Arrived','Completed','Skipped') NOT NULL DEFAULT 'Pending',
    PRIMARY KEY (stop_id),
    UNIQUE KEY uq_stop_order   (shipment_id, stop_sequence),
    UNIQUE KEY uq_stop_station (shipment_id, station_id),
    CONSTRAINT fk_stop_shipment FOREIGN KEY (shipment_id)
        REFERENCES shipments (shipment_id) ON DELETE CASCADE,
    CONSTRAINT fk_stop_station FOREIGN KEY (station_id)
        REFERENCES stations (station_id) ON DELETE RESTRICT,
    CONSTRAINT ck_stop_seq CHECK (stop_sequence > 0)
) ENGINE=InnoDB;

-- 13. stock_transactions: append-only ledger of every quantity change (signed).
CREATE TABLE stock_transactions (
    transaction_id    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    station_id        INT UNSIGNED  NOT NULL,
    batch_id          INT UNSIGNED  NOT NULL,
    condition_status  ENUM('Usable','Quarantined','Damaged') NOT NULL,
    transaction_type  ENUM('Opening','Receive','Adjust','Transfer_Out','Transfer_In','Condition_Change')
                      NOT NULL,
    quantity_change   INT           NOT NULL,
    performed_by      INT UNSIGNED  NOT NULL,
    transfer_id       INT UNSIGNED  NULL,
    created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes             VARCHAR(255)  NULL,
    PRIMARY KEY (transaction_id),
    CONSTRAINT fk_st_station FOREIGN KEY (station_id)
        REFERENCES stations (station_id) ON DELETE RESTRICT,
    CONSTRAINT fk_st_batch FOREIGN KEY (batch_id)
        REFERENCES medicine_batches (batch_id) ON DELETE RESTRICT,
    CONSTRAINT fk_st_user FOREIGN KEY (performed_by)
        REFERENCES users (user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_st_transfer FOREIGN KEY (transfer_id)
        REFERENCES transfers (transfer_id) ON DELETE RESTRICT,
    CONSTRAINT ck_st_nonzero CHECK (quantity_change <> 0)
) ENGINE=InnoDB;

-- 14. temperature_logs: a reading at a station OR inside a shipment; batch_id optional.
CREATE TABLE temperature_logs (
    log_id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    station_id     INT UNSIGNED  NULL,
    shipment_id    INT UNSIGNED  NULL,
    batch_id       INT UNSIGNED  NULL,
    temperature_c  DECIMAL(5,2)  NOT NULL,
    source         ENUM('Manual','Weather_API','Simulated') NOT NULL,
    recorded_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (log_id),
    KEY idx_log_time (recorded_at),
    CONSTRAINT fk_log_station FOREIGN KEY (station_id)
        REFERENCES stations (station_id) ON DELETE RESTRICT,
    CONSTRAINT fk_log_shipment FOREIGN KEY (shipment_id)
        REFERENCES shipments (shipment_id) ON DELETE RESTRICT,
    CONSTRAINT fk_log_batch FOREIGN KEY (batch_id)
        REFERENCES medicine_batches (batch_id) ON DELETE RESTRICT,
    CONSTRAINT ck_log_one_location
        CHECK ((station_id IS NULL) <> (shipment_id IS NULL))
) ENGINE=InnoDB;

-- 15. alerts: system-generated notifications.
CREATE TABLE alerts (
    alert_id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    alert_type          ENUM('Low_Stock','Near_Expiry','Pending_Transfer','Temperature_Deviation') NOT NULL,
    severity            ENUM('Info','Warning','Critical') NOT NULL,
    message             VARCHAR(255)  NOT NULL,
    station_id          INT UNSIGNED  NULL,
    batch_id            INT UNSIGNED  NULL,
    transfer_id         INT UNSIGNED  NULL,
    shipment_id         INT UNSIGNED  NULL,
    temperature_log_id  INT UNSIGNED  NULL,
    is_acknowledged     BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (alert_id),
    KEY idx_alert_created (created_at),
    CONSTRAINT fk_al_station FOREIGN KEY (station_id)
        REFERENCES stations (station_id) ON DELETE RESTRICT,
    CONSTRAINT fk_al_batch FOREIGN KEY (batch_id)
        REFERENCES medicine_batches (batch_id) ON DELETE RESTRICT,
    CONSTRAINT fk_al_transfer FOREIGN KEY (transfer_id)
        REFERENCES transfers (transfer_id) ON DELETE RESTRICT,
    CONSTRAINT fk_al_shipment FOREIGN KEY (shipment_id)
        REFERENCES shipments (shipment_id) ON DELETE RESTRICT,
    CONSTRAINT fk_al_log FOREIGN KEY (temperature_log_id)
        REFERENCES temperature_logs (log_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 16. transfer_status_history: every status change of a transfer.
CREATE TABLE transfer_status_history (
    history_id   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    transfer_id  INT UNSIGNED  NOT NULL,
    status       ENUM('Requested','Approved','Dispatched','In Transit','Received','Cancelled') NOT NULL,
    changed_by   INT UNSIGNED  NOT NULL,
    changed_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (history_id),
    KEY idx_hist_transfer (transfer_id, changed_at),
    CONSTRAINT fk_hist_transfer FOREIGN KEY (transfer_id)
        REFERENCES transfers (transfer_id) ON DELETE CASCADE,
    CONSTRAINT fk_hist_user FOREIGN KEY (changed_by)
        REFERENCES users (user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;
