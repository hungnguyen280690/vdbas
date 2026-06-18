package com.fis.vdbas.exp.common.enums;

/**
 * Trạng thái hồ sơ CAPEX (§A11.1 của contract).
 * Lưu xuống cột {@code EXP_DOSSIER.F_STATUS VARCHAR2(100)} qua
 * {@link com.fis.vdbas.exp.common.converter.DossierStatusConverter}.
 */
public enum DossierStatus {
    DRAFT,
    SAVED,
    VALIDATED,
    SUBMITTED,
    APPROVED,
    REJECTED,
    COMPLETED,
    CANCELLED
}
