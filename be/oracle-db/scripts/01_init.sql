-- Initialization script for local Oracle database
-- This script runs automatically on the first container startup.

-- 1. Switch to the PDB created by the environment variable
ALTER SESSION SET CONTAINER = QTTT_DB;

-- 2. Create the application user (nentangso)
-- Use a block to handle if user already exists (though unlikely on first run)
BEGIN
    EXECUTE IMMEDIATE 'CREATE USER nentangso IDENTIFIED BY "qttt@123"';
    EXECUTE IMMEDIATE 'GRANT CONNECT, RESOURCE, DBA TO nentangso';
    EXECUTE IMMEDIATE 'ALTER USER nentangso QUOTA UNLIMITED ON USERS';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -1920 THEN
            RAISE;
        END IF;
END;
/

-- 3. Create tables in the nentangso schema
-- We specify the schema explicitly to ensure ownership.

CREATE TABLE nentangso.administrative_units (
    id RAW(16) PRIMARY KEY,
    unit_code VARCHAR2(20) NOT NULL,
    unit_name VARCHAR2(255) NOT NULL,
    unit_level NUMBER(10) NOT NULL,
    unit_type VARCHAR2(50),
    parent_id RAW(16),
    is_active NUMBER(1) DEFAULT 1,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    is_deleted NUMBER(1) DEFAULT 0 NOT NULL,
    created_by VARCHAR2(50),
    created_at TIMESTAMP,
    updated_by VARCHAR2(50),
    updated_at TIMESTAMP,
    CONSTRAINT fk_admin_unit_parent FOREIGN KEY (parent_id) REFERENCES nentangso.administrative_units(id)
);

CREATE TABLE nentangso.administrative_transformations (
    id RAW(16) PRIMARY KEY,
    source_unit_id RAW(16) NOT NULL,
    target_unit_id RAW(16) NOT NULL,
    transformation_type VARCHAR2(20),
    effective_date TIMESTAMP NOT NULL,
    decision_number VARCHAR2(100),
    created_by VARCHAR2(50),
    created_at TIMESTAMP,
    CONSTRAINT fk_admin_trans_source FOREIGN KEY (source_unit_id) REFERENCES nentangso.administrative_units(id),
    CONSTRAINT fk_admin_trans_target FOREIGN KEY (target_unit_id) REFERENCES nentangso.administrative_units(id)
);

CREATE TABLE nentangso.person_profiles (
    id RAW(16) PRIMARY KEY,
    full_name VARCHAR2(255) NOT NULL,
    email VARCHAR2(250),
    phone VARCHAR2(20),
    identity_number VARCHAR2(20),
    gender VARCHAR2(10),
    is_internal NUMBER(1) DEFAULT 0 NOT NULL,
    is_active NUMBER(1) DEFAULT 1 NOT NULL,
    is_deleted NUMBER(1) DEFAULT 0 NOT NULL,
    created_by VARCHAR2(50),
    created_at TIMESTAMP,
    updated_by VARCHAR2(50),
    updated_at TIMESTAMP
);

CREATE TABLE nentangso.organization_profiles (
    id RAW(16) PRIMARY KEY,
    org_code VARCHAR2(50) UNIQUE NOT NULL,
    org_name VARCHAR2(255) NOT NULL,
    email VARCHAR2(100),
    phone VARCHAR2(20),
    address CLOB,
    org_type VARCHAR2(50),
    parent_id RAW(16),
    unit_id RAW(16),
    paths VARCHAR2(255),
    is_active NUMBER(1) DEFAULT 1,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    is_deleted NUMBER(1) DEFAULT 0 NOT NULL,
    created_by VARCHAR2(50),
    created_at TIMESTAMP,
    updated_by VARCHAR2(50),
    updated_at TIMESTAMP,
    CONSTRAINT fk_org_parent FOREIGN KEY (parent_id) REFERENCES nentangso.organization_profiles(id),
    CONSTRAINT fk_org_unit FOREIGN KEY (unit_id) REFERENCES nentangso.administrative_units(id)
);

CREATE TABLE nentangso.organization_person (
    id RAW(16) PRIMARY KEY,
    person_id RAW(16) NOT NULL,
    org_id RAW(16) NOT NULL,
    position_name VARCHAR2(255),
    position_code VARCHAR2(255),
    is_main NUMBER(1) DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active NUMBER(1) DEFAULT 1,
    created_by VARCHAR2(50),
    created_at TIMESTAMP,
    CONSTRAINT fk_org_person_person FOREIGN KEY (person_id) REFERENCES nentangso.person_profiles(id),
    CONSTRAINT fk_org_person_org FOREIGN KEY (org_id) REFERENCES nentangso.organization_profiles(id)
);

CREATE TABLE nentangso.organization_mngmt_scope (
    id RAW(16) PRIMARY KEY,
    manager_org_id RAW(16) NOT NULL,
    target_org_type VARCHAR2(50),
    target_org_id RAW(16),
    manage_scope_type VARCHAR2(20) DEFAULT 'DIRECT',
    description CLOB,
    created_by VARCHAR2(50),
    created_at TIMESTAMP,
    CONSTRAINT fk_mngmt_scope_manager FOREIGN KEY (manager_org_id) REFERENCES nentangso.organization_profiles(id),
    CONSTRAINT fk_mngmt_scope_target FOREIGN KEY (target_org_id) REFERENCES nentangso.organization_profiles(id)
);

CREATE TABLE nentangso.organization_transformations (
    id RAW(16) PRIMARY KEY,
    source_org_id RAW(16) NOT NULL,
    target_org_id RAW(16) NOT NULL,
    transformation_type VARCHAR2(20),
    effective_date TIMESTAMP NOT NULL,
    decision_number VARCHAR2(100),
    created_by VARCHAR2(50),
    created_at TIMESTAMP,
    CONSTRAINT fk_org_trans_source FOREIGN KEY (source_org_id) REFERENCES nentangso.organization_profiles(id),
    CONSTRAINT fk_org_trans_target FOREIGN KEY (target_org_id) REFERENCES nentangso.organization_profiles(id)
);

CREATE TABLE nentangso.applications (
    id RAW(16) PRIMARY KEY,
    app_code VARCHAR2(50) UNIQUE NOT NULL,
    app_name VARCHAR2(255) NOT NULL,
    app_url VARCHAR2(300),
    org_id RAW(16),
    client_id VARCHAR2(50),
    client_secret VARCHAR2(255),
    admin_info CLOB,
    description CLOB,
    is_active NUMBER(1) DEFAULT 1,
    is_deleted NUMBER(1) DEFAULT 0 NOT NULL,
    created_by VARCHAR2(50),
    created_at TIMESTAMP,
    updated_by VARCHAR2(50),
    updated_at TIMESTAMP,
    CONSTRAINT fk_app_org FOREIGN KEY (org_id) REFERENCES nentangso.organization_profiles(id)
);

CREATE TABLE nentangso.roles (
    app_code VARCHAR2(50) NOT NULL,
    role_code VARCHAR2(50) NOT NULL,
    role_name VARCHAR2(255) NOT NULL,
    is_deleted NUMBER(1) DEFAULT 0 NOT NULL,
    created_by VARCHAR2(50),
    created_at TIMESTAMP,
    updated_by VARCHAR2(50),
    updated_at TIMESTAMP,
    PRIMARY KEY (app_code, role_code)
);

CREATE TABLE nentangso.permissions (
    app_code VARCHAR2(50) NOT NULL,
    permission_code VARCHAR2(100) NOT NULL,
    permission_name VARCHAR2(255) NOT NULL,
    permission_name_en VARCHAR2(255),
    parent_code VARCHAR2(100),
    type VARCHAR2(20) NOT NULL,
    path VARCHAR2(255),
    method VARCHAR2(10),
    created_by VARCHAR2(50),
    created_at TIMESTAMP,
    PRIMARY KEY (app_code, permission_code)
);

CREATE TABLE nentangso.role_permission (
    app_code VARCHAR2(50) NOT NULL,
    role_code VARCHAR2(50) NOT NULL,
    permission_code VARCHAR2(100) NOT NULL,
    created_by VARCHAR2(50),
    created_at TIMESTAMP,
    PRIMARY KEY (app_code, role_code, permission_code),
    CONSTRAINT fk_role_permission_role FOREIGN KEY (app_code, role_code) REFERENCES nentangso.roles(app_code, role_code),
    CONSTRAINT fk_role_permission_perm FOREIGN KEY (app_code, permission_code) REFERENCES nentangso.permissions(app_code, permission_code)
);

CREATE TABLE nentangso.users (
    id RAW(16) PRIMARY KEY,
    username VARCHAR2(50) UNIQUE NOT NULL,
    external_id VARCHAR2(255),
    auth_source VARCHAR2(20),
    owner_id RAW(16) NOT NULL,
    owner_type VARCHAR2(10),
    is_org_admin NUMBER(1) DEFAULT 0,
    display_name VARCHAR2(255),
    user_type VARCHAR2(20),
    status NUMBER(10),
    is_deleted NUMBER(1) DEFAULT 0 NOT NULL,
    created_by VARCHAR2(50),
    created_at TIMESTAMP,
    updated_by VARCHAR2(50),
    updated_at TIMESTAMP
);

CREATE TABLE nentangso.user_role (
    user_id RAW(16) NOT NULL,
    app_code VARCHAR2(50) NOT NULL,
    role_code VARCHAR2(50) NOT NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_by VARCHAR2(50),
    created_at TIMESTAMP,
    PRIMARY KEY (user_id, app_code, role_code),
    CONSTRAINT fk_user_role_user FOREIGN KEY (user_id) REFERENCES nentangso.users(id),
    CONSTRAINT fk_user_role_role FOREIGN KEY (app_code, role_code) REFERENCES nentangso.roles(app_code, role_code)
);
