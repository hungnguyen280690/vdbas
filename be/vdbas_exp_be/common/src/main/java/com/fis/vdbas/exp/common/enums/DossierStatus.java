package com.fis.vdbas.exp.common.enums;

/**
 * Trạng thái hồ sơ — union CAPEX + OPEX.
 * Lưu xuống cột {@code EXP_DOSSIER.F_STATUS VARCHAR2(100)} qua
 * {@link com.fis.vdbas.exp.common.converter.DossierStatusConverter}.
 *
 * <p>8 hằng đầu là state machine CAPEX (§A11.1). 9 hằng cuối (GAP-02) là state machine
 * OPEX Maker–Checker–Approver (§A11 contract OPEX) — thêm theo hướng additive, KHÔNG đổi/xoá
 * hằng CAPEX. {@code DELETED} dùng chung cho soft-delete OPEX (GAP-07). Bảng dùng chung
 * 1 cột F_STATUS / 1 converter nên buộc mở rộng union (không tách enum riêng).</p>
 */
public enum DossierStatus {
    // ── CAPEX ──
    DRAFT,
    SAVED,
    VALIDATED,
    SUBMITTED,
    APPROVED,
    REJECTED,
    COMPLETED,
    CANCELLED,
    // ── OPEX (additive — GAP-02) ──
    PENDING_CHECKER,
    CHECKED,
    APPROVAL_PENDING,
    APPROVAL_REJECTED,
    CHECK_REJECTED,
    CHECK_CANCELLED,
    APPROVAL_CANCELLED,
    REJECTED_BY_CHECKER,
    DELETED
}
