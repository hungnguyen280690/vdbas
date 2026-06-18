package com.fis.vdbas.exp.common.enums;

/**
 * Vai trò thực hiện trong luồng phê duyệt Maker–Checker–Approver.
 * Lưu xuống cột {@code EXP_APPROVAL_LOG.ACTION_ROLE VARCHAR2(100)} qua
 * {@link com.fis.vdbas.exp.common.converter.ActionRoleConverter}.
 */
public enum ActionRole {
    MAKER,
    CHECKER,
    APPROVER
}
